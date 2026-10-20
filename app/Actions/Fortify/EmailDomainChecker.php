<?php

namespace App\Actions\Fortify;

use App\Http\Middleware\RejectHtmlTags;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Satu sumber logika status email registrasi, dipakai endpoint check-email dan validasi POST /register.
 * Status: ok | invalid | domain_not_found | taken. Keberadaan mailbox TIDAK bisa diverifikasi; hanya domain.
 */
class EmailDomainChecker
{
    public const OK = 'ok';

    public const INVALID = 'invalid';

    public const DOMAIN_NOT_FOUND = 'domain_not_found';

    public const TAKEN = 'taken';

    public function status(string $email): string
    {
        $email = Str::lower(trim($email));

        if (
            strlen($email) > 255
            || preg_match(RejectHtmlTags::PATTERN, $email) === 1
            || ! filter_var($email, FILTER_VALIDATE_EMAIL)
        ) {
            return self::INVALID;
        }

        if (User::withTrashed()->where('email', $email)->exists()) {
            return self::TAKEN;
        }

        if (config('elq.register.dns_check') && ! $this->domainExists(Str::after($email, '@'))) {
            return self::DOMAIN_NOT_FOUND;
        }

        return self::OK;
    }

    /**
     * Domain punya MX/A/AAAA. Hasil positif di-cache 24 jam, negatif 5 menit
     * (agar gangguan resolver sesaat tidak menolak domain valid sehari penuh).
     */
    public function domainExists(string $domain): bool
    {
        $key = 'register:dns:'.sha1($domain);

        if (($cached = Cache::get($key)) !== null) {
            return $cached;
        }

        // ponytail: resolver sistem, timeout mengikuti OS; ganti ke klien DNS ber-timeout bila lambat.
        $found = checkdnsrr($domain.'.', 'MX') || checkdnsrr($domain.'.', 'A') || checkdnsrr($domain.'.', 'AAAA');
        Cache::put($key, $found, $found ? now()->addDay() : now()->addMinutes(5));

        return $found;
    }

    public function message(string $status): string
    {
        return trans('register.email.'.$status, [], 'id');
    }
}
