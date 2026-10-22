<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

// status/last_completed_at are deliberately excluded — they're owned by
// markDone() and DispatchReminders, not user input. Both of those set
// them via direct property assignment (bypasses mass-assignment), not
// fill()/update()/factory `create()` with an array, which would silently
// drop them here.
#[Fillable([
    'organization_id', 'name', 'category', 'notes', 'due_date', 'recurrence',
    'recurrence_interval_days', 'owner_user_id', 'is_active',
])]
class DeadlineItem extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'last_completed_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function reminderRule(): HasOne
    {
        return $this->hasOne(ReminderRule::class);
    }

    public function reminderLogs(): HasMany
    {
        return $this->hasMany(ReminderLog::class)->orderByDesc('sent_at');
    }

    public function scopeActiveNotDone($query)
    {
        return $query->where('is_active', true)->where('status', '!=', 'done');
    }

    public function daysUntilDue(): int
    {
        return (int) now()->startOfDay()->diffInDays($this->due_date->copy()->startOfDay(), false);
    }

    // Anchored to the ORIGINAL due_date, not "today" — a billing-cycle
    // renewal marked done a few days late should still land on the real
    // next billing date, not drift forward every time it's handled late.
    public function markDone(): void
    {
        $this->last_completed_at = now();

        if ($this->recurrence === 'none') {
            $this->status = 'done';
        } else {
            $this->due_date = $this->nextDueDate();
            $this->status = 'upcoming';
        }

        $this->save();
    }

    private function nextDueDate(): Carbon
    {
        return match ($this->recurrence) {
            'monthly' => $this->due_date->copy()->addMonthNoOverflow(),
            'quarterly' => $this->due_date->copy()->addMonthsNoOverflow(3),
            'yearly' => $this->due_date->copy()->addYearNoOverflow(),
            'custom_days' => $this->due_date->copy()->addDays($this->recurrence_interval_days ?? 30),
            default => $this->due_date->copy(),
        };
    }

    public function notificationTargets(): HasMany
    {
        return $this->hasMany(DeadlineItemNotificationTarget::class);
    }
}
