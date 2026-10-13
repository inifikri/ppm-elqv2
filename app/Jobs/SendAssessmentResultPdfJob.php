<?php

namespace App\Jobs;

use App\Enums\EmailLogStatus;
use App\Mail\AssessmentResultMail;
use App\Models\EmailLog;
use App\Models\User;
use App\Services\Scoring\ResultChartRenderer;
use App\Services\Scoring\ScoreCalculator;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendAssessmentResultPdfJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public User $participant,
        public int $emailLogId
    ) {}

    public function handle(ScoreCalculator $calculator, ResultChartRenderer $chartRenderer): void
    {
        $emailLog = EmailLog::find($this->emailLogId);

        try {
            // Hitung hasil assessment on-demand
            $data = $calculator->calculate($this->participant);

            // Render grafik SVG server-side untuk PDF
            $radarSvg = $chartRenderer->renderRadarSvg($data['dimensions'] ?? []);

            // Buat PDF di memori tanpa disimpan ke disk
            $pdf = Pdf::loadView('pdf.assessment-result', [
                'result' => $data,
                'radarSvg' => $radarSvg,
            ]);

            $pdfBinary = $pdf->output();

            // Kirim email dengan lampiran PDF
            Mail::to($this->participant->email)
                ->send(new AssessmentResultMail($this->participant, $pdfBinary));

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
