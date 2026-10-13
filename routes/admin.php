<?php

use App\Http\Controllers\Admin\CompanyController;
use App\Http\Controllers\Admin\DimensionController;
use App\Http\Controllers\Admin\ParticipantResultController;
use App\Http\Controllers\Admin\QuestionBulkController;
use App\Http\Controllers\Admin\QuestionController;
use App\Http\Controllers\Admin\SubDimensionController;
use App\Http\Controllers\Admin\UserBulkController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\UserDetailController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::middleware('can:users.manage')->group(function () {
            Route::post('users/bulk', UserBulkController::class)->name('users.bulk');
            Route::get('users/{user}/detail', UserDetailController::class)->name('users.detail');
            Route::resource('users', UserController::class)->except(['show']);
            Route::resource('companies', CompanyController::class)->except(['show']);
        });

        Route::middleware('can:results.view')->group(function () {
            Route::get('results', [ParticipantResultController::class, 'index'])->name('results.index');
            Route::get('participants/{participant}/result', [ParticipantResultController::class, 'show'])->name('participants.result.show');
            Route::get('participants/{participant}/result/detail', [ParticipantResultController::class, 'detail'])->name('participants.result.detail');
        });

        Route::middleware('can:results.export')->group(function () {
            Route::get('participants/{participant}/result/pdf', [ParticipantResultController::class, 'pdf'])->name('participants.result.pdf');
        });

        Route::middleware('can:results.share')->group(function () {
            Route::post('participants/{participant}/result/send-pdf', [ParticipantResultController::class, 'sendPdf'])->name('participants.result.send-pdf');
        });

        Route::resource('domains', DimensionController::class)
            ->parameters(['domains' => 'dimension'])
            ->middleware('can:dimensions.manage');

        Route::resource('sub-domains', SubDimensionController::class)
            ->parameters(['sub-domains' => 'sub_dimension'])
            ->except(['show'])
            ->middleware('can:sub-dimensions.manage');

        Route::post('questions/bulk', QuestionBulkController::class)
            ->middleware('can:questions.manage')
            ->name('questions.bulk');
        Route::resource('questions', QuestionController::class)
            ->except(['show'])
            ->middleware('can:questions.manage');
    });
