<?php

namespace App\Services\Sms;

interface SmsProviderInterface
{
    /**
     * @param  string  $phone  Recipient phone, any reasonable human-typed
     *                         format — the provider is responsible for its
     *                         own formatting (different gateways expect
     *                         different shapes for the same E.164 number).
     */
    public function send(string $phone, string $message, ?string $senderId = null): bool;
}
