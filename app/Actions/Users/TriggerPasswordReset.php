<?php

namespace App\Actions\Users;

use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use App\Models\EmailLog;
use App\Models\User;
use Illuminate\Support\Facades\Password;

class TriggerPasswordReset
{
    public function handle(User $actor, User $target): void
    {
        $token = Password::broker()->createToken($target);

        $emailLog = EmailLog::create([
            'type' => EmailLogType::PasswordReset,
            'recipient_email' => $target->email,
            'user_id' => $target->id,
            'status' => EmailLogStatus::Queued,
            'queued_at' => now(),
        ]);

        try {
            $target->sendPasswordResetNotification($token);

            $emailLog->update([
                'status' => EmailLogStatus::Sent,
                'sent_at' => now(),
            ]);
        } catch (\Throwable $e) {
            $emailLog->update([
                'status' => EmailLogStatus::Failed,
                'failed_at' => now(),
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }

        activity('users')
            ->performedOn($target)
            ->causedBy($actor)
            ->log('Memicu tautan reset password untuk pengguna');
    }
}
