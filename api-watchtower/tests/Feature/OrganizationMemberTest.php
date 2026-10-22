<?php

use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\User;
use App\Notifications\OrganizationInviteNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

describe('Inviting a team member', function () {

    it('adds an existing user to the organization immediately', function () {
        $owner = User::factory()->create();
        $org = Organization::factory()->create();
        $org->users()->attach($owner->id, ['role' => 'owner']);
        $invitee = User::factory()->create(['email' => 'teammate@example.com']);

        $this->actingAs($owner)->postJson("/api/organizations/{$org->id}/members", [
            'email' => 'teammate@example.com',
            'role' => 'member',
        ])->assertStatus(201)->assertJsonPath('message', 'Member added');

        expect($org->users()->where('user_id', $invitee->id)->exists())->toBeTrue();
    });

    it('emails a pending invitation when the address has no account yet', function () {
        Notification::fake();

        $owner = User::factory()->create();
        $org = Organization::factory()->create();
        $org->users()->attach($owner->id, ['role' => 'owner']);

        $this->actingAs($owner)->postJson("/api/organizations/{$org->id}/members", [
            'email' => 'future-teammate@example.com',
            'role' => 'admin',
        ])->assertStatus(201)->assertJsonPath('message', 'Invitation sent');

        $invitation = OrganizationInvitation::where('organization_id', $org->id)
            ->where('email', 'future-teammate@example.com')
            ->first();

        expect($invitation)->not->toBeNull()
            ->and($invitation->status)->toBe('pending')
            ->and($invitation->role)->toBe('admin');

        Notification::assertSentOnDemand(OrganizationInviteNotification::class);
    });

    it('adds the new user to the organization as soon as they register with the invited email', function () {
        $owner = User::factory()->create();
        $org = Organization::factory()->create();
        $org->users()->attach($owner->id, ['role' => 'owner']);

        $invitation = OrganizationInvitation::create([
            'organization_id' => $org->id,
            'email' => 'invitee@example.com',
            'role' => 'member',
            'invited_by_user_id' => $owner->id,
            'token' => 'test-token',
            'status' => 'pending',
        ]);

        // No organization_name needed — they're joining one, not starting one.
        $response = $this->postJson('/api/register', [
            'name' => 'Invited Person',
            'email' => 'invitee@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);

        $user = User::where('email', 'invitee@example.com')->first();
        expect($org->users()->where('user_id', $user->id)->exists())->toBeTrue()
            ->and($org->users()->where('user_id', $user->id)->first()->pivot->role)->toBe('member');

        expect($invitation->fresh()->status)->toBe('accepted');
    });

    it('lets an owner revoke a pending invitation', function () {
        $owner = User::factory()->create();
        $org = Organization::factory()->create();
        $org->users()->attach($owner->id, ['role' => 'owner']);

        $invitation = OrganizationInvitation::create([
            'organization_id' => $org->id,
            'email' => 'nevermind@example.com',
            'role' => 'member',
            'invited_by_user_id' => $owner->id,
            'token' => 'another-token',
            'status' => 'pending',
        ]);

        $this->actingAs($owner)
            ->deleteJson("/api/organizations/{$org->id}/invitations/{$invitation->id}")
            ->assertStatus(200);

        expect(OrganizationInvitation::find($invitation->id))->toBeNull();
    });

});
