<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationInvitation extends Model
{
    protected $fillable = [
        'organization_id',
        'email',
        'role',
        'can_receive_sms',
        'can_receive_email',
        'invited_by_user_id',
        'token',
        'status',
        'accepted_at',
    ];

    protected function casts(): array
    {
        return [
            'can_receive_sms' => 'boolean',
            'can_receive_email' => 'boolean',
            'accepted_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by_user_id');
    }
}
