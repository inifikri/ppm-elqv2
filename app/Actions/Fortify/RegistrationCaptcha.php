<?php

namespace App\Actions\Fortify;

use Illuminate\Contracts\Session\Session;

/**
 * Captcha penjumlahan sederhana berbasis session (tanpa dependency/layanan eksternal),
 * plus honeypot dan batas waktu minimum. Sekali pakai: selalu dibuang saat diverifikasi.
 * ponytail: tidak tahan bot yang menghitung; ganti ke Turnstile/reCAPTCHA bila ada spam nyata.
 */
class RegistrationCaptcha
{
    private const KEY = 'register.captcha';

    public function __construct(private Session $session) {}

    /** @return array{question: string} */
    public function issue(): array
    {
        $a = random_int(2, 9);
        $b = random_int(2, 9);
        $this->session->put(self::KEY, ['answer' => $a + $b, 'at' => time()]);

        return ['question' => "$a + $b = ?"];
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
