<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Log;

// Single entry point for "send this person an SMS" — picks the provider by
// recipient country instead of every call site knowing about Kudi/Termii
// directly. Nigeria stays on Kudi; everywhere else routes to Termii. A
// null/unknown country defaults to Nigeria/Kudi. Ported from UseLodger.
class SmsRouter
{
    public function __construct(
        private readonly KudiSmsProvider $kudi,
        private readonly TermiiSmsProvider $termii,
    ) {}

    public function send(string $phone, string $message, ?string $senderId = null, ?string $countryIso2 = null): bool
    {
        $country = strtoupper($countryIso2 ?: 'NG');

        if ($country === 'NG') {
            return $this->kudi->send($phone, $message, $senderId);
        }

        if (empty(config('services.termii.api_key'))) {
            Log::warning('[SmsRouter] Non-Nigerian recipient but no SMS provider is configured for their country', [
                'country' => $country,
            ]);

            return false;
        }

        return $this->termii->send($this->toInternational($phone, $country), $message, $senderId);
    }

    private function toInternational(string $phone, string $countryIso2): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);
        $callingCode = CountryCallingCodes::forCountry($countryIso2);

        if (str_starts_with($cleaned, $callingCode)) {
            return $cleaned;
        }

        // Strip a leading national trunk '0' (common convention across
        // Nigeria, Ghana, Kenya, and most of the countries in
        // CountryCallingCodes) before prefixing the calling code.
        if (str_starts_with($cleaned, '0')) {
            $cleaned = substr($cleaned, 1);
        }

        return $callingCode.$cleaned;
    }
}
