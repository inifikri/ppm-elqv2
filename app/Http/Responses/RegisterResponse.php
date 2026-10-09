<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Laravel\Fortify\Fortify;

class RegisterResponse implements RegisterResponseContract
{
    /** Wizard memanggil via JSON; tampilan sukses (tahap 3) dirender klien. */
    public function toResponse($request)
    {
        return $request->wantsJson()
            ? new JsonResponse(['email' => $request->user()->email], 201)
            : redirect()->intended(Fortify::redirects('register'));
    }
}
