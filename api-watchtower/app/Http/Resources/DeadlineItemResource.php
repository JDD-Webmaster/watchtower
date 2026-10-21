<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeadlineItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'name' => $this->name,
            'category' => $this->category,
            'notes' => $this->notes,
            'due_date' => $this->due_date->toDateString(),
            'days_until_due' => $this->daysUntilDue(),
            'recurrence' => $this->recurrence,
            'recurrence_interval_days' => $this->recurrence_interval_days,
            'owner' => new UserResource($this->whenLoaded('owner')),
            'status' => $this->status,
            'last_completed_at' => $this->last_completed_at?->toIso8601String(),
            'is_active' => $this->is_active,
            'reminder_rule' => $this->whenLoaded('reminderRule', fn () => $this->reminderRule ? [
                'offsets_days' => $this->reminderRule->offsets_days,
                'overdue_repeat_days' => $this->reminderRule->overdue_repeat_days,
            ] : null),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
