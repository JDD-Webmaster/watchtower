<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Credentialed requests (cookies) can't use '*' per the CORS spec —
    // list real origins. Comma-separated so a self-hoster can add their
    // own frontend URL without touching code.
    //
    // FRONTEND_URLS is an optional extra list, for the case where the
    // SPA is reachable on more than one host (e.g. localhost AND
    // 127.0.0.1 — the browser picks whichever the user typed, and the
    // Origin header has to be in this list or the cookie won't be sent).
    'allowed_origins' => array_values(array_unique(array_filter(array_merge(
        explode(',', (string) env('FRONTEND_URL', 'http://localhost:3000')),
        explode(',', (string) env('FRONTEND_URLS', '')),
    )))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
