<?php

namespace App\Services;

use App\Models\DeadlineItem;
use App\Models\ReminderLog;
use App\Models\User;
use App\Services\Sms\SmsRouter;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

// The part of WatchTower that actually keeps its promise: once a deadline
// is logged, this is what makes it impossible to silently forget — every
// due reminder gets an attempt on every enabled channel, logged with the
// exact text sent, regardless of outcome.
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

            if ($wantsEmail) {
                $this->sendEmail($item, $user, $daysUntil, $isOverdue);
            }

            if ($wantsSms) {
                $this->sendSms($item, $user, $daysUntil, $isOverdue);
            }
        }
    }

    // Owner of the item plus every org member with the 'owner' role —
    // accountability shouldn't live with one person who might be on
    // leave, but the item's own owner always hears about it directly.
    private function recipients(DeadlineItem $item): Collection
    {
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

        $content = $this->smsBody($item, $daysUntil, $isOverdue);
        $success = $this->sms->send($user->phone, $content, countryIso2: $user->country);

        $this->log($item, $user, 'sms', $content, $success, $success ? null : 'SMS send failed');
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
