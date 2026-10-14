<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Users\TriggerPasswordReset;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class UserResetPasswordController extends Controller
{
    public function __invoke(Request $request, User $user, TriggerPasswordReset $trigger): RedirectResponse
    {
        Gate::authorize('resetPassword', $user);

        $trigger->handle($request->user(), $user);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Tautan reset password berhasil dikirim ke {$user->email}.",
        ]);

        return back();
    }
}
