<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmsRate extends Model
{
    protected $fillable = [
        'country_iso2',
        'provider',
        'currency',
        'rate_cents_per_sms',
        'effective_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'rate_cents_per_sms' => 'integer',
            'effective_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }
}
