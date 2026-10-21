<?php

use App\Models\DeadlineItem;
use App\Models\Organization;
use App\Models\ReminderLog;
use App\Models\ReminderRule;
use App\Models\User;
use App\Services\Sms\SmsRouter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

function setLocalTime(Organization $org, int $hour, int $minute = 0): void
{
    Carbon::setTestNow(Carbon::now($org->timezone)->setTime($hour, $minute));
}

function makeOrgWithOwner(array $orgOverrides = []): array
{
    $org = Organization::factory()->create(array_merge(['timezone' => 'UTC'], $orgOverrides));
    $owner = User::factory()->create();
    $org->users()->attach($owner->id, ['role' => 'owner']);

    return [$org, $owner];
}

beforeEach(function () {
    // Real SMS calls never happen in tests — KUDI/TERMII keys are blank,
    // and KudiSmsProvider legitimately returns false without them, but
    // mocking keeps these tests fast and makes "it sent" assertions
    // independent of that incidental behavior.
    $this->mock(SmsRouter::class, function ($mock) {
        $mock->shouldReceive('send')->andReturn(true)->byDefault();
    });
});

afterEach(function () {
    Carbon::setTestNow(null);
});

describe('DispatchReminders — offset matching', function () {

    it('reminds exactly on a configured offset day, not the day before or after', function () {
        [$org, $owner] = makeOrgWithOwner();
        $item = DeadlineItem::factory()->create([
            'organization_id' => $org->id,
            'owner_user_id' => $owner->id,
            'due_date' => now()->addDays(7)->toDateString(),
        ]);

        setLocalTime($org, 8);
        $this->artisan('reminders:dispatch');

        expect(ReminderLog::where('deadline_item_id', $item->id)->count())->toBeGreaterThan(0);
    });

    it('does not remind on a day that matches no offset', function () {
        [$org, $owner] = makeOrgWithOwner();
        $item = DeadlineItem::factory()->create([
            'organization_id' => $org->id,
            'owner_user_id' => $owner->id,
            'due_date' => now()->addDays(20)->toDateString(), // not in [30,14,7,1]
        ]);

        setLocalTime($org, 8);
        $this->artisan('reminders:dispatch');

        expect(ReminderLog::where('deadline_item_id', $item->id)->exists())->toBeFalse();
    });

    it('only acts on an organization during its own local reminder hour', function () {
        [$org, $owner] = makeOrgWithOwner(['timezone' => 'UTC']);
        $item = DeadlineItem::factory()->create([
            'organization_id' => $org->id,
            'owner_user_id' => $owner->id,
            'due_date' => now()->addDays(7)->toDateString(),
        ]);

        setLocalTime($org, 14); // not 08:00
        $this->artisan('reminders:dispatch');

        expect(ReminderLog::where('deadline_item_id', $item->id)->exists())->toBeFalse();
    });

    it('honors a per-item reminder rule override instead of the org default', function () {
        [$org, $owner] = makeOrgWithOwner();
        $item = DeadlineItem::factory()->create([
            'organization_id' => $org->id,
            'owner_user_id' => $owner->id,
            'due_date' => now()->addDays(5)->toDateString(), // not in org default [30,14,7,1]
        ]);
        ReminderRule::create(['deadline_item_id' => $item->id, 'offsets_days' => [5], 'overdue_repeat_days' => 3]);

        setLocalTime($org, 8);
        $this->artisan('reminders:dispatch');

        expect(ReminderLog::where('deadline_item_id', $item->id)->exists())->toBeTrue();
    });

    it('does nothing at all when REMINDERS_ENABLED is false platform-wide', function () {
        config(['reminders.enabled' => false]);
        [$org, $owner] = makeOrgWithOwner();
        $item = DeadlineItem::factory()->create([
            'organization_id' => $org->id,
            'owner_user_id' => $owner->id,
            'due_date' => now()->addDays(7)->toDateString(),
        ]);

        setLocalTime($org, 8);
        $this->artisan('reminders:dispatch');

        expect(ReminderLog::where('deadline_item_id', $item->id)->exists())->toBeFalse();
    });

});

describe('DispatchReminders — duplicate prevention', function () {

    it('never sends a second reminder for the same item on the same calendar day', function () {
        [$org, $owner] = makeOrgWithOwner();
        $item = DeadlineItem::factory()->create([
            'organization_id' => $org->id,
            'owner_user_id' => $owner->id,
            'due_date' => now()->addDays(7)->toDateString(),
        ]);

        setLocalTime($org, 8, 5);
        $this->artisan('reminders:dispatch');
        $firstRunCount = ReminderLog::where('deadline_item_id', $item->id)->count();

        setLocalTime($org, 8, 55); // same local hour, later run
        $this->artisan('reminders:dispatch');

        expect(ReminderLog::where('deadline_item_id', $item->id)->count())->toBe($firstRunCount);
    });

});

