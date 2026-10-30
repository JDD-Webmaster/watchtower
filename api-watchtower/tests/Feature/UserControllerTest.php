<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Updating phone/country', function () {

    it('normalizes a national-format phone number using the given country', function () {
        $user = User::factory()->create(['phone' => null, 'country' => null]);

        $this->actingAs($user)->patchJson('/api/user', [
            'phone' => '08012345678',
            'country' => 'NG',
        ])->assertStatus(200)
            ->assertJsonPath('data.phone', '+2348012345678')
            ->assertJsonPath('data.country', 'NG');

        expect($user->fresh()->phone)->toBe('+2348012345678');
    });

    it('falls back to the user\'s existing country when none is supplied with the update', function () {
        $user = User::factory()->create(['phone' => null, 'country' => 'GH']);

        $this->actingAs($user)->patchJson('/api/user', [
            'phone' => '0244123456',
        ])->assertStatus(200)
            ->assertJsonPath('data.phone', '+233244123456');
    });

    it('rejects an invalid phone number', function () {
        $user = User::factory()->create(['phone' => null, 'country' => 'NG']);

        $this->actingAs($user)->patchJson('/api/user', [
            'phone' => 'not-a-number',
        ])->assertStatus(422)->assertJsonValidationErrors('phone');

        expect($user->fresh()->phone)->toBeNull();
    });

    it('clears the phone number when an empty string is sent', function () {
        $user = User::factory()->create(['phone' => '+2348012345678', 'country' => 'NG']);

        $this->actingAs($user)->patchJson('/api/user', [
            'phone' => '',
        ])->assertStatus(200);

        expect($user->fresh()->phone)->toBeNull();
    });

});
