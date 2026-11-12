<?php

namespace App\Actions\Fortify;

use Illuminate\Contracts\Session\Session;

/**
 * Proof-of-Work (SHA-256) berbasis session (tanpa dependency/layanan eksternal),
 * plus honeypot dan batas waktu minimum. Sekali pakai: selalu dibuang saat diverifikasi.
 */
class RegistrationCaptcha
{
    private const KEY = 'register.captcha';

    public function __construct(private Session $session) {}

    /** @return array{salt: string, challenge: string, max: int} */
    public function issue(): array
    {
        $max = max(1, (int) config('elq.register.pow_max', 15000));
        $salt = bin2hex(random_bytes(12));
        $answer = random_int(0, $max);

        $this->session->put(self::KEY, ['answer' => $answer, 'at' => time()]);

        return [
            'salt' => $salt,
            'challenge' => hash('sha256', "$salt:$answer"),
            'max' => $max,
        ];
    }

    /** Kembalikan kunci pesan lang `register.captcha.*` bila gagal, null bila lolos. */
    public function verify(mixed $answer, mixed $honeypot): ?string
    {
        $challenge = $this->session->pull(self::KEY);

        return match (true) {
            filled($honeypot) => 'failed',
            ! $challenge || ! is_numeric($answer) || (int) $answer !== $challenge['answer'] => 'wrong',
            time() - $challenge['at'] < config('elq.register.min_seconds') => 'too_fast',
            default => null,
        };
    }
}
