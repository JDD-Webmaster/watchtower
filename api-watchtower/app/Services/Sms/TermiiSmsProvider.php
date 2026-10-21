<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

// Pan-African gateway — SmsRouter hands this anything outside Nigeria.
// Phone number is expected to already be in international format (digits
// only, no leading '+') by the time it reaches send() — SmsRouter does
// that conversion once. Ported from UseLodger's production integration.
class TermiiSmsProvider implements SmsProviderInterface
{
    public function send(string $phone, string $message, ?string $senderId = null): bool
    {
        if (empty(config('services.termii.api_key'))) {
            // Deliberately not an error-level log — this is the expected
            // state until a real Termii account is wired in, not a fault.
            Log::warning('[TermiiSMS] No API key configured — skipping send', ['phone' => $phone]);

            return false;
        }

        $smsId = uniqid('termii_');

        try {
            $endpoint = rtrim(config('services.termii.base_url', 'https://api.ng.termii.com/api'), '/').'/sms/send';

            $response = Http::asJson()->timeout(15)->post($endpoint, [
                'to' => $phone,
                'from' => $senderId ?? config('services.termii.sender_id', 'WatchTower'),
                'sms' => $message,
                'type' => 'plain',
                'channel' => config('services.termii.channel', 'generic'),
                'api_key' => config('services.termii.api_key'),
            ]);

            $data = $response->json();

            // Success shape: {"message_id": "...", "message": "Successfully Sent", ...}
            if ($response->successful() && ! empty($data['message_id'])) {
                Log::info('TermiiSMS sent successfully', ['sms_id' => $smsId, 'phone' => $phone, 'message_id' => $data['message_id']]);

                return true;
            }

            Log::error('TermiiSMS send failed', [
                'sms_id' => $smsId,
                'phone' => $phone,
                'status' => $response->status(),
                'response' => $data,
            ]);

            return false;
        } catch (\Throwable $e) {
            Log::error('TermiiSMS notification exception', [
                'sms_id' => $smsId,
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
