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

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [3, 10, 20];

    private static ?float $lastSentAt = null;

    public function __construct(
        public Rater $rater,
        public int $emailLogId
    ) {}

    public function handle(): void
    {
        if (! app()->runningUnitTests()) {
            @set_time_limit(120);
        }

        $emailLog = EmailLog::find($this->emailLogId);

        $maxAttempts = 3;
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                $this->rater->loadMissing('participant');

                if ($this->rater->email) {
                    if (! app()->runningUnitTests() && self::$lastSentAt !== null) {
                        $elapsed = microtime(true) - self::$lastSentAt;
                        if ($elapsed < 1.2) {
                            usleep((int) ((1.2 - $elapsed) * 1_000_000));
                        }
                    }

                    Mail::to($this->rater->email)
                        ->send(new AssessmentInvitationMail($this->rater));

                    self::$lastSentAt = microtime(true);
                }

                $emailLog?->update([
                    'status' => EmailLogStatus::Sent,
                    'sent_at' => now(),
                    'attempts' => ($emailLog->attempts ?? 0) + 1,
                    'error_message' => null,
                ]);

                return;
            } catch (\Throwable $e) {
                self::$lastSentAt = microtime(true);

                $isRateLimit = str_contains(strtolower($e->getMessage()), 'too many')
                    || str_contains($e->getMessage(), '550');

                if ($isRateLimit && $attempt < $maxAttempts) {
                    if (! app()->runningUnitTests()) {
                        sleep(2);
                    }
                    self::$lastSentAt = microtime(true);

                    continue;
                }

                $emailLog?->update([
                    'status' => EmailLogStatus::Failed,
                    'failed_at' => now(),
                    'error_message' => $e->getMessage(),
                    'attempts' => ($emailLog?->attempts ?? 0) + 1,
                ]);

                if (config('queue.default') !== 'sync') {
                    throw $e;
                }

                break;
            }
        }
    }
}
