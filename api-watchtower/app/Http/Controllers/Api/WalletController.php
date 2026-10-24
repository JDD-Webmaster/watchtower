<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\PaymentIntent;
use App\Models\Wallet;
use App\Services\Payment\PaystackService;
use App\Services\Payment\WalletFundingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class WalletController extends Controller
{
    public function __construct(
        private readonly PaystackService $paystack,
        private readonly WalletFundingService $funding,
    ) {}

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
            'amount' => ['required', 'integer', 'min:100'],
            'currency' => ['nullable', 'in:NGN,USD'],
        ]);

        if (! $this->paystack->isConfigured()) {
            return response()->json([
                'message' => 'Payments are not configured on this server. Set PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY.',
            ], 503);
        }

        $currency = $data['currency'] ?? 'NGN';
        $amountCents = $data['amount'] * 100;
        $reference = 'WT-'.Str::upper(Str::random(16));

        try {
            $transaction = $this->paystack->initializeTransaction([
                'email' => $request->user()->email,
                'amount' => $amountCents,
                'currency' => $currency,
                'reference' => $reference,
                'callback_url' => rtrim(config('app.frontend_url'), '/').'/dashboard/wallet',
                'metadata' => [
                    'organization_id' => $organization->id,
                    'payment_intent_reference' => $reference,
                ],
            ]);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        PaymentIntent::create([
            'organization_id' => $organization->id,
            'provider' => 'paystack',
            'reference' => $reference,
            'access_code' => $transaction['access_code'] ?? null,
            'authorization_url' => $transaction['authorization_url'] ?? null,
            'amount_cents' => $amountCents,
            'currency' => $currency,
            'status' => 'pending',
            'metadata' => [
                'email' => $request->user()->email,
                'paystack_reference' => $transaction['reference'] ?? $reference,
            ],
        ]);

        return response()->json([
            'data' => [
                'reference' => $reference,
                'access_code' => $transaction['access_code'] ?? null,
                'amount_cents' => $amountCents,
                'currency' => $currency,
                'public_key' => $this->paystack->publicKey(),
                'email' => $request->user()->email,
                'authorization_url' => $transaction['authorization_url'] ?? null,
                'mode' => $this->paystack->mode(),
            ],
        ]);
    }

    public function verifyFunding(Request $request, Organization $organization): JsonResponse
    {
        $this->authorize('update', $organization);

        $data = $request->validate([
            'reference' => ['required', 'string'],
        ]);

        $intent = PaymentIntent::where('organization_id', $organization->id)
            ->where('reference', $data['reference'])
            ->firstOrFail();

        if ($intent->status === 'succeeded') {
            return response()->json(['message' => 'Already credited']);
        }

        try {
            $transaction = $this->paystack->verifyTransaction($intent->reference);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        if (($transaction['status'] ?? null) !== 'success') {
            // "pending"/"processing" can be a momentary race with the popup
            // callback — leave those alone so the webhook can still settle
            // them. Only terminal failures are recorded as failed.
            if (in_array($transaction['status'] ?? null, ['failed', 'abandoned', 'reversed'], true)) {
                PaymentIntent::where('id', $intent->id)
                    ->where('status', 'pending')
                    ->update(['status' => 'failed']);
            }

            return response()->json(['message' => 'The payment has not completed yet.'], 422);
        }

        // The amount and currency Paystack charged have to match what we asked
        // for, otherwise a reused or tampered reference could credit a
        // different amount to the wallet. Paystack adds transaction fees in
        // test/live depending on settings; prefer requested_amount if present
        // and only credit what the user asked to fund.
        if (($transaction['reference'] ?? null) !== $intent->reference) {
            Log::error('[WalletController] Paystack reference mismatch', [
                'expected' => $intent->reference,
                'returned' => $transaction['reference'] ?? null,
            ]);

            return response()->json(['message' => 'The payment does not match this funding request.'], 422);
        }

        $chargedAmount = (int) ($transaction['amount'] ?? 0);
        $requestedAmount = array_key_exists('requested_amount', $transaction)
            ? (int) $transaction['requested_amount']
            : (isset($transaction['requestedAmount']) ? (int) $transaction['requestedAmount'] : $intent->amount_cents);

        if ($requestedAmount !== $intent->amount_cents) {
            Log::error('[WalletController] Paystack requested amount mismatch', [
                'reference' => $intent->reference,
                'expected_cents' => $intent->amount_cents,
                'requested_cents' => $requestedAmount,
                'charged_cents' => $chargedAmount,
            ]);

            return response()->json(['message' => 'The paid amount does not match the requested amount.'], 422);
        }

        if ($chargedAmount < $intent->amount_cents) {
            Log::error('[WalletController] Paystack charged less than requested', [
                'reference' => $intent->reference,
                'expected_cents' => $intent->amount_cents,
                'charged_cents' => $chargedAmount,
            ]);

            return response()->json(['message' => 'The paid amount does not match the requested amount.'], 422);
        }

        if (strtoupper((string) ($transaction['currency'] ?? '')) !== strtoupper($intent->currency)) {
            Log::error('[WalletController] Paystack currency mismatch', [
                'reference' => $intent->reference,
                'expected' => $intent->currency,
                'charged' => $transaction['currency'] ?? null,
            ]);

            return response()->json(['message' => 'The paid currency does not match the requested currency.'], 422);
        }

        $credited = $this->funding->credit($intent, $request->user()->id, ['source' => 'verify']);

        return response()->json([
            'message' => $credited ? 'Wallet funded successfully' : 'Already credited',
            'data' => [
                'reference' => $intent->reference,
                'status' => $intent->fresh()->status,
                'amount_cents' => $intent->amount_cents,
            ],
        ]);
    }

    public function paystackWebhook(Request $request): JsonResponse
    {
        // Paystack signs the raw body; the JSON-decoded payload cannot be
        // used here or the digest will not match.
        if (! $this->paystack->hasValidSignature($request->getContent(), $request->header('x-paystack-signature'))) {
            Log::warning('[WalletController] rejected a Paystack webhook with an invalid signature');

            return response()->json(['message' => 'Invalid signature'], 401);
        }

        $payload = $request->json()->all();
        $event = $payload['event'] ?? null;
        $data = $payload['data'] ?? [];
        $reference = $data['reference'] ?? null;

        if ($event === 'charge.success') {
            if (! $reference) {
                return response()->json(['message' => 'ok']);
            }

            $intent = PaymentIntent::where('reference', $reference)->first();

            if (! $intent) {
                return response()->json(['message' => 'ok']);
            }

            if (isset($data['requested_amount'])) {
                if ((int) $data['requested_amount'] !== $intent->amount_cents) {
                    Log::error('[WalletController] Paystack webhook requested amount mismatch', [
                        'reference' => $reference,
                        'expected_cents' => $intent->amount_cents,
                        'requested_cents' => $data['requested_amount'],
                    ]);

                    return response()->json(['message' => 'Amount mismatch'], 422);
                }
            } elseif ((int) ($data['amount'] ?? 0) < $intent->amount_cents) {
                Log::error('[WalletController] Paystack webhook amount mismatch', [
                    'reference' => $reference,
                    'expected_cents' => $intent->amount_cents,
                    'charged_cents' => $data['amount'] ?? null,
                ]);

                return response()->json(['message' => 'Amount mismatch'], 422);
            }

            $this->funding->credit($intent, null, ['source' => 'webhook', 'webhook' => true]);
        }

        if (in_array($event, ['charge.failed', 'transaction.failed'], true) && $reference) {
            PaymentIntent::where('reference', $reference)
                ->where('status', 'pending')
                ->update(['status' => 'failed']);
        }

        return response()->json(['message' => 'ok']);
    }
}
