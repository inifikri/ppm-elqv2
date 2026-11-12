<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Jadwal pembersihan log harian pukul 02:00 WIB (FR-051 & Q-5)
Schedule::command('logs:purge')->dailyAt('02:00');
