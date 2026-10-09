<?php

use App\Http\Controllers\Auth\CompanySuggestController;
use App\Http\Controllers\Auth\LoginIdentifyController;
use App\Http\Controllers\Auth\RegisterCaptchaController;
use App\Http\Controllers\Auth\RegisterCheckEmailController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\StyleguideController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::post('login/identify', LoginIdentifyController::class)->middleware(['guest', 'throttle:10,1'])->name('login.identify');

Route::middleware('guest')->group(function () {
    Route::post('register/check-email', RegisterCheckEmailController::class)->middleware('throttle:20,1')->name('register.check-email');
    Route::get('register/captcha', RegisterCaptchaController::class)->middleware('throttle:20,1')->name('register.captcha');
    Route::get('companies/suggest', CompanySuggestController::class)->middleware('throttle:60,1')->name('companies.suggest');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('styleguide', StyleguideController::class)->name('styleguide'); // 404 outside local
});

require __DIR__.'/settings.php';

require __DIR__.'/admin.php';
