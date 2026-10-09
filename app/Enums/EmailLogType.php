<?php

namespace App\Enums;

enum EmailLogType: string
{
    case RaterInvitation = 'rater_invitation';
    case EmailVerification = 'email_verification';
    case PasswordReset = 'password_reset';
    case ResultShare = 'result_share';

    public function label(): string
    {
        return match ($this) {
            self::RaterInvitation => 'Undangan penilai',
            self::EmailVerification => 'Verifikasi email',
            self::PasswordReset => 'Reset password',
            self::ResultShare => 'Kirim hasil',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
