<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeadlineItem;
use App\Models\Organization;
use App\Models\ReminderRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReminderRuleController extends Controller
{
    public function showForOrganization(Organization $organization): JsonResponse
    {
        $this->authorize('view', $organization);

        return response()->json(['data' => $this->serialize(
            $organization->reminderRule ?? ReminderRule::resolveDefault()
        )]);
    }

    public function updateForOrganization(Request $request, Organization $organization): JsonResponse
    {
        $this->authorize('update', $organization);

        $data = $this->validated($request);
        $rule = ReminderRule::updateOrCreate(['organization_id' => $organization->id], $data);

        return response()->json(['data' => $this->serialize($rule)]);
    }

    public function updateForItem(Request $request, DeadlineItem $deadlineItem): JsonResponse
    {
        $this->authorize('update', $deadlineItem);

        $data = $this->validated($request);
        $rule = ReminderRule::updateOrCreate(['deadline_item_id' => $deadlineItem->id], $data);

        return response()->json(['data' => $this->serialize($rule)]);
    }

    // Removing the override reverts the item to the org default — not a
    // destructive "lose your settings" action, just "stop overriding".
    public function destroyForItem(DeadlineItem $deadlineItem): JsonResponse
    {
        $this->authorize('update', $deadlineItem);

        $deadlineItem->reminderRule()->delete();

        return response()->json(['data' => $this->serialize(ReminderRule::resolveFor($deadlineItem->fresh()))]);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'offsets_days' => 'required|array|min:1',
            'offsets_days.*' => 'integer|min:0|max:365',
            'overdue_repeat_days' => 'required|integer|min:1|max:90',
        ]);
    }

    private function serialize(ReminderRule $rule): array
    {
        return [
            'offsets_days' => $rule->offsets_days,
            'overdue_repeat_days' => $rule->overdue_repeat_days,
        ];
    }
}
