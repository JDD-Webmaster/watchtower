<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\OrganizationMember;
use App\Models\User;
use App\Notifications\OrganizationInviteNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

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

        $invitations = $organization->invitations()
            ->where('status', 'pending')
            ->get()
            ->map(fn ($invite) => [
                'id' => $invite->id,
                'email' => $invite->email,
                'role' => $invite->role,
                'invited_at' => $invite->created_at->toIso8601String(),
            ]);

        return response()->json(['data' => $members, 'invitations' => $invitations]);
    }

    public function store(Request $request, Organization $organization): JsonResponse
    {
        $this->authorize('update', $organization);

        $data = $request->validate([
            'email' => 'required|email|max:255',
            'role' => 'required|in:admin,member',
            'can_receive_sms' => 'boolean',
            'can_receive_email' => 'boolean',
        ]);

        $user = User::where('email', $data['email'])->first();

        if ($user) {
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

        // No account with this email yet — hold a pending invitation and
        // email a signup link. AuthController::register redeems it (adds
        // them to this organization) the moment they create an account
        // with the same email, no accept-click required.
        if ($organization->invitations()->where('email', $data['email'])->where('status', 'accepted')->exists()) {
            return response()->json(['message' => 'User already in organization'], 422);
        }

        $invitation = OrganizationInvitation::updateOrCreate(
            ['organization_id' => $organization->id, 'email' => $data['email']],
            [
                'role' => $data['role'],
                'can_receive_sms' => $data['can_receive_sms'] ?? true,
                'can_receive_email' => $data['can_receive_email'] ?? true,
                'invited_by_user_id' => $request->user()->id,
                'token' => Str::random(40),
                'status' => 'pending',
            ]
        );

        Notification::route('mail', $data['email'])->notify(new OrganizationInviteNotification($invitation));

        return response()->json(['message' => 'Invitation sent'], 201);
    }

    // Public (no auth) — the register page uses this to show "you've been
    // invited to join X" before the person has an account to authenticate as.
    public function showInvitation(string $token): JsonResponse
    {
        $invitation = OrganizationInvitation::where('token', $token)
            ->where('status', 'pending')
            ->with('organization')
            ->first();

        if (! $invitation) {
            return response()->json(['message' => 'Invitation not found or already used'], 404);
        }

        return response()->json(['data' => [
            'organization_name' => $invitation->organization->name,
            'email' => $invitation->email,
        ]]);
    }

    public function destroyInvitation(Organization $organization, OrganizationInvitation $invitation): JsonResponse
    {
        $this->authorize('update', $organization);

        if ($invitation->organization_id !== $organization->id) {
            abort(404);
        }

        $invitation->delete();

        return response()->json(['message' => 'Invitation revoked']);
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
