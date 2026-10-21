<?php

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Registration', function () {

    it('creates a user and their first organization as owner', function () {
        $response = $this->postJson('/api/register', [
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'organization_name' => 'Ada Co',
        ]);

        $response->assertStatus(201);

        // Not just a DB check — the frontend's org switcher reads this
        // straight from the register response body. organizations is a
        // whenLoaded() field in UserResource, so a controller that
        // forgets ->load('organizations') returns a user with no orgs
        // in the JSON despite the DB row being correct underneath.
        $response->assertJsonPath('data.organizations.0.name', 'Ada Co')
            ->assertJsonPath('data.organizations.0.role', 'owner');

        $user = User::where('email', 'ada@example.com')->first();
        expect($user)->not->toBeNull()
            ->and($user->organizations)->toHaveCount(1)
            ->and($user->organizations->first()->pivot->role)->toBe('owner')
            ->and($user->organizations->first()->name)->toBe('Ada Co');
    });

});

describe('Login', function () {

    it('logs in with correct credentials and returns the user\'s organizations', function () {
        $user = User::factory()->create(['password' => bcrypt('password123')]);
        $org = Organization::factory()->create();
        $org->users()->attach($user->id, ['role' => 'member']);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->assertStatus(200)->assertJsonPath('data.organizations.0.id', $org->id);
    });

    it('returns the current user with organizations via GET /user', function () {
        $user = User::factory()->create();
        $org = Organization::factory()->create();
        $org->users()->attach($user->id, ['role' => 'owner']);

        $this->actingAs($user)->getJson('/api/user')
            ->assertStatus(200)
            ->assertJsonPath('data.organizations.0.id', $org->id);
    });

    it('rejects wrong credentials', function () {
        $user = User::factory()->create(['password' => bcrypt('password123')]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong',
        ])->assertStatus(422);
    });

});

describe('Logout', function () {

    // Deliberately logs in for real (not actingAs()) and then calls
    // /api/logout through the same session — actingAs() sets the 'web'
    // guard directly and never exercises the real auth:sanctum middleware
    // stack, which is exactly what masked a real bug here: inside a route
    // behind auth:sanctum, the bare Auth::logout() resolves Sanctum's
    // RequestGuard (no logout() method) instead of the session guard.
    it('logs out a real logged-in session without error', function () {
        $user = User::factory()->create(['password' => bcrypt('password123')]);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password123'])
            ->assertStatus(200);

        $this->postJson('/api/logout')->assertStatus(200);
    });

});
