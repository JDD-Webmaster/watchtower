<?php

namespace App\Console\Commands;

use App\Models\DeadlineItem;
use App\Models\Organization;
use App\Models\ReminderLog;
use App\Models\ReminderRule;
use App\Services\ReminderDispatchService;
use Carbon\Carbon;
use Illuminate\Console\Command;

// Scheduled hourly, not daily — so each organization's own `timezone` is
// honored: this only acts on an org during the hour that's currently
// 08:00 local for it. This command IS the "never relies on a human"
// promise — nothing else triggers a reminder.
class DispatchReminders extends Command
{
    protected $signature = 'reminders:dispatch';

    protected $description = 'Send due reminders (and overdue nudges) for every organization currently at its local reminder hour';

    private const REMINDER_HOUR = 8;

    public function handle(ReminderDispatchService $dispatcher): int
    {
        if (! config('reminders.enabled')) {
            $this->info('Reminders are disabled platform-wide (REMINDERS_ENABLED=false) — skipping.');

            return self::SUCCESS;
        }

        $sent = 0;
        $skipped = 0;

        foreach (Organization::all() as $organization) {
            if (now($organization->timezone)->hour !== self::REMINDER_HOUR) {
                continue;
            }

            $today = now($organization->timezone)->startOfDay();

            foreach ($organization->deadlineItems()->activeNotDone()->get() as $item) {
                // due_date is cast as a plain date (app-default-timezone
                // instant) — diffing it against an org-local "today"
                // directly mixes two different UTC offsets and produces a
                // fractional day count that never matches a clean integer
                // offset (e.g. 7.04 instead of 7). Re-anchor the due date
                // as a calendar date IN the org's own timezone first.
                $dueDateInOrgTz = Carbon::parse($item->due_date->toDateString(), $organization->timezone)->startOfDay();
                $daysUntil = (int) round($today->diffInDays($dueDateInOrgTz, false));
                $isOverdue = $daysUntil < 0;
                $rule = ReminderRule::resolveFor($item);

                // Blanket guard against a double-send: the scheduler is
                // hourly and only "unlocks" during the org's reminder
                // hour, but a manual re-run (or a scheduler double-fire)
                // within that same hour must not re-send an identical
                // reminder — one touch per item per calendar day, period.
                if ($this->alreadyRemindedToday($item, $today)) {
                    $skipped++;

                    continue;
                }

                $due = $isOverdue
                    ? $this->overdueReminderIsDue($item, $rule)
                    : in_array($daysUntil, $rule->offsets_days, true);

                if (! $due) {
                    $skipped++;

                    continue;
                }

                // status is deliberately excluded from DeadlineItem's
                // fillable list (it's automation/system-owned, not
                // user-editable) — ->update([...]) would silently no-op
                // here, so set it directly instead.
                if ($isOverdue && $item->status !== 'overdue') {
                    $item->status = 'overdue';
                    $item->save();
                }

                $dispatcher->sendFor($item, $daysUntil, $isOverdue);
                $sent++;
            }
        }

        $this->info("Reminders dispatched: {$sent}, skipped (not due today): {$skipped}.");

        return self::SUCCESS;
    }

    private function alreadyRemindedToday(DeadlineItem $item, Carbon $today): bool
    {
        return ReminderLog::where('deadline_item_id', $item->id)
            ->where('sent_at', '>=', $today)
            ->exists();
    }

    private function overdueReminderIsDue(DeadlineItem $item, ReminderRule $rule): bool
    {
        $lastReminder = ReminderLog::where('deadline_item_id', $item->id)
            ->latest('sent_at')
            ->first();

        if (! $lastReminder) {
            return true;
        }

        return $lastReminder->sent_at->diffInDays(now()) >= $rule->overdue_repeat_days;
    }
}
