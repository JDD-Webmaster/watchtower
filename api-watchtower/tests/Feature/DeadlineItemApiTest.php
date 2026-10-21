<?php

use App\Models\DeadlineItem;
use App\Models\Organization;
use App\Models\ReminderLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function orgOwnedBy(User $user): Organization
{
    $org = Organization::factory()->create();
    $org->users()->attach($user->id, ['role' => 'owner']);

    return $org;
}

describe('Deadline item CRUD', function () {

    it('lets an org member create, view, and update a deadline item', function () {
        $user = User::factory()->create();
        $org = orgOwnedBy($user);

        $create = $this->actingAs($user)->postJson("/api/organizations/{$org->id}/deadline-items", [
            'name' => 'Renew acme.com',
            'category' => 'Domain',
            'due_date' => now()->addDays(30)->toDateString(),
            'recurrence' => 'yearly',
            'owner_user_id' => $user->id,
        ]);

        $create->assertStatus(201)->assertJsonPath('data.name', 'Renew acme.com');
        $itemId = $create->json('data.id');

        $this->actingAs($user)->getJson("/api/deadline-items/{$itemId}")
            ->assertStatus(200)
            ->assertJsonPath('data.recurrence', 'yearly');

        $this->actingAs($user)->putJson("/api/deadline-items/{$itemId}", ['name' => 'Renew acme.com domain'])
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Renew acme.com domain');
    });

    it('blocks a user who is not a member of the organization', function () {
        $owner = User::factory()->create();
        $org = orgOwnedBy($owner);
        $outsider = User::factory()->create();

        $this->actingAs($outsider)->postJson("/api/organizations/{$org->id}/deadline-items", [
            'name' => 'Should fail',
            'due_date' => now()->addDays(10)->toDateString(),
            'recurrence' => 'none',
            'owner_user_id' => $owner->id,
        ])->assertStatus(403);
    });

    it('rejects an owner_user_id that is not a member of the organization', function () {
        $user = User::factory()->create();
        $org = orgOwnedBy($user);
        $stranger = User::factory()->create();

        $this->actingAs($user)->postJson("/api/organizations/{$org->id}/deadline-items", [
            'name' => 'Bad owner',
            'due_date' => now()->addDays(10)->toDateString(),
            'recurrence' => 'none',
            'owner_user_id' => $stranger->id,
        ])->assertStatus(422);
    });

    it('deletes an item and cascades its reminder logs', function () {
        $user = User::factory()->create();
        $org = orgOwnedBy($user);
        $item = DeadlineItem::factory()->create(['organization_id' => $org->id, 'owner_user_id' => $user->id]);
        ReminderLog::create([
            'deadline_item_id' => $item->id, 'user_id' => $user->id, 'channel' => 'email',
            'content' => 'x', 'sent_at' => now(), 'success' => true,
        ]);

        $this->actingAs($user)->deleteJson("/api/deadline-items/{$item->id}")->assertStatus(200);

        expect(DeadlineItem::find($item->id))->toBeNull()
            ->and(ReminderLog::where('deadline_item_id', $item->id)->exists())->toBeFalse();
    });

});

describe('Mark done', function () {

    it('advances a recurring item and resets its status', function () {
        $user = User::factory()->create();
        $org = orgOwnedBy($user);
        $item = DeadlineItem::factory()->create([
            'organization_id' => $org->id,
            'owner_user_id' => $user->id,
            'due_date' => '2026-01-01',
            'recurrence' => 'monthly',
        ]);
        DeadlineItem::query()->where('id', $item->id)->update(['status' => 'overdue']);

        $response = $this->actingAs($user)->postJson("/api/deadline-items/{$item->id}/mark-done");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'upcoming')
            ->assertJsonPath('data.due_date', '2026-02-01');
    });

});

describe('Reminder rule overrides', function () {

    it('lets an owner set an org default and an item override independently', function () {
        $user = User::factory()->create();
        $org = orgOwnedBy($user);
        $item = DeadlineItem::factory()->create(['organization_id' => $org->id, 'owner_user_id' => $user->id]);

        $this->actingAs($user)->putJson("/api/organizations/{$org->id}/reminder-rule", [
            'offsets_days' => [60, 30],
            'overdue_repeat_days' => 7,
        ])->assertStatus(200)->assertJsonPath('data.offsets_days', [60, 30]);

        $this->actingAs($user)->putJson("/api/deadline-items/{$item->id}/reminder-rule", [
            'offsets_days' => [5],
            'overdue_repeat_days' => 1,
        ])->assertStatus(200)->assertJsonPath('data.offsets_days', [5]);

        // Removing the override reverts to the org default, not the
        // hardcoded fallback — the org row still exists.
        $this->actingAs($user)->deleteJson("/api/deadline-items/{$item->id}/reminder-rule")
            ->assertStatus(200)
            ->assertJsonPath('data.offsets_days', [60, 30]);
    });

    it('blocks a plain member from changing the org default', function () {
        $owner = User::factory()->create();
        $org = orgOwnedBy($owner);
        $member = User::factory()->create();
        $org->users()->attach($member->id, ['role' => 'member']);

        $this->actingAs($member)->putJson("/api/organizations/{$org->id}/reminder-rule", [
            'offsets_days' => [1],
            'overdue_repeat_days' => 1,
        ])->assertStatus(403);
    });

});
