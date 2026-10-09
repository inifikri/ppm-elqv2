<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Fortify\EmailDomainChecker;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegisterCheckEmailController extends Controller
{
    public function __invoke(Request $request, EmailDomainChecker $checker): JsonResponse
    {
        return response()
            ->json(['status' => $checker->status((string) $request->input('email'))])
            ->header('Cache-Control', 'no-store');
    }
}
