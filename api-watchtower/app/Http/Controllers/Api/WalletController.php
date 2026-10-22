<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\PaymentIntent;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WalletController extends Controller
{
    public function show(Organization $organization): JsonResponse
    {
        $this->authorize('view', $organization);

        $wallet = $organization->wallet()->firstOrCreate(
            ['organization_id' => $organization->id, 'currency' => 'NGN'],
            ['balance_cents' => 0, 'available_cents' => 0, 'held_cents' => 0, 'status' => 'active']
        );

        $transactions = $wallet->transactions()->latest()->limit(50)->get();

        return response()->json([
            'data' => [
                'wallet' => [
                    'id' => $wallet->id,
                    'currency' => $wallet->currency,
                    'balance_cents' => $wallet->balance_cents,
                    'available_cents' => $wallet->available_cents,
                    'held_cents' => $wallet->held_cents,
                    'status' => $wallet->status,
                ],
                'transactions' => $transactions->map(fn ($t) => [
                    'id' => $t->id,
                    'type' => $t->type,
                    'amount_cents' => $t->amount_cents,
                    'net_cents' => $t->net_cents,
                    'reason' => $t->reason,
                    'reference' => $t->reference,
                    'balance_after_cents' => $t->balance_after_cents,
                    'created_at' => $t->created_at,
                ]),
            ],
        ]);
    }

    public function initializeFunding(Request $request, Organization $organization): JsonResponse
    {
        $this->authorize('update', $organization);

        $data = $request->validate([
            'amount' => 'required|integer|min:100',
            'currency' => 'nullable|in:NGN,USD',
        ]);

        $currency = $data['currency'] ?? 'NGN';
        $amountCents = $data['amount'] * 100;
        $reference = 'WT-'.Str::upper(Str::random(16));

        PaymentIntent::create([
            'organization_id' => $organization->id,
            'provider' => 'paystack',
            'reference' => $reference,
            'amount_cents' => $amountCents,
            'currency' => $currency,
            'status' => 'pending',
            'metadata' => ['email' => $request->user()->email],
        ]);

        // Return Paystack-style initialization payload for the frontend.
        // In production, call Paystack API here and return authorization_url.
        // For now we return a structured payload the UI can consume.
        return response()->json([
            'data' => [
                'reference' => $reference,
                'amount_cents' => $amountCents,
                'currency' => $currency,
                'public_key' => config('services.paystack.public_key'),
                'email' => $request->user()->email,
                // When Paystack is fully configured, replace with real URL
                'authorization_url' => null,
                'message' => 'Payment initialization prepared. Configure PAYSTACK_SECRET_KEY/PUBLIC_KEY to enable live funding.',
            ],
        ]);
    }

    public function verifyFunding(Request $request, Organization $organization): JsonResponse
    {
        $this->authorize('update', $organization);

        $data = $request->validate([
            'reference' => 'required|string',
        ]);

        $intent = PaymentIntent::where('organization_id', $organization->id)
            ->where('reference', $data['reference'])
            ->firstOrFail();

        if ($intent->status === 'succeeded') {
            return response()->json(['message' => 'Already credited']);
        }

        // In production verify with Paystack. Here we simulate a successful
        // settlement only after verification - we never auto-credit on init.
        // This avoids the "auto-refund after 24h" footgun: funds only become
        // available_cents after webhook/verification marks as succeeded.
        $wallet = $organization->wallet()->firstOrCreate(
            ['organization_id' => $organization->id, 'currency' => $intent->currency],
            ['balance_cents' => 0, 'available_cents' => 0, 'held_cents' => 0, 'status' => 'active']
        );

        DB::transaction(function () use ($wallet, $intent) {
            $wallet = Wallet::where('id', $wallet->id)->lockForUpdate()->first();
            $wallet->balance_cents += $intent->amount_cents;
            $wallet->available_cents += $intent->amount_cents;
            $wallet->save();

            WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'organization_id' => $wallet->organization_id,
                'user_id' => auth()->id(),
                'type' => 'credit',
                'amount_cents' => $intent->amount_cents,
                'fee_cents' => 0,
                'net_cents' => $intent->amount_cents,
                'reason' => 'funding',
                'reference' => $intent->reference,
                'idempotency_key' => 'funding:'.$intent->reference,
                'meta' => ['provider' => $intent->provider],
                'balance_after_cents' => $wallet->balance_cents,
            ]);

            $intent->status = 'succeeded';
            $intent->webhook_received_at = now();
            $intent->save();
        });

        return response()->json(['message' => 'Wallet funded successfully']);
    }

    public function paystackWebhook(Request $request): JsonResponse
    {
        // Verify signature in production using config('services.paystack.secret_key')
        $payload = $request->all();
        $event = $payload['event'] ?? null;

        if ($event === 'charge.success') {
            $data = $payload['data'] ?? [];
            $reference = $data['reference'] ?? null;
            if (! $reference) {
                return response()->json(['message' => 'ok']);
            }

            $intent = PaymentIntent::where('reference', $reference)->first();
            if (! $intent || $intent->status === 'succeeded') {
                return response()->json(['message' => 'ok']);
            }

            $wallet = $intent->organization->wallet()->firstOrCreate(
                ['organization_id' => $intent->organization_id, 'currency' => $intent->currency],
                ['balance_cents' => 0, 'available_cents' => 0, 'held_cents' => 0, 'status' => 'active']
            );

            DB::transaction(function () use ($wallet, $intent) {
                $wallet = Wallet::where('id', $wallet->id)->lockForUpdate()->first();
                $wallet->balance_cents += $intent->amount_cents;
                $wallet->available_cents += $intent->amount_cents;
                $wallet->save();

                WalletTransaction::firstOrCreate(
                    ['idempotency_key' => 'funding:'.$intent->reference],
                    [
                        'wallet_id' => $wallet->id,
                        'organization_id' => $wallet->organization_id,
                        'user_id' => null,
                        'type' => 'credit',
                        'amount_cents' => $intent->amount_cents,
                        'fee_cents' => 0,
                        'net_cents' => $intent->amount_cents,
                        'reason' => 'funding',
                        'reference' => $intent->reference,
                        'meta' => ['provider' => 'paystack', 'webhook' => true],
                        'balance_after_cents' => $wallet->balance_cents,
                    ]
                );

                $intent->status = 'succeeded';
                $intent->webhook_received_at = now();
                $intent->save();
            });
        }

        return response()->json(['message' => 'ok']);
    }
}
