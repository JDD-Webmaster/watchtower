<?php

namespace App\Services\Sms;

// A pragmatic subset, not a full world map — covers Nigeria plus the
// African markets Kudi/Termii realistically serve. If precision beyond
// "which SMS gateway to route to and how to format the number" ever
// matters (e.g. real E.164 validation), swap this for a proper library
// like giggsey/libphonenumber-for-php rather than growing this map
// indefinitely.
class CountryCallingCodes
{
    private const MAP = [
        'NG' => '234', // Nigeria
        'GH' => '233', // Ghana
        'KE' => '254', // Kenya
        'ZA' => '27',  // South Africa
        'UG' => '256', // Uganda
        'TZ' => '255', // Tanzania
        'RW' => '250', // Rwanda
        'CI' => '225', // Côte d'Ivoire
        'SN' => '221', // Senegal
        'CM' => '237', // Cameroon
        'EG' => '20',  // Egypt
        'ET' => '251', // Ethiopia
        'ZM' => '260', // Zambia
        'BJ' => '229', // Benin
        'TG' => '228', // Togo
        'SL' => '232', // Sierra Leone
        'GM' => '220', // The Gambia
        'LR' => '231', // Liberia
        'MW' => '265', // Malawi
        'MZ' => '258', // Mozambique
    ];

    public static function forCountry(?string $iso2): string
    {
        return self::MAP[strtoupper($iso2 ?? '')] ?? self::MAP['NG'];
    }

    public static function isKnown(?string $iso2): bool
    {
        return isset(self::MAP[strtoupper($iso2 ?? '')]);
    }
}
