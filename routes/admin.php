<?php

use App\Http\Controllers\Admin\CompanyController;
use App\Http\Controllers\Admin\DimensionController;
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
