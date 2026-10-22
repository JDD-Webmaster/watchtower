<?php

namespace App\Services;

use App\Models\DeadlineItem;
use App\Models\ReminderLog;
use App\Models\SmsChargeLog;
use App\Models\SmsRate;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\Sms\SmsRouter;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

// The part of WatchTower that actually keeps its promise: once a deadline
// is logged, this is what makes it impossible to silently forget — every
// due reminder gets an attempt on every enabled channel, logged with the
// exact text sent, regardless of outcome.
//
// Now enhanced with: per-deadline notification targets, org timezone awareness,
// and a dedicated SMS wallet (charge on successful send only, never platform
// fallback). If wallet is insufficient for SMS, SMS is skipped with a clear log
// — email still goes out as configured.
class ReminderDispatchService
{
    public function __construct(private readonly SmsRouter $sms) {}

    // $daysUntil is passed in, already computed against the organization's
    // own timezone by DispatchReminders — recomputing it here against the
    // server's default timezone could disagree by a day right around a
    // midnight boundary.
    public function sendFor(DeadlineItem $item, int $daysUntil, bool $isOverdue): void
    {
        foreach ($this->recipients($item) as $user) {
            $prefs = $user->notification_preferences ?? [];
            $wantsEmail = $prefs['email'] ?? true;
            $wantsSms = $prefs['sms'] ?? true;

            // Also respect per-org member settings if they exist
            $member = $item->organization->members()->where('user_id', $user->id)->first();
            if ($member) {
                if (! $member->can_receive_email) {
                    $wantsEmail = false;
                }
                if (! $member->can_receive_sms) {
                    $wantsSms = false;
                }
            }

            if ($wantsEmail) {
                $this->sendEmail($item, $user, $daysUntil, $isOverdue);
            }

            if ($wantsSms) {
                $this->sendSms($item, $user, $daysUntil, $isOverdue);
            }
        }
    }

    // Recipients resolution order:
    // 1. If the deadline has explicit notification_targets set, use those (with per-target channels)
    // 2. Otherwise fall back to org owners + item owner (original behavior)
    private function recipients(DeadlineItem $item): Collection
    {
        $item->loadMissing('notificationTargets.user');

        if ($item->notificationTargets->isNotEmpty()) {
            $users = $item->notificationTargets
                ->map(fn ($target) => $target->user)
                ->filter()
                ->unique('id');

            if ($users->isNotEmpty()) {
                return $users;
            }
        }

        $orgOwners = $item->organization->users()->wherePivot('role', 'owner')->get();

        return $orgOwners->push($item->owner)->unique('id');
    }

    private function sendEmail(DeadlineItem $item, User $user, int $daysUntil, bool $isOverdue): void
    {
        if (! $user->email) {
            $this->log($item, $user, 'email', '', false, 'User has no email address');

            return;
        }

        $subject = $this->subject($item, $daysUntil, $isOverdue);
        $body = $this->emailBody($item, $daysUntil, $isOverdue);
        $success = true;
        $error = null;

        try {
            Mail::send('emails.reminder', [
                'subject' => $subject,
                'itemName' => $item->name,
                'body' => $body,
                'link' => $this->itemUrl($item),
            ], function ($message) use ($user, $subject) {
                $message->to($user->email, $user->name)->subject($subject);
            });
        } catch (\Throwable $e) {
            $success = false;
            $error = $e->getMessage();
            Log::error('[ReminderDispatchService] Email send failed', [
                'deadline_item_id' => $item->id,
                'user_id' => $user->id,
                'error' => $error,
            ]);
        }

        $this->log($item, $user, 'email', "Subject: {$subject}\n\n{$body}\n\n{$this->itemUrl($item)}", $success, $error);
    }

    private function sendSms(DeadlineItem $item, User $user, int $daysUntil, bool $isOverdue): void
    {
        if (! $user->phone) {
            $this->log($item, $user, 'sms', '', false, 'User has no phone number');

            return;
        }

        $org = $item->organization;
        $country = strtoupper($user->country ?: 'NG');
        $costCents = $this->getSmsCostCents($country);

        // Wallet-based charging: if a wallet exists for the org, enforce balance.
        // Never fall back to platform owner account. If insufficient, block SMS
        // and log clearly so the org knows to fund their wallet.
        $wallet = $org->wallet()->where('currency', 'NGN')->first();
        if ($wallet && $wallet->status === 'active' && $costCents > 0) {
            if (($wallet->available_cents ?? 0) < $costCents) {
                $this->log($item, $user, 'sms', '', false, "Insufficient wallet funds for SMS (need {$costCents} cents, have ".($wallet->available_cents ?? 0).' cents). Fund your organization wallet.');
                Log::warning('[ReminderDispatchService] SMS blocked - insufficient wallet funds', [
                    'organization_id' => $org->id,
                    'user_id' => $user->id,
                    'deadline_item_id' => $item->id,
                    'cost_cents' => $costCents,
                    'available_cents' => $wallet->available_cents,
                ]);

                return;
            }
        }

        $content = $this->smsBody($item, $daysUntil, $isOverdue);
        $success = $this->sms->send($user->phone, $content, countryIso2: $user->country);

        if ($success && $wallet && $wallet->status === 'active' && $costCents > 0) {
            $this->chargeSms($wallet, $org, $user, $item, $costCents, $country);
        }

        $this->log($item, $user, 'sms', $content, $success, $success ? null : 'SMS send failed');
    }

