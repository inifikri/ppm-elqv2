<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Fortify\RegistrationCaptcha;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class RegisterCaptchaController extends Controller
{
    public function __invoke(RegistrationCaptcha $captcha): JsonResponse
    {
        return response()->json($captcha->issue())->header('Cache-Control', 'no-store');
    }
}
