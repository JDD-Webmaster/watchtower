<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationMemberController extends Controller
{
    public function index(Organization $organization): JsonResponse
    {
        $this->authorize('view', $organization);

        $members = $organization->users()->with('notificationTargets')->get()->map(function ($user) use ($organization) {
            $pivot = $user->pivot;
            $member = $organization->members()->where('user_id', $user->id)->first();

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'country' => $user->country,
                'timezone' => $user->timezone,
                'notification_preferences' => $user->notification_preferences ?? ['email' => true, 'sms' => true],
                'role' => $pivot->role,
                'can_receive_sms' => $member?->can_receive_sms ?? true,
                'can_receive_email' => $member?->can_receive_email ?? true,
            ];
        });

        return response()->json(['data' => $members]);
    }

    public function store(Request $request, Organization $organization): JsonResponse
    {
        $this->authorize('update', $organization);

        $data = $request->validate([
            'email' => 'required|email|exists:users,email',
            'role' => 'required|in:admin,member',
            'can_receive_sms' => 'boolean',
            'can_receive_email' => 'boolean',
        ]);

        $user = User::where('email', $data['email'])->firstOrFail();
        if ($organization->users()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'User already in organization'], 422);
        }

        $organization->users()->attach($user->id, ['role' => $data['role']]);
        OrganizationMember::updateOrCreate(
            ['organization_id' => $organization->id, 'user_id' => $user->id],
            [
                'role' => $data['role'],
                'can_receive_sms' => $data['can_receive_sms'] ?? true,
                'can_receive_email' => $data['can_receive_email'] ?? true,
                'joined_at' => now(),
            ]
        );

        return response()->json(['message' => 'Member added'], 201);
    }

    public function update(Request $request, Organization $organization, User $user): JsonResponse
    {
        $this->authorize('update', $organization);

        $data = $request->validate([
            'role' => 'sometimes|in:admin,member',
            'can_receive_sms' => 'boolean',
            'can_receive_email' => 'boolean',
        ]);

        if (isset($data['role'])) {
            $organization->users()->updateExistingPivot($user->id, ['role' => $data['role']]);
        }

        OrganizationMember::updateOrCreate(
            ['organization_id' => $organization->id, 'user_id' => $user->id],
            array_merge($data, ['joined_at' => now()])
        );

        return response()->json(['message' => 'Member updated']);
    }

    public function destroy(Organization $organization, User $user): JsonResponse
    {
        $this->authorize('update', $organization);

        $ownerCount = $organization->users()->wherePivot('role', 'owner')->count();
        $pivot = $organization->users()->where('user_id', $user->id)->first()?->pivot;
        if ($pivot && $pivot->role === 'owner' && $ownerCount <= 1) {
            return response()->json(['message' => 'Cannot remove the last owner'], 422);
        }

        $organization->users()->detach($user->id);
        $organization->members()->where('user_id', $user->id)->delete();

        return response()->json(['message' => 'Member removed']);
    }
}
