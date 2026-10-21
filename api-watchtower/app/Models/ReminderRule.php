<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['organization_id', 'deadline_item_id', 'offsets_days', 'overdue_repeat_days'])]
class ReminderRule extends Model
{
    public const DEFAULT_OFFSETS_DAYS = [30, 14, 7, 1];

    public const DEFAULT_OVERDUE_REPEAT_DAYS = 3;

    protected function casts(): array
    {
        return [
            'offsets_days' => 'array',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function deadlineItem(): BelongsTo
    {
        return $this->belongsTo(DeadlineItem::class);
    }

    // Item override -> organization default -> hardcoded fallback. The
    // fallback is an unsaved instance, not a persisted row — a brand new
    // organization gets sane reminder behavior immediately, with nothing
    // to configure before the system starts protecting it.
    public static function resolveFor(DeadlineItem $item): self
    {
        return $item->reminderRule
            ?? $item->organization->reminderRule
            ?? self::resolveDefault();
    }

    public static function resolveDefault(): self
    {
        return new self([
            'offsets_days' => self::DEFAULT_OFFSETS_DAYS,
            'overdue_repeat_days' => self::DEFAULT_OVERDUE_REPEAT_DAYS,
        ]);
    }
}
