<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Hourly, not daily — DispatchReminders itself only acts during the hour
// that's currently 08:00 local for each organization's own timezone.
Schedule::command('reminders:dispatch')
    ->hourly()
    ->name('dispatch-reminders')
    ->withoutOverlapping();
