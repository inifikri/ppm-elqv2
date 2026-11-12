<?php

namespace App\Http\Responses;

use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Laravel\Fortify\Fortify;

class RegisterResponse implements RegisterResponseContract
{
    /** Wizard memanggil via JSON; tampilan sukses (tahap 3) dirender klien. */
    public function toResponse($request)
    {
        $user = $request->user();
        if (! $user && $request->filled('email')) {
            $user = User::where('email', Str::lower(trim((string) $request->input('email'))))->first();
        }

        $latestLog = $user?->emailLogs()
            ->where('type', EmailLogType::EmailVerification)
            ->latest('id')
            ->first();

        $mailSent = $latestLog ? $latestLog->status === EmailLogStatus::Sent : true;

        return $request->wantsJson()
            ? new JsonResponse([
                'email' => $user?->email ?? (string) $request->input('email'),
                'mail_sent' => $mailSent,
            ], 201)
            : redirect()->intended(Fortify::redirects('register'));
    }
}
