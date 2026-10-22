<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    protected $fillable = [
        'organization_id',
        'currency',
        'balance_cents',
        'available_cents',
        'held_cents',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'balance_cents' => 'integer',
            'available_cents' => 'integer',
            'held_cents' => 'integer',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function chargeLogs(): HasMany
    {
        return $this->hasMany(SmsChargeLog::class, 'organization_id', 'organization_id');
    }
}
