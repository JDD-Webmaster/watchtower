<?php

namespace App\Policies;

use App\Models\DeadlineItem;
use App\Models\User;

class DeadlineItemPolicy
{
    // Any member of the item's organization can view/update/delete it —
    // deadline tracking is a team responsibility, not locked to whoever
    // happens to be the item's owner_user_id.
    public function view(User $user, DeadlineItem $deadlineItem): bool
    {
        return $deadlineItem->organization->users()->where('user_id', $user->id)->exists();
    }

    public function update(User $user, DeadlineItem $deadlineItem): bool
    {
        return $this->view($user, $deadlineItem);
    }

    public function delete(User $user, DeadlineItem $deadlineItem): bool
    {
        return $this->view($user, $deadlineItem);
    }
}