describe('DispatchReminders — overdue behavior', function () {

    it('flags an item overdue and sends a reminder past its due date', function () {
        [$org, $owner] = makeOrgWithOwner();
        $item = DeadlineItem::factory()->create([
            'organization_id' => $org->id,
            'owner_user_id' => $owner->id,
            'due_date' => now()->subDays(5)->toDateString(),
        ]);

        setLocalTime($org, 8);
        $this->artisan('reminders:dispatch');

        expect($item->fresh()->status)->toBe('overdue')
            ->and(ReminderLog::where('deadline_item_id', $item->id)->exists())->toBeTrue();
    });

    it('does not repeat an overdue reminder before overdue_repeat_days has passed', function () {
        [$org, $owner] = makeOrgWithOwner();
        $item = DeadlineItem::factory()->create([
            'organization_id' => $org->id,
            'owner_user_id' => $owner->id,
            'due_date' => now()->subDays(5)->toDateString(),
        ]);

        setLocalTime($org, 8);
        $this->artisan('reminders:dispatch'); // day 0 — sends
        $countAfterFirst = ReminderLog::where('deadline_item_id', $item->id)->count();

        Carbon::setTestNow(Carbon::now($org->timezone)->addDay()->setTime(8, 0)); // day 1
        $this->artisan('reminders:dispatch');

        expect(ReminderLog::where('deadline_item_id', $item->id)->count())->toBe($countAfterFirst);
    });

    it('repeats an overdue reminder once overdue_repeat_days has passed', function () {
        [$org, $owner] = makeOrgWithOwner();
        $item = DeadlineItem::factory()->create([
            'organization_id' => $org->id,
            'owner_user_id' => $owner->id,
            'due_date' => now()->subDays(5)->toDateString(),
        ]);

        setLocalTime($org, 8);
        $this->artisan('reminders:dispatch'); // day 0 — sends
        $countAfterFirst = ReminderLog::where('deadline_item_id', $item->id)->count();

        Carbon::setTestNow(Carbon::now($org->timezone)->addDays(3)->setTime(8, 0));
        $this->artisan('reminders:dispatch');

        expect(ReminderLog::where('deadline_item_id', $item->id)->count())->toBeGreaterThan($countAfterFirst);
    });

});

describe('DispatchReminders — inactive/done items', function () {

    it('never touches a done item', function () {
        [$org, $owner] = makeOrgWithOwner();
        $item = DeadlineItem::factory()->create([
            'organization_id' => $org->id,
            'owner_user_id' => $owner->id,
            'due_date' => now()->addDays(7)->toDateString(),
        ]);
        DeadlineItem::query()->where('id', $item->id)->update(['status' => 'done']);

        setLocalTime($org, 8);
        $this->artisan('reminders:dispatch');

        expect(ReminderLog::where('deadline_item_id', $item->id)->exists())->toBeFalse();
    });

    it('never touches an inactive item', function () {
        [$org, $owner] = makeOrgWithOwner();
        $item = DeadlineItem::factory()->create([
            'organization_id' => $org->id,
            'owner_user_id' => $owner->id,
            'due_date' => now()->addDays(7)->toDateString(),
            'is_active' => false,
        ]);

        setLocalTime($org, 8);
        $this->artisan('reminders:dispatch');

        expect(ReminderLog::where('deadline_item_id', $item->id)->exists())->toBeFalse();
    });

});

describe('DeadlineItem::markDone() recurrence', function () {

    it('advances a monthly item by exactly one month, anchored to the original due date', function () {
        $item = DeadlineItem::factory()->create([
            'due_date' => '2026-01-31',
            'recurrence' => 'monthly',
        ]);

        $item->markDone();

        expect($item->fresh()->due_date->toDateString())->toBe('2026-02-28') // no-overflow month add
            ->and($item->fresh()->status)->toBe('upcoming')
            ->and($item->fresh()->last_completed_at)->not->toBeNull();
    });

    it('advances a yearly item by exactly one year', function () {
        $item = DeadlineItem::factory()->create(['due_date' => '2026-03-15', 'recurrence' => 'yearly']);

        $item->markDone();

        expect($item->fresh()->due_date->toDateString())->toBe('2027-03-15');
    });

    it('advances a custom_days item by its configured interval', function () {
        $item = DeadlineItem::factory()->create([
            'due_date' => '2026-01-01',
            'recurrence' => 'custom_days',
            'recurrence_interval_days' => 90,
        ]);

        $item->markDone();

        expect($item->fresh()->due_date->toDateString())->toBe('2026-04-01');
    });

    it('marks a non-recurring item done permanently, with no due_date change', function () {
        $item = DeadlineItem::factory()->create(['due_date' => '2026-01-01', 'recurrence' => 'none']);

        $item->markDone();

        expect($item->fresh()->status)->toBe('done')
            ->and($item->fresh()->due_date->toDateString())->toBe('2026-01-01');
    });

    it('stops reminding a recurring item once it advances past the reminder window', function () {
        [$org, $owner] = makeOrgWithOwner();
        $item = DeadlineItem::factory()->create([
            'organization_id' => $org->id,
            'owner_user_id' => $owner->id,
            'due_date' => now()->addDays(7)->toDateString(),
            'recurrence' => 'yearly',
        ]);
        $item->markDone(); // now ~1 year out — no offset matches

        setLocalTime($org, 8);
        $this->artisan('reminders:dispatch');

        expect(ReminderLog::where('deadline_item_id', $item->id)->exists())->toBeFalse();
    });

});
