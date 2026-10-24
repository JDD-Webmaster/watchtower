<?php

namespace App\Services\Payment;

use App\Models\PaymentIntent;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;

/**
 * Moves money from a confirmed Paystack payment into the organization wallet.
 *
 * Both the webhook and the "user closed the popup" verification endpoint land
 * here, so the crediting rules live in exactly one place: it is idempotent,
 * and it locks the intent row so two concurrent deliveries cannot credit
 * the same payment twice.
 */
class WalletFundingService
{
    /**
     * @param  array<string, mixed>  $meta
     * @return bool True when this call actually credited the wallet.
     */
    public function credit(PaymentIntent $intent, ?int $userId = null, array $meta = []): bool
    {
        if ($intent->status === 'succeeded') {
            return false;
        }

        return DB::transaction(function () use ($intent, $userId, $meta) {
            $lockedIntent = PaymentIntent::where('id', $intent->id)->lockForUpdate()->first();

            if (! $lockedIntent || $lockedIntent->status === 'succeeded') {
                return false;
            }

            $wallet = Wallet::firstOrCreate(
                ['organization_id' => $lockedIntent->organization_id, 'currency' => $lockedIntent->currency],
                ['balance_cents' => 0, 'available_cents' => 0, 'held_cents' => 0, 'status' => 'active']
            );

            $lockedWallet = Wallet::where('id', $wallet->id)->lockForUpdate()->first();

            $lockedWallet->balance_cents += $lockedIntent->amount_cents;
            $lockedWallet->available_cents += $lockedIntent->amount_cents;
            $lockedWallet->save();

            WalletTransaction::firstOrCreate(
                ['idempotency_key' => 'funding:'.$lockedIntent->reference],
                [
                    'wallet_id' => $lockedWallet->id,
                    'organization_id' => $lockedWallet->organization_id,
                    'user_id' => $userId,
                    'type' => 'credit',
                    'amount_cents' => $lockedIntent->amount_cents,
                    'fee_cents' => 0,
                    'net_cents' => $lockedIntent->amount_cents,
                    'reason' => 'funding',
                    'reference' => $lockedIntent->reference,
                    'meta' => ['provider' => $lockedIntent->provider] + $meta,
                    'balance_after_cents' => $lockedWallet->balance_cents,
                ]
            );

            $lockedIntent->status = 'succeeded';
            $lockedIntent->paid_at = now();

            if ($meta['webhook'] ?? false) {
                $lockedIntent->webhook_received_at = now();
            }

            $lockedIntent->save();

            return true;
        });
    }
}
