<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['deadline_item_id', 'user_id', 'channel', 'content', 'sent_at', 'success', 'error'])]
class ReminderLog extends Model
{
    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
            'success' => 'boolean',
        ];
    }

    public function deadlineItem(): BelongsTo
    {
        return $this->belongsTo(DeadlineItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
