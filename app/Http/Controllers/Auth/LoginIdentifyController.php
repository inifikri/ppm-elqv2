<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Fortify\LoginAttemptLimiter;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LoginIdentifyController extends Controller
{
    /**
     * Tahap 1: apakah email terdaftar. Status akun sengaja tidak diungkap.
     */
    public function __invoke(Request $request, LoginAttemptLimiter $limiter): JsonResponse
    {
        $email = Str::lower(trim($request->validate(['email' => ['required', 'email', 'max:255']])['email']));

        return response()->json([
            'registered' => User::where('email', $email)->exists(),
        ] + ($limiter->blocked($limiter->key($email, $request->ip())) ?? []));
    }
}
