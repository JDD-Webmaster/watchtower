<?php

namespace App\Services\Phone;

use Illuminate\Validation\ValidationException;
use libphonenumber\NumberParseException;
use libphonenumber\PhoneNumberFormat;
use libphonenumber\PhoneNumberUtil;

// Turns "whatever the user typed, plus whichever country they picked" into
// a stored E.164 number — so SmsRouter/CountryCallingCodes can trust
// `users.phone` is always dialable, instead of a malformed number only
// surfacing when a reminder silently fails to send (ReminderDispatchService
// logs "SMS send failed" with no further detail in that case).
class PhoneNumberNormalizer
{
    /**
     * @return array{phone: string, country: string}
     */
    public static function normalize(string $rawPhone, ?string $countryIso2): array
    {
        $util = PhoneNumberUtil::getInstance();

        try {
            $parsed = $util->parse($rawPhone, $countryIso2 ?: null);
        } catch (NumberParseException) {
            throw ValidationException::withMessages([
                'phone' => ['Enter a valid phone number, including the country code if it differs from the selected country.'],
            ]);
        }

        if (! $util->isValidNumber($parsed)) {
            throw ValidationException::withMessages([
                'phone' => ['That doesn\'t look like a valid number for the selected country.'],
            ]);
        }

        return [
            'phone' => $util->format($parsed, PhoneNumberFormat::E164),
            'country' => $countryIso2 ?: ($util->getRegionCodeForNumber($parsed) ?? 'NG'),
        ];
    }
}
