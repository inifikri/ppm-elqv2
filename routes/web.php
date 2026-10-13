<?php

use App\Http\Controllers\Auth\CompanySuggestController;
use App\Http\Controllers\Auth\LoginIdentifyController;
use App\Http\Controllers\Auth\RegisterCaptchaController;
use App\Http\Controllers\Auth\RegisterCheckEmailController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Participant\ParticipantAssessmentController;
use App\Http\Controllers\Participant\ParticipantEvaluatorController;
use App\Http\Controllers\Participant\ParticipantHomeController;
use App\Http\Controllers\StyleguideController;
use App\Http\Middleware\EnsureParticipant;
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

    Route::middleware(EnsureParticipant::class)
        ->prefix('participant')
        ->name('participant.')
        ->group(function () {
            Route::get('dashboard', [ParticipantHomeController::class, 'dashboard'])->name('dashboard');

            Route::get('evaluators', [ParticipantEvaluatorController::class, 'create'])->name('evaluators.setup');
            Route::post('evaluators', [ParticipantEvaluatorController::class, 'store'])->name('evaluators.store');

            Route::get('assessment', [ParticipantAssessmentController::class, 'show'])->name('assessment.run');
            Route::post('assessment/answers', [ParticipantAssessmentController::class, 'saveAnswer'])->name('assessment.answers.save');
            Route::post('assessment/submit', [ParticipantAssessmentController::class, 'submit'])->name('assessment.submit');
        });
});

require __DIR__.'/settings.php';

require __DIR__.'/admin.php';
