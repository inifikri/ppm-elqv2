<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureParticipant
{
    /**
     * Pastikan pengguna yang login memiliki role participant.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole(UserRole::Participant->value)) {
            abort(403, 'Hanya peserta yang dapat mengakses halaman ini.');
        }

        return $next($request);
    }
}
