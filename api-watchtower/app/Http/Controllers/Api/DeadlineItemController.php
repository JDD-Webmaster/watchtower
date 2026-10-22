<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DeadlineItemResource;
use App\Http\Resources\ReminderLogResource;
use App\Models\DeadlineItem;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeadlineItemController extends Controller
{
    public function index(Request $request, Organization $organization): JsonResponse
    {
        $this->authorize('view', $organization);

        $items = $organization->deadlineItems()
            ->with(['owner', 'reminderRule', 'notificationTargets'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderBy('due_date')
            ->get();

        return response()->json(['data' => DeadlineItemResource::collection($items)]);
    }

    public function store(Request $request, Organization $organization): JsonResponse
    {
        $this->authorize('view', $organization);

        $data = $this->validated($request, $organization);
        $item = $organization->deadlineItems()->create($data);

        if ($request->has('notification_targets')) {
            $this->syncNotificationTargets($request, $item);
        }

        return response()->json(['data' => new DeadlineItemResource($item->load(['owner', 'notificationTargets']))], 201);
    }

    public function show(DeadlineItem $deadlineItem): JsonResponse
    {
        $this->authorize('view', $deadlineItem);

        return response()->json([
            'data' => new DeadlineItemResource($deadlineItem->load(['owner', 'reminderRule', 'notificationTargets.user'])),
        ]);
    }

    public function update(Request $request, DeadlineItem $deadlineItem): JsonResponse
    {
        $this->authorize('update', $deadlineItem);

        $data = $this->validated($request, $deadlineItem->organization, updating: true);
        $deadlineItem->update($data);

        if ($request->has('notification_targets')) {
            $this->syncNotificationTargets($request, $deadlineItem);
        }

        return response()->json(['data' => new DeadlineItemResource($deadlineItem->load(['owner', 'notificationTargets']))]);
    }

    public function destroy(DeadlineItem $deadlineItem): JsonResponse
    {
        $this->authorize('delete', $deadlineItem);

        $deadlineItem->delete();

        return response()->json(['message' => 'Deleted']);
    }

    public function markDone(DeadlineItem $deadlineItem): JsonResponse
    {
        $this->authorize('update', $deadlineItem);

        $deadlineItem->markDone();

        return response()->json(['data' => new DeadlineItemResource($deadlineItem->load(['owner']))]);
    }

    public function reminderLogs(DeadlineItem $deadlineItem): JsonResponse
    {
        $this->authorize('view', $deadlineItem);

        $logs = $deadlineItem->reminderLogs()->with('user')->paginate(20);

        return response()->json([
            'data' => ReminderLogResource::collection($logs->items()),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    private function validated(Request $request, Organization $organization, bool $updating = false): array
    {
        $prefix = $updating ? 'sometimes' : 'required';

        return $request->validate([
            'name' => "{$prefix}|string|max:150",
            'category' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:2000',
            'due_date' => "{$prefix}|date",
            'recurrence' => "{$prefix}|in:none,monthly,quarterly,yearly,custom_days",
            'recurrence_interval_days' => 'nullable|integer|min:1|max:3650|required_if:recurrence,custom_days',
            'owner_user_id' => [
                $prefix,
                'integer',
                function ($attribute, $value, $fail) use ($organization) {
                    if (! $organization->users()->where('user_id', $value)->exists()) {
                        $fail('The owner must be a member of this organization.');
                    }
                },
            ],
            'is_active' => 'boolean',
            'notification_targets' => 'nullable|array',
            'notification_targets.*.user_id' => 'required_with:notification_targets|integer',
            'notification_targets.*.channels' => 'nullable|array',
            'notification_targets.*.channels.*' => 'in:email,sms',
        ]);
    }

    private function syncNotificationTargets(Request $request, DeadlineItem $item): void
    {
        $targets = $request->input('notification_targets', []);
        $item->notificationTargets()->delete();

        foreach ($targets as $target) {
            if (empty($target['user_id'])) {
                continue;
            }
            if (! $item->organization->users()->where('user_id', $target['user_id'])->exists()) {
                continue;
            }
            $item->notificationTargets()->create([
                'user_id' => $target['user_id'],
                'channels' => $target['channels'] ?? ['email', 'sms'],
            ]);
        }
    }
}
