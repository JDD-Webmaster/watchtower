<?php

return [
    // Hard kill switch for the entire reminder engine — DispatchReminders
    // checks this first and does nothing at all if it's false. On by
    // default; this exists for an operator who needs to pause every
    // outgoing reminder platform-wide without touching code or waiting
    // on a deploy.
    'enabled' => env('REMINDERS_ENABLED', true),
];
