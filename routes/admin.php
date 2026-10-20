<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\CompanyController;
use App\Http\Controllers\Admin\DimensionController;
use App\Http\Controllers\Admin\EmailLogController;
use App\Http\Controllers\Admin\EmailTemplatePreviewController;
use App\Http\Controllers\Admin\ParticipantBulkController;
use App\Http\Controllers\Admin\ParticipantController;
use App\Http\Controllers\Admin\ParticipantExportController;
use App\Http\Controllers\Admin\ParticipantRaterController;
use App\Http\Controllers\Admin\ParticipantResultController;
use App\Http\Controllers\Admin\QuestionBulkController;
use App\Http\Controllers\Admin\QuestionController;
use App\Http\Controllers\Admin\SubDimensionController;
use App\Http\Controllers\Admin\UserBulkController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\UserDetailController;
use App\Http\Controllers\Admin\UserForceDeleteController;
use App\Http\Controllers\Admin\UserResetPasswordController;
use App\Http\Controllers\Admin\UserRestoreController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::middleware('can:users.manage')->group(function () {
            Route::post('users/bulk', UserBulkController::class)->name('users.bulk');
            Route::resource('users', UserController::class)->except(['show']);
            Route::get('users/{user}', [UserController::class, 'show'])
                ->whereNumber('user')
                ->name('users.show')
                ->withTrashed();
            Route::get('users/{user}/detail', UserDetailController::class)
                ->whereNumber('user')
                ->name('users.detail');
            Route::post('users/{user}/reset-password', UserResetPasswordController::class)
                ->whereNumber('user')
                ->middleware('throttle:6,1')
                ->name('users.reset-password');
            Route::post('users/{user}/restore', UserRestoreController::class)
                ->whereNumber('user')
                ->name('users.restore')
                ->withTrashed();
            Route::delete('users/{user}/force-delete', UserForceDeleteController::class)
                ->whereNumber('user')
                ->name('users.force-delete')
                ->withTrashed();
            Route::get('users/{user}/result', fn ($user) => redirect()->route('admin.participants.result.show', $user))
                ->whereNumber('user')
                ->withTrashed();
            Route::resource('companies', CompanyController::class)->except(['show']);
        });

        Route::middleware('can:participants.view')->group(function () {
            Route::get('participants', [ParticipantController::class, 'index'])->name('participants.index');
            Route::get('participants/create', [ParticipantController::class, 'create'])
                ->name('participants.create')
                ->middleware('can:participants.update');
            Route::post('participants', [ParticipantController::class, 'store'])
                ->name('participants.store')
                ->middleware('can:participants.update');
            Route::get('participants/export', ParticipantExportController::class)->name('participants.export');
            Route::get('participants/{participant}', [ParticipantController::class, 'show'])
                ->whereNumber('participant')
                ->name('participants.show')
                ->withTrashed();
            Route::delete('participants/{participant}', [ParticipantController::class, 'destroy'])
                ->whereNumber('participant')
                ->name('participants.destroy')
                ->middleware('can:participants.update');
            Route::get('participants/{participant}/edit', [ParticipantController::class, 'edit'])
                ->whereNumber('participant')
                ->name('participants.edit')
                ->middleware('can:participants.update');
            Route::put('participants/{participant}', [ParticipantController::class, 'update'])
                ->whereNumber('participant')
                ->name('participants.update')
                ->middleware('can:participants.update');
            Route::post('participants/{participant}/raters', [ParticipantRaterController::class, 'store'])
                ->whereNumber('participant')
                ->name('participants.raters.store')
                ->middleware('can:participants.update');
            Route::put('participants/{participant}/raters/{rater}', [ParticipantRaterController::class, 'update'])
                ->whereNumber('participant')
                ->name('participants.raters.update')
                ->middleware('can:participants.update');
            Route::post('participants/bulk', ParticipantBulkController::class)
                ->name('participants.bulk')
                ->middleware('can:participants.bulk');
            Route::post('participants/{participant}/raters/{rater}/resend', [ParticipantRaterController::class, 'resend'])
                ->whereNumber('participant')
                ->name('participants.raters.resend')
                ->middleware('can:raters.resend');
            Route::post('participants/{participant}/raters/{rater}/revoke', [ParticipantRaterController::class, 'revoke'])
                ->whereNumber('participant')
                ->name('participants.raters.revoke')
                ->middleware('can:raters.revoke');
        });

        Route::middleware('can:results.view')->group(function () {
            Route::get('participants/{participant}/result', [ParticipantResultController::class, 'show'])
                ->whereNumber('participant')
                ->name('participants.result.show')
                ->withTrashed();
            Route::get('participants/{participant}/result/detail', [ParticipantResultController::class, 'detail'])
                ->whereNumber('participant')
                ->name('participants.result.detail')
                ->withTrashed();
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

        Route::get('activity-logs', [ActivityLogController::class, 'index'])
            ->name('activity-logs.index')
            ->middleware('can:activity-log.view');

        Route::middleware('can:email-log.manage')->group(function () {
            Route::get('email-logs', [EmailLogController::class, 'index'])->name('email-logs.index');
            Route::post('email-logs/{emailLog}/retry', [EmailLogController::class, 'retry'])->name('email-logs.retry');
            Route::post('email-logs/bulk-retry', [EmailLogController::class, 'bulkRetry'])->name('email-logs.bulk-retry');
            Route::get('email-templates/preview', EmailTemplatePreviewController::class)->name('email-templates.preview');
        });
    });
