<?php

namespace App\Policies;

use App\Models\Organization;
use App\Models\User;

class OrganizationPolicy
{
    // Any member (owner or plain member) can view the org and everything
    // inside it — deadline items, reminder rules, reminder logs all
    // authorize through this same membership check.
    public function view(User $user, Organization $organization): bool
    {
        return $organization->users()->where('user_id', $user->id)->exists();
    }

    // Only an owner can rename/retime the org, or change its default
    // reminder rule — members can still manage individual deadline items.
    public function update(User $user, Organization $organization): bool
    {
        return $organization->users()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'owner')
            ->exists();
    }
}
