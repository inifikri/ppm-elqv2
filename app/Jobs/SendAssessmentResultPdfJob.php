<?php

namespace App\Jobs;

use App\Enums\EmailLogStatus;
use App\Mail\AssessmentResultMail;
use App\Models\EmailLog;
use App\Models\User;
use App\Services\Reports\AssessmentPdfGenerator;
use App\Services\Reports\AssessmentReportBuilder;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SendAssessmentResultPdfJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(
        public User $participant,
        public int $emailLogId
    ) {}

    public function handle(
        AssessmentReportBuilder $reportBuilder,
        AssessmentPdfGenerator $pdfGenerator,
    ): void {
        $emailLog = EmailLog::find($this->emailLogId);

        try {
            // Bangun data laporan lengkap on-demand (tanpa disimpan di server)
            $reportData = $reportBuilder->build($this->participant);

            // Buat binary PDF di memori worker
            $pdfBinary = $pdfGenerator->generateBinary($reportData);

            $slug = Str::slug($this->participant->name) ?: 'peserta';
            $filename = "ELQ-Result_{$slug}_".now()->format('Ymd').'.pdf';

            // Kirim email dengan lampiran PDF ke email akun peserta
            Mail::to($this->participant->email)
                ->send(new AssessmentResultMail($this->participant, $pdfBinary, $filename));

            // Perbarui log email menjadi Sent (tanpa menyimpan lampiran/isi jawaban)
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

            throw $e;
        }
    }
}
