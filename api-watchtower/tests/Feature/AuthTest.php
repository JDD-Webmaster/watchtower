<?php

use App\Models\Organization;
use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

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

    it('registers without a phone number — SMS just stays off until one is added', function () {
        $response = $this->postJson('/api/register', [
            'name' => 'Grace Hopper',
            'email' => 'grace@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'organization_name' => 'Hopper Co',
        ]);

        $response->assertStatus(201);

        $user = User::where('email', 'grace@example.com')->first();
        expect($user->phone)->toBeNull();
    });

    it('normalizes a national-format phone number to E.164 using the selected country', function () {
        $response = $this->postJson('/api/register', [
            'name' => 'Wangari Maathai',
            'email' => 'wangari@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'organization_name' => 'Maathai Co',
            'phone' => '0712345678',
            'country' => 'KE',
        ]);

        $response->assertStatus(201);

        $user = User::where('email', 'wangari@example.com')->first();
        expect($user->phone)->toBe('+254712345678')
            ->and($user->country)->toBe('KE');
    });

    it('rejects a phone number that is not valid for the selected country', function () {
        $this->postJson('/api/register', [
            'name' => 'Bad Number',
            'email' => 'badnumber@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'organization_name' => 'Bad Co',
            'phone' => '123',
            'country' => 'NG',
        ])->assertStatus(422)->assertJsonValidationErrors('phone');

        expect(User::where('email', 'badnumber@example.com')->exists())->toBeFalse();
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

describe('Password reset', function () {

    it('emails a reset link and resets the password with the token', function () {
        Notification::fake();

        $user = User::factory()->create(['password' => bcrypt('password123')]);

        $this->postJson('/api/forgot-password', ['email' => $user->email])
            ->assertStatus(200);

        Notification::assertSentTo($user, ResetPasswordNotification::class);

        // The notification carries the plaintext token; the broker stores
        // a hash of it. Pull the plaintext back out of the notification.
        $token = null;
        Notification::assertSentTo($user, ResetPasswordNotification::class,
            function ($notification) use (&$token) {
                $token = $notification->token;

                return true;
            });

        $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])->assertStatus(200);

        expect(Password::broker()->tokenExists($user, $token))->toBeFalse();

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'newpassword123',
        ])->assertStatus(200);
    });

    it('does not reveal whether an email is registered', function () {
        Notification::fake();

        $this->postJson('/api/forgot-password', ['email' => 'nobody@example.com'])
            ->assertStatus(200)
            ->assertJsonPath('message', 'If an account exists with that email, you will receive a password reset link shortly.');

        Notification::assertNothingSent();
    });

    it('rejects a bad token', function () {
        $user = User::factory()->create(['password' => bcrypt('password123')]);

        $this->postJson('/api/reset-password', [
            'token' => 'not-a-real-token',
            'email' => $user->email,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])->assertStatus(422);
    });

});
