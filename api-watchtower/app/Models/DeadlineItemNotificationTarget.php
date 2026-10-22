<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeadlineItemNotificationTarget extends Model
{
    protected $fillable = [
        'deadline_item_id',
        'user_id',
        'channels',
    ];

    /**
     * JSON columns can't carry a DEFAULT on MySQL, so the "both channels"
     * default lives here instead of in the migration.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'channels' => '["email","sms"]',
    ];

    protected function casts(): array
    {
        return [
            'channels' => 'array',
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
