<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        // Admin & peserta sama-sama ke home (belum ada area peserta terpisah). Belum verifikasi -> notice.
        $target = $request->user()->hasVerifiedEmail()
            ? redirect()->intended(config('fortify.home'))->getTargetUrl()
            : route('verification.notice');

        return $request->wantsJson()
            ? response()->json(['redirect' => $target])
            : redirect($target);
    }
}
