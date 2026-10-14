<?php

namespace App\Providers;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Inertia\ExceptionResponse;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());

        Gate::before(fn (User $user) => $user->hasRole(UserRole::Admin->value) ? true : null);

        Route::model('participant', User::class);

        Inertia::handleExceptionsUsing(function (ExceptionResponse $response) {
            if (in_array($response->statusCode(), [401, 403, 404, 419, 429, 500, 503], true)) {
                return $response->render('error', [
                    'status' => $response->statusCode(),
                    'message' => $response->exception?->getMessage() ?: null,
                ])->withSharedData();
            }

            return null;
        });
    }
}
