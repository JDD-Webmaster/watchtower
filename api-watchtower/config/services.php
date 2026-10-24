<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'kudi_sms' => [
        'api_key' => env('KUDI_SMS_API_KEY'),
        'sender_id' => env('KUDI_SMS_SENDER_ID', 'WatchTower'),
        'endpoint' => env('KUDI_SMS_ENDPOINT', 'https://my.kudisms.net/api/corporate'),
    ],

    'termii' => [
        'api_key' => env('TERMII_API_KEY'),
        'sender_id' => env('TERMII_SENDER_ID', 'WatchTower'),
        'base_url' => env('TERMII_BASE_URL', 'https://api.ng.termii.com/api'),
        'channel' => env('TERMII_CHANNEL', 'generic'),
    ],

    // Paystack runs test and live on the same host — the key prefix is what
    // decides which side of the fence a request lands on. sk_test_ means
    // test mode, sk_live_ means real money. PAYSTACK_PAYMENT_URL is kept as
    // a fallback for older .env files that only set that one.
    'paystack' => [
        'public_key' => env('PAYSTACK_PUBLIC_KEY'),
        'secret_key' => env('PAYSTACK_SECRET_KEY'),
        'base_url' => rtrim(env('PAYSTACK_BASE_URL', env('PAYSTACK_PAYMENT_URL', 'https://api.paystack.co')), '/'),
        'webhook_secret' => env('PAYSTACK_WEBHOOK_SECRET'),
        'webhook_url' => env('PAYSTACK_WEBHOOK_URL'),
    ],

];
