<?php

namespace App\Actions\Fortify;

use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Tahap password login: kunci/blokir, kredensial, status akun.
 * Menggantikan AttemptToAuthenticate Fortify (route login.store tetap).
 */
class AttemptLogin
{
    public function __construct(private LoginAttemptLimiter $limiter) {}

    public function handle(Request $request, callable $next)
    {
        $email = (string) $request->input('email');
        $key = $this->limiter->key($email, $request->ip());

        if ($block = $this->limiter->blocked($key)) {
            activity('auth')->withProperties(['ip' => $request->ip()])->log('login_locked');
            $this->reject($request, $this->blockMessage($block), 429, $block);
        }

        $provider = Auth::guard()->getProvider();
        $user = $provider->retrieveByCredentials(['email' => $email]);

        // validateCredentials juga me-rehash otomatis hash bcrypt legacy.
        if (! $user || ! $provider->validateCredentials($user, ['password' => (string) $request->input('password')])) {
            $result = $this->limiter->fail($key);
            $event = isset($result['reset_required']) ? 'login_reset_required' : (isset($result['retry_after']) ? 'login_locked' : 'login_failed');
            activity('auth')->causedByAnonymous()->withProperties(['ip' => $request->ip()])->log($event);

            $message = match (true) {
                isset($result['reset_required']) => trans('login.reset_required', [], 'id'),
                isset($result['retry_after']) => trans('login.locked', ['seconds' => $result['retry_after']], 'id'),
                default => trans('login.failed', [], 'id').' '.trans('login.attempts_left', ['count' => $result['attempts_left']], 'id'),
            };

            $this->reject($request, $message, isset($result['retry_after']) ? 429 : 422, $result);
        }

        if (! $user->is_active) {
            $this->reject($request, trans('login.inactive', [], 'id'), 403);
        }

        $this->limiter->clear($key);
        Auth::guard()->login($user, $request->boolean('remember'));
        $user->forceFill(['last_login_at' => now()])->saveQuietly();
        activity('auth')->causedBy($user)->withProperties(['ip' => $request->ip()])->log('login_success');

        return $next($request);
    }

    /**
     * @param  array<string, mixed>  $block
     */
    private function blockMessage(array $block): string
    {
        return isset($block['reset_required'])
            ? trans('login.reset_required', [], 'id')
            : trans('login.locked', ['seconds' => $block['retry_after']], 'id');
    }

    /**
     * @param  array<string, mixed>  $extra
     */
    private function reject(Request $request, string $message, int $status, array $extra = []): never
    {
        if ($request->expectsJson()) {
            $headers = isset($extra['retry_after']) && $status === 429 ? ['Retry-After' => $extra['retry_after']] : [];

            throw new HttpResponseException(response()->json(['message' => $message] + $extra, $status, $headers));
        }

        throw ValidationException::withMessages(['email' => [$message]]);
    }
}
