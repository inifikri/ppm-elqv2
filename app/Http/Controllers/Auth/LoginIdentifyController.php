<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Fortify\LoginAttemptLimiter;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LoginIdentifyController extends Controller
{
    /**
     * Tahap 1: apakah email terdaftar dan mengembalikan info nama & role.
     */
    public function __invoke(Request $request, LoginAttemptLimiter $limiter): JsonResponse
    {
        $email = Str::lower(trim($request->validate(['email' => ['required', 'email', 'max:255']])['email']));

        $user = User::where('email', $email)->first();

        $roleLabel = null;
        if ($user) {
            if ($user->hasRole(UserRole::SuperAdmin->value)) {
                $roleLabel = 'Super Admin';
            } elseif ($user->hasRole(UserRole::Admin->value)) {
                $roleLabel = 'Administrator';
            } elseif ($user->hasRole(UserRole::Participant->value)) {
                $roleLabel = 'Peserta Assessment';
            } else {
                $roleLabel = $user->roles->first()?->name ? ucfirst($user->roles->first()->name) : 'Pengguna';
            }
        }

        return response()->json([
            'registered' => $user !== null,
            'name' => $user?->name,
            'role' => $roleLabel,
        ] + ($limiter->blocked($limiter->key($email, $request->ip())) ?? []));
    }
}