    private function getSmsCostCents(string $countryIso2): int
    {
        $rate = SmsRate::where('country_iso2', $countryIso2)
            ->where('is_active', true)
            ->orderByDesc('effective_at')
            ->first();

        if ($rate) {
            return $rate->rate_cents_per_sms;
        }

        // Fallback defaults if not configured in DB
        return $countryIso2 === 'NG' ? 4 : 15;
    }

    private function chargeSms(Wallet $wallet, $org, User $user, DeadlineItem $item, int $costCents, string $countryIso2): void
    {
        try {
            DB::transaction(function () use ($wallet, $org, $user, $item, $costCents, $countryIso2) {
                $w = Wallet::where('id', $wallet->id)->lockForUpdate()->first();
                if (($w->available_cents ?? 0) < $costCents) {
                    return;
                }

                $w->balance_cents -= $costCents;
                $w->available_cents -= $costCents;
                $w->save();

                $tx = WalletTransaction::create([
                    'wallet_id' => $w->id,
                    'organization_id' => $org->id,
                    'user_id' => $user->id,
                    'type' => 'debit',
                    'amount_cents' => -$costCents,
                    'fee_cents' => 0,
                    'net_cents' => -$costCents,
                    'reason' => 'sms_charge',
                    'reference' => null,
                    'idempotency_key' => 'sms:'.$item->id.':'.$user->id.':'.now()->toDateString(),
                    'meta' => ['deadline_item_id' => $item->id, 'country' => $countryIso2],
                    'balance_after_cents' => $w->balance_cents,
                ]);

                $log = ReminderLog::where('deadline_item_id', $item->id)
                    ->where('user_id', $user->id)
                    ->where('channel', 'sms')
                    ->latest()
                    ->first();

                SmsChargeLog::create([
                    'reminder_log_id' => $log?->id,
                    'wallet_transaction_id' => $tx->id,
                    'organization_id' => $org->id,
                    'user_id' => $user->id,
                    'provider' => $countryIso2 === 'NG' ? 'kudi' : 'termii',
                    'country_iso2' => $countryIso2,
                    'cost_cents' => $costCents,
                    'status' => 'charged',
                    'meta' => ['deadline_item_id' => $item->id],
                    'charged_at' => now(),
                ]);
            });
        } catch (\Throwable $e) {
            Log::error('[ReminderDispatchService] SMS charge failed', [
                'organization_id' => $org->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function subject(DeadlineItem $item, int $daysUntil, bool $isOverdue): string
    {
        if ($isOverdue) {
            return "Overdue: {$item->name}";
        }

        return "Reminder: {$item->name} is due in ".($daysUntil === 1 ? '1 day' : "{$daysUntil} days");
    }

    private function emailBody(DeadlineItem $item, int $daysUntil, bool $isOverdue): string
    {
        $due = $item->due_date->toFormattedDateString();

        if ($isOverdue) {
            $overdueBy = abs($daysUntil);

            return "\"{$item->name}\" was due on {$due} — that's ".($overdueBy === 1 ? '1 day' : "{$overdueBy} days")." ago. It's still showing as not done.";
        }

        return "\"{$item->name}\" is due on {$due} — that's ".($daysUntil === 1 ? '1 day' : "{$daysUntil} days").' away.';
    }

    private function smsBody(DeadlineItem $item, int $daysUntil, bool $isOverdue): string
    {
        $due = $item->due_date->format('M j');

        if ($isOverdue) {
            return "WatchTower: \"{$item->name}\" was due {$due} and is now overdue. {$this->itemUrl($item)}";
        }

        return "WatchTower: \"{$item->name}\" is due {$due} (in {$daysUntil}d). {$this->itemUrl($item)}";
    }

    private function itemUrl(DeadlineItem $item): string
    {
        return rtrim(config('app.frontend_url'), '/')."/deadlines/{$item->id}";
    }

    private function log(DeadlineItem $item, User $user, string $channel, string $content, bool $success, ?string $error): void
    {
        ReminderLog::create([
            'deadline_item_id' => $item->id,
            'user_id' => $user->id,
            'channel' => $channel,
            'content' => $content,
            'sent_at' => now(),
            'success' => $success,
            'error' => $error,
        ]);
    }
}
