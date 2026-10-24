<?php

namespace App\Services\Payment;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Thin wrapper around the Paystack REST API.
 *
 * Paystack serves test and live from the same host (https://api.paystack.co);
 * the secret key prefix decides which environment a call lands in, so there
 * is no separate sandbox base URL to switch between.
 */
class PaystackService
{
    public function publicKey(): ?string
    {
        $key = config('services.paystack.public_key');

        return is_string($key) && $key !== '' ? $key : null;
    }

    public function secretKey(): ?string
    {
        $key = config('services.paystack.secret_key');

        return is_string($key) && $key !== '' ? $key : null;
    }

    /**
     * Webhook signature verification is only possible once a secret is set.
     */
    public function hasWebhookSecret(): bool
    {
        $secret = config('services.paystack.webhook_secret');

        return is_string($secret) && $secret !== '';
    }

    public function isConfigured(): bool
    {
        return $this->publicKey() !== null && $this->secretKey() !== null;
    }

    public function isTestMode(): bool
    {
        return str_starts_with((string) $this->secretKey(), 'sk_test_');
    }

    public function mode(): string
    {
        return $this->isTestMode() ? 'test' : 'live';
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed> The `data` block Paystack returns.
     */
    public function initializeTransaction(array $payload): array
    {
        $response = $this->client()->post('/transaction/initialize', $payload);

        $body = $response->json();
        $data = $body['data'] ?? [];

        if (! $response->successful() || ! ($body['status'] ?? false) || empty($data['authorization_url'])) {
            Log::warning('[PaystackService] transaction initialization failed', [
                'http_status' => $response->status(),
                'reference' => $payload['reference'] ?? null,
                'response' => $body,
            ]);

            throw new RuntimeException($this->errorMessage($body, 'Paystack could not start the payment.'));
        }

        return $data;
    }

    /**
     * @return array<string, mixed> The verified `data` block.
     */
    public function verifyTransaction(string $reference): array
    {
        $response = $this->client()->get('/transaction/verify/'.rawurlencode($reference));

        $body = $response->json();
        $data = $body['data'] ?? [];

        if (! $response->successful() || ! ($body['status'] ?? false) || empty($data)) {
            Log::warning('[PaystackService] transaction verification failed', [
                'http_status' => $response->status(),
                'reference' => $reference,
                'response' => $body,
            ]);

            throw new RuntimeException($this->errorMessage($body, 'Paystack could not verify the payment.'));
        }

        return $data;
    }

    /**
     * Paystack signs the raw request body with HMAC-SHA512 and sends the hex
     * digest in the `x-paystack-signature` header.
     */
    public function computeSignature(string $payload): string
    {
        return hash_hmac('sha512', $payload, (string) config('services.paystack.webhook_secret'));
    }

    public function hasValidSignature(string $payload, ?string $signature): bool
    {
        if (! $this->hasWebhookSecret() || ! is_string($signature) || $signature === '') {
            return false;
        }

        return hash_equals($this->computeSignature($payload), $signature);
    }

    private function client(): PendingRequest
    {
        return Http::withToken((string) $this->secretKey())
            ->baseUrl((string) config('services.paystack.base_url'))
            ->acceptJson()
            ->asJson()
            ->timeout(20);
    }

    /**
     * @param  array<string, mixed>  $body
     */
    private function errorMessage(array $body, string $fallback): string
    {
        $message = $body['message'] ?? null;

        return is_string($message) && $message !== '' ? $message : $fallback;
    }
}
