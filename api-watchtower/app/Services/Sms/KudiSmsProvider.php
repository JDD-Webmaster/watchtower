<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

// Nigeria-only gateway — SmsRouter only ever hands this Nigerian numbers.
// Ported from UseLodger's production-proven integration.
class KudiSmsProvider implements SmsProviderInterface
{
    public function send(string $phone, string $message, ?string $senderId = null): bool
    {
        $smsId = uniqid('sms_');
        $formattedPhone = $this->formatPhone($phone);

        try {
            // No 'gateway' key in the body — Kudi's /api/corporate endpoint
            // doesn't parse application/x-www-form-urlencoded bodies (every
            // field comes back "missing"), and multipart got past that but
            // failed on sender ID. JSON is the one format proven to work
            // end-to-end.
            $params = [
                'token' => config('services.kudi_sms.api_key'),
                'senderID' => $senderId ?? config('services.kudi_sms.sender_id', 'WatchTower'),
                'recipients' => $formattedPhone,
                'message' => $message,
            ];

            Log::debug('KudiSMS sending', ['sms_id' => $smsId, 'phone' => $formattedPhone]);

            $response = Http::asJson()->timeout(15)->post(config('services.kudi_sms.endpoint'), $params);
            $responseData = $response->json();

            if ($response->successful() && ($responseData['error_code'] ?? '') === '000') {
                Log::info('KudiSMS sent successfully', ['sms_id' => $smsId, 'phone' => $formattedPhone]);

                return true;
            }

            Log::warning('KudiSMS HTTP client failed — falling back to cURL', [
                'sms_id' => $smsId,
                'error_code' => $responseData['error_code'] ?? 'unknown',
                'msg' => $responseData['msg'] ?? 'unknown',
            ]);

            return $this->sendViaCurl($params, $smsId, $formattedPhone);
        } catch (\Throwable $e) {
            Log::error('KudiSMS notification exception', [
                'sms_id' => $smsId,
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    private function sendViaCurl(array $params, string $smsId, string $formattedPhone): bool
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, config('services.kudi_sms.endpoint'));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));

        $curlResponse = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            Log::error('KudiSMS cURL error', ['sms_id' => $smsId, 'curl_error' => $curlError]);

            return false;
        }

        $responseData = json_decode($curlResponse, true);

        if ($httpCode === 200 && ($responseData['error_code'] ?? '') === '000') {
            Log::info('KudiSMS sent via cURL', ['sms_id' => $smsId, 'phone' => $formattedPhone]);

            return true;
        }

        Log::error('KudiSMS cURL also failed', [
            'sms_id' => $smsId,
            'http_code' => $httpCode,
            'error_code' => $responseData['error_code'] ?? 'unknown',
            'msg' => $responseData['msg'] ?? 'unknown',
        ]);

        return false;
    }

    /**
     * Format phone to 234XXXXXXXXXX for KudiSMS.
     * Handles: 08X (11-digit), 8X (10-digit), +234X, 234X (13-digit).
     */
    private function formatPhone(string $phone): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);

        if (strlen($cleaned) === 11 && $cleaned[0] === '0') {
            return '234'.substr($cleaned, 1);
        }

        if (strlen($cleaned) === 10) {
            return '234'.$cleaned;
        }

        if (strlen($cleaned) === 13 && str_starts_with($cleaned, '234')) {
            return $cleaned;
        }

        if (strlen($cleaned) === 12 && str_starts_with($cleaned, '234')) {
            return $cleaned;
        }

        Log::warning('KudiSMS: unrecognised phone format', ['original' => $phone, 'cleaned' => $cleaned]);

        return $cleaned;
    }
}
