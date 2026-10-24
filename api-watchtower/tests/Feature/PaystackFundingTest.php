<?php

use App\Models\Organization;
use App\Models\PaymentIntent;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

const TEST_PUBLIC_KEY = 'pk_test_0000000000000000000000000000000000000000';
const TEST_SECRET_KEY = 'sk_test_0000000000000000000000000000000000000000';
const TEST_WEBHOOK_SECRET = 'whsec_test_secret';

beforeEach(function () {
    config([
        'services.paystack.public_key' => TEST_PUBLIC_KEY,
        'services.paystack.secret_key' => TEST_SECRET_KEY,
        'services.paystack.base_url' => 'https://api.paystack.co',
        'services.paystack.webhook_secret' => TEST_WEBHOOK_SECRET,
    ]);

    $this->owner = User::factory()->create();
    $this->org = Organization::factory()->create();
    $this->org->users()->attach($this->owner->id, ['role' => 'owner']);
});

function fakePaystackInit(): void
{
    Http::fake([
        'https://api.paystack.co/transaction/initialize' => Http::response([
            'status' => true,
            'message' => 'Authorization URL created',
            'data' => [
                'authorization_url' => 'https://checkout.paystack.com/abc123',
                'access_code' => 'abc123',
                'reference' => 'WT-REFERENCE',
            ],
        ]),
    ]);
}

function fakePaystackVerify(string $status = 'success', int $amount = 100000, string $currency = 'NGN'): void
{
    Http::fake([
        'https://api.paystack.co/transaction/verify/*' => Http::response([
            'status' => true,
            'message' => 'Verification successful',
            'data' => [
                'status' => $status,
                'amount' => $amount,
                'currency' => $currency,
                'reference' => 'WT-REFERENCE',
            ],
        ]),
    ]);
}

/**
 * Posts a webhook the way Paystack does: the signature is computed over the
 * raw JSON body and travels in the x-paystack-signature header.
 */
function postSignedWebhook(array $payload, string $secret = TEST_WEBHOOK_SECRET)
{
    $signature = hash_hmac('sha512', json_encode($payload), $secret);

    return test()->postJson('/api/webhooks/paystack', $payload, [
        'X-Paystack-Signature' => $signature,
    ]);
}

