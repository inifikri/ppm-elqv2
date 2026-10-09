<?php

namespace App\Actions\Fortify;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Penghitung percobaan login per kunci email+IP (cache, atomik via Cache::lock).
 * Kegagalan 1-2: sisa kesempatan. Ke-3: kunci 30 dtk. Ke-4: reset_required + blokir keras.
 */
class LoginAttemptLimiter
{
    public const MAX_ATTEMPTS = 3;

    public const LOCK_SECONDS = 30;

    private const WINDOW_SECONDS = 900;

    public function key(string $email, ?string $ip): string
    {
        return hash('sha256', Str::lower(trim($email)).'|'.$ip);
    }

    /**
     * @return array{reset_required?: true, retry_after: int}|null null bila tidak diblokir.
     */
    public function blocked(string $key): ?array
    {
        if (($hard = $this->remaining("login:hard:$key")) > 0) {
            return ['reset_required' => true, 'retry_after' => $hard];
        }

        if (($lock = $this->remaining("login:lock:$key")) > 0) {
            return ['retry_after' => $lock];
        }

        return null;
    }

    /**
     * Catat kegagalan. Hasil: attempts_left | retry_after | reset_required.
     *
     * @return array{attempts_left?: int, retry_after?: int, reset_required?: true}
     */
    public function fail(string $key): array
    {
        return Cache::lock("login:mutex:$key", 5)->block(3, function () use ($key) {
            $count = (int) Cache::get("login:fail:$key", 0) + 1;

            if ($count > self::MAX_ATTEMPTS) {
                $seconds = config('auth.login_hard_lock_minutes') * 60;
                Cache::put("login:hard:$key", now()->addSeconds($seconds)->getTimestamp(), $seconds);
                Cache::forget("login:fail:$key");
                Cache::forget("login:lock:$key");

                return ['reset_required' => true, 'retry_after' => $seconds];
            }

            Cache::put("login:fail:$key", $count, self::WINDOW_SECONDS);

            if ($count === self::MAX_ATTEMPTS) {
                Cache::put("login:lock:$key", now()->addSeconds(self::LOCK_SECONDS)->getTimestamp(), self::LOCK_SECONDS);

                return ['retry_after' => self::LOCK_SECONDS];
            }

            return ['attempts_left' => self::MAX_ATTEMPTS - $count];
        });
    }

    public function clear(string $key): void
    {
        Cache::forget("login:fail:$key");
        Cache::forget("login:lock:$key");
        Cache::forget("login:hard:$key");
    }

    private function remaining(string $cacheKey): int
    {
        $until = Cache::get($cacheKey);

        return $until ? max(0, $until - now()->getTimestamp()) : 0;
    }
}
