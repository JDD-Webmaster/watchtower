<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    protected $fillable = [
        'wallet_id',
        'organization_id',
        'user_id',
        'type',
        'amount_cents',
        'fee_cents',
        'net_cents',
        'reason',
        'reference',
        'idempotency_key',
        'meta',
        'balance_after_cents',
    ];

    protected function casts(): array
    {
        return [
            'amount_cents' => 'integer',
            'fee_cents' => 'integer',
            'net_cents' => 'integer',
            'balance_after_cents' => 'integer',
            'meta' => 'array',
        ];
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