describe('initializing a wallet funding', function () {

    it('initializes a Paystack transaction and hands the popup payload back', function () {
        fakePaystackInit();

        $response = $this->actingAs($this->owner)->postJson("/api/organizations/{$this->org->id}/wallet/fund", [
            'amount' => 1000,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.public_key', TEST_PUBLIC_KEY)
            ->assertJsonPath('data.email', $this->owner->email)
            ->assertJsonPath('data.amount_cents', 100000)
            ->assertJsonPath('data.currency', 'NGN')
            ->assertJsonPath('data.mode', 'test')
            ->assertJsonPath('data.access_code', 'abc123');

        $reference = $response->json('data.reference');
        expect($reference)->toStartWith('WT-');

        Http::assertSent(function ($request) use ($reference) {
            return $request->url() === 'https://api.paystack.co/transaction/initialize'
                && $request['reference'] === $reference
                && $request['amount'] === 100000
                && $request['email'] === $this->owner->email
                && $request->hasHeader('Authorization', 'Bearer '.TEST_SECRET_KEY);
        });

        $intent = PaymentIntent::where('reference', $reference)->first();
        expect($intent)->not->toBeNull()
            ->and($intent->status)->toBe('pending')
            ->and($intent->access_code)->toBe('abc123')
            ->and($intent->amount_cents)->toBe(100000);
    });

    it('refuses to start a payment when Paystack is not configured', function () {
        config(['services.paystack.secret_key' => null]);

        $this->actingAs($this->owner)
            ->postJson("/api/organizations/{$this->org->id}/wallet/fund", ['amount' => 1000])
            ->assertStatus(503);
    });

    it('surfaces the Paystack error when the transaction cannot be initialized', function () {
        Http::fake([
            'https://api.paystack.co/transaction/initialize' => Http::response([
                'status' => false,
                'message' => 'Invalid key',
            ], 401),
        ]);

        $this->actingAs($this->owner)
            ->postJson("/api/organizations/{$this->org->id}/wallet/fund", ['amount' => 1000])
            ->assertStatus(502)
            ->assertJsonPath('message', 'Invalid key');

        expect(PaymentIntent::count())->toBe(0);
    });

    it('stops a member who is not an owner from funding the wallet', function () {
        $member = User::factory()->create();
        $this->org->users()->attach($member->id, ['role' => 'member']);

        $this->actingAs($member)
            ->postJson("/api/organizations/{$this->org->id}/wallet/fund", ['amount' => 1000])
            ->assertStatus(403);
    });
});

describe('verifying a wallet funding', function () {

    it('credits the wallet once Paystack confirms the transaction', function () {
        fakePaystackVerify('success', 100000);

        $intent = PaymentIntent::create([
            'organization_id' => $this->org->id,
            'provider' => 'paystack',
            'reference' => 'WT-REFERENCE',
            'amount_cents' => 100000,
            'currency' => 'NGN',
            'status' => 'pending',
        ]);

        $this->actingAs($this->owner)
            ->postJson("/api/organizations/{$this->org->id}/wallet/verify", ['reference' => 'WT-REFERENCE'])
            ->assertOk()
            ->assertJsonPath('message', 'Wallet funded successfully');

        $wallet = Wallet::where('organization_id', $this->org->id)->first();
        expect($wallet->balance_cents)->toBe(100000)
            ->and($wallet->available_cents)->toBe(100000)
            ->and($wallet->transactions()->count())->toBe(1)
            ->and($intent->fresh()->status)->toBe('succeeded')
            ->and($intent->fresh()->paid_at)->not->toBeNull();
    });

    it('does not credit anything when Paystack says the payment has not completed', function () {
        fakePaystackVerify('failed', 100000);

        PaymentIntent::create([
            'organization_id' => $this->org->id,
            'provider' => 'paystack',
            'reference' => 'WT-REFERENCE',
            'amount_cents' => 100000,
            'currency' => 'NGN',
            'status' => 'pending',
        ]);

        $this->actingAs($this->owner)
            ->postJson("/api/organizations/{$this->org->id}/wallet/verify", ['reference' => 'WT-REFERENCE'])
            ->assertStatus(422);

        expect(Wallet::where('organization_id', $this->org->id)->first())->toBeNull();

        expect(PaymentIntent::where('reference', 'WT-REFERENCE')->first()->status)->toBe('failed');
    });

    it('leaves a still-processing payment pending so the webhook can settle it', function () {
        fakePaystackVerify('processing', 100000);

        PaymentIntent::create([
            'organization_id' => $this->org->id,
            'provider' => 'paystack',
            'reference' => 'WT-REFERENCE',
            'amount_cents' => 100000,
            'currency' => 'NGN',
            'status' => 'pending',
        ]);

        $this->actingAs($this->owner)
            ->postJson("/api/organizations/{$this->org->id}/wallet/verify", ['reference' => 'WT-REFERENCE'])
            ->assertStatus(422);

        expect(Wallet::where('organization_id', $this->org->id)->first())->toBeNull();
        expect(PaymentIntent::where('reference', 'WT-REFERENCE')->first()->status)->toBe('pending');
    });

    it('refuses to credit when Paystack charged a different amount', function () {
        fakePaystackVerify('success', 5000);

        PaymentIntent::create([
            'organization_id' => $this->org->id,
            'provider' => 'paystack',
            'reference' => 'WT-REFERENCE',
            'amount_cents' => 100000,
            'currency' => 'NGN',
            'status' => 'pending',
        ]);

        $this->actingAs($this->owner)
            ->postJson("/api/organizations/{$this->org->id}/wallet/verify", ['reference' => 'WT-REFERENCE'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'The paid amount does not match the requested amount.');

        expect(Wallet::where('organization_id', $this->org->id)->first())->toBeNull();

        $intent = PaymentIntent::where('reference', 'WT-REFERENCE')->first();
        expect($intent->status)->toBe('pending');
    });

    it('only ever credits a payment once', function () {
        fakePaystackVerify('success', 100000);

        PaymentIntent::create([
            'organization_id' => $this->org->id,
            'provider' => 'paystack',
            'reference' => 'WT-REFERENCE',
            'amount_cents' => 100000,
            'currency' => 'NGN',
            'status' => 'pending',
        ]);

        $this->actingAs($this->owner)
            ->postJson("/api/organizations/{$this->org->id}/wallet/verify", ['reference' => 'WT-REFERENCE'])
            ->assertOk();

        $this->actingAs($this->owner)
            ->postJson("/api/organizations/{$this->org->id}/wallet/verify", ['reference' => 'WT-REFERENCE'])
            ->assertOk()
            ->assertJsonPath('message', 'Already credited');

        $wallet = Wallet::where('organization_id', $this->org->id)->first();
        expect($wallet->balance_cents)->toBe(100000)
            ->and($wallet->transactions()->count())->toBe(1);
    });

    it('will not verify a payment that belongs to another organization', function () {
        $otherOrg = Organization::factory()->create();

        PaymentIntent::create([
            'organization_id' => $otherOrg->id,
            'provider' => 'paystack',
            'reference' => 'WT-REFERENCE',
            'amount_cents' => 100000,
            'currency' => 'NGN',
            'status' => 'pending',
        ]);

        $this->actingAs($this->owner)
            ->postJson("/api/organizations/{$this->org->id}/wallet/verify", ['reference' => 'WT-REFERENCE'])
            ->assertStatus(404);
    });
});

describe('the Paystack webhook', function () {

    it('credits the wallet when a correctly signed charge.success arrives', function () {
        PaymentIntent::create([
            'organization_id' => $this->org->id,
            'provider' => 'paystack',
            'reference' => 'WT-REFERENCE',
            'amount_cents' => 100000,
            'currency' => 'NGN',
            'status' => 'pending',
        ]);

        postSignedWebhook(['event' => 'charge.success', 'data' => [
            'reference' => 'WT-REFERENCE',
            'amount' => 100000,
            'status' => 'success',
        ]])->assertOk();

        $wallet = Wallet::where('organization_id', $this->org->id)->first();
        expect($wallet->balance_cents)->toBe(100000)
            ->and($wallet->available_cents)->toBe(100000)
            ->and($wallet->transactions()->count())->toBe(1);
    });

    it('rejects a webhook whose signature does not match', function () {
        PaymentIntent::create([
            'organization_id' => $this->org->id,
            'provider' => 'paystack',
            'reference' => 'WT-REFERENCE',
            'amount_cents' => 100000,
            'currency' => 'NGN',
            'status' => 'pending',
        ]);

        postSignedWebhook(
            ['event' => 'charge.success', 'data' => ['reference' => 'WT-REFERENCE', 'amount' => 100000]],
            secret: 'wrong-secret'
        )->assertStatus(401);

        expect(Wallet::where('organization_id', $this->org->id)->first())->toBeNull();
    });

    it('rejects a webhook that carries no signature at all', function () {
        $this->postJson('/api/webhooks/paystack', [
            'event' => 'charge.success',
            'data' => ['reference' => 'WT-REFERENCE'],
        ])->assertStatus(401);
    });

    it('rejects a webhook when no webhook secret is configured', function () {
        config(['services.paystack.webhook_secret' => null]);

        postSignedWebhook(['event' => 'charge.success', 'data' => ['reference' => 'WT-REFERENCE']])
            ->assertStatus(401);
    });

    it('does not credit twice when Paystack delivers the same event again', function () {
        PaymentIntent::create([
            'organization_id' => $this->org->id,
            'provider' => 'paystack',
            'reference' => 'WT-REFERENCE',
            'amount_cents' => 100000,
            'currency' => 'NGN',
            'status' => 'pending',
        ]);

        $payload = ['event' => 'charge.success', 'data' => [
            'reference' => 'WT-REFERENCE',
            'amount' => 100000,
            'status' => 'success',
        ]];

        postSignedWebhook($payload)->assertOk();
        postSignedWebhook($payload)->assertOk();

        $wallet = Wallet::where('organization_id', $this->org->id)->first();
        expect($wallet->balance_cents)->toBe(100000)
            ->and($wallet->transactions()->count())->toBe(1);
    });

    it('rejects a charge for an amount that does not match the intent', function () {
        PaymentIntent::create([
            'organization_id' => $this->org->id,
            'provider' => 'paystack',
            'reference' => 'WT-REFERENCE',
            'amount_cents' => 100000,
            'currency' => 'NGN',
            'status' => 'pending',
        ]);

        postSignedWebhook(['event' => 'charge.success', 'data' => [
            'reference' => 'WT-REFERENCE',
            'amount' => 1,
            'status' => 'success',
        ]])->assertStatus(422);

        expect(Wallet::where('organization_id', $this->org->id)->first())->toBeNull();
    });

    it('marks a pending intent as failed when the charge fails', function () {
        $intent = PaymentIntent::create([
            'organization_id' => $this->org->id,
            'provider' => 'paystack',
            'reference' => 'WT-REFERENCE',
            'amount_cents' => 100000,
            'currency' => 'NGN',
            'status' => 'pending',
        ]);

        postSignedWebhook(['event' => 'charge.failed', 'data' => [
            'reference' => 'WT-REFERENCE',
        ]])->assertOk();

        expect($intent->fresh()->status)->toBe('failed')
            ->and(Wallet::where('organization_id', $this->org->id)->first())->toBeNull();
    });

    it('ignores an event for a payment it knows nothing about', function () {
        postSignedWebhook(['event' => 'charge.success', 'data' => [
            'reference' => 'WT-UNKNOWN',
            'amount' => 100000,
        ]])->assertOk();

        expect(Wallet::count())->toBe(0);
    });
});
