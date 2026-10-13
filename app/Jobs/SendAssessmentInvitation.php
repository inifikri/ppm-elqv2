<?php

namespace App\Jobs;

use App\Enums\EmailLogStatus;
use App\Mail\AssessmentInvitationMail;
use App\Models\EmailLog;
use App\Models\Rater;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendAssessmentInvitation implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Rater $rater,
        public int $emailLogId
    ) {}

    public function handle(): void
    {
        $emailLog = EmailLog::find($this->emailLogId);

        try {
            $this->rater->loadMissing('participant');

            if ($this->rater->email) {
                Mail::to($this->rater->email)
                    ->send(new AssessmentInvitationMail($this->rater));
            }

            $emailLog?->update([
                'status' => EmailLogStatus::Sent,
                'sent_at' => now(),
                'attempts' => ($emailLog->attempts ?? 0) + 1,
            ]);
        } catch (\Throwable $e) {
            $emailLog?->update([
                'status' => EmailLogStatus::Failed,
                'failed_at' => now(),
                'error_message' => $e->getMessage(),
                'attempts' => ($emailLog?->attempts ?? 0) + 1,
            ]);
        }
    }
}
