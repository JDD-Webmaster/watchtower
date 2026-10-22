<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsChargeLog extends Model
{
    protected $fillable = [
        'reminder_log_id',
        'wallet_transaction_id',
        'organization_id',
        'user_id',
        'provider',
        'country_iso2',
        'cost_cents',
        'status',
        'meta',
        'charged_at',
    ];

    protected function casts(): array
    {
        return [
            'cost_cents' => 'integer',
            'meta' => 'array',
            'charged_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function walletTransaction(): BelongsTo
    {
        return $this->belongsTo(WalletTransaction::class);
    }

    public function reminderLog(): BelongsTo
    {
        return $this->belongsTo(ReminderLog::class);
    }
}
