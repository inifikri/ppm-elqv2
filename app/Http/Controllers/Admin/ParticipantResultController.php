<?php

namespace App\Http\Controllers\Admin;

use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use App\Enums\PermissionName;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SendResultPdfRequest;
use App\Jobs\SendAssessmentResultPdfJob;
use App\Models\EmailLog;
use App\Models\User;
use App\Services\Reports\AssessmentPdfGenerator;
use App\Services\Reports\AssessmentReportBuilder;
use App\Services\Scoring\ScoreCalculator;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ParticipantResultController extends Controller
{
    /**
     * Tampilan utama review hasil assessment peserta (FR-017 s.d. FR-022).
     */
    public function show(User $participant, ScoreCalculator $calculator): Response
    {
        Gate::authorize(PermissionName::ResultsView->value);

        $participant->loadMissing(['participantProfile.company', 'raters']);
        $result = $calculator->calculate($participant);

        $raters = $participant->raters
            ->filter(fn ($r) => ! empty($r->email))
            ->values()
            ->map(fn ($r) => [
                'id' => $r->id,
                'role' => $r->role->value,
                'role_label' => $r->role->label(),
                'email' => $r->email,
                'is_submitted' => $r->isSubmitted(),
            ]);

        return Inertia::render('admin/participants/result/show', [
            'result' => $result,
            'raters' => $raters,
        ]);
    }

    /**
     * Rincian jawaban per pertanyaan untuk tabel server-side paginated (FR-020).
     */
    public function detail(Request $request, User $participant, ScoreCalculator $calculator): JsonResponse
    {
        Gate::authorize(PermissionName::ResultsView->value);

        $dimensionId = $request->query('dimension_id');
        $details = $calculator->getDetailedAnswers(
            $participant,
            $dimensionId ? (int) $dimensionId : null,
            15
        );

        return response()->json($details);
    }

    /**
     * Download laporan PDF on-demand tanpa disimpan ke disk (FR-022).
     */
    public function pdf(
        User $participant,
        AssessmentReportBuilder $reportBuilder,
        AssessmentPdfGenerator $pdfGenerator,
    ): HttpResponse|RedirectResponse {
        Gate::authorize(PermissionName::ResultsExport->value);

        $reportData = $reportBuilder->build($participant);

        if (! $reportData->hasData) {
            return back()->with('error', 'Belum ada data penilaian yang selesai untuk peserta ini.');
        }

        // Catat audit activity_log (FR-044: tanpa nilai jawaban, token, atau isi PDF)
        activity('results')
            ->causedBy(request()->user())
            ->performedOn($participant)
            ->log('Download PDF hasil assessment');

        $slug = Str::slug($participant->name) ?: 'peserta';
        $filename = "ELQ-Result_{$slug}_".now()->format('Ymd').'.pdf';

        return $pdfGenerator->downloadResponse($reportData, $filename);
    }

    /**
     * Jadwalkan pengiriman PDF ke email akun peserta dan/atau penerima pilihan via queue (FR-021).
     */
    public function sendPdf(SendResultPdfRequest $request, User $participant): RedirectResponse
    {
        Gate::authorize(PermissionName::ResultsShare->value);

        $participant->loadMissing('raters');

        $recipients = $request->input('recipients');
        if (empty($recipients) || ! is_array($recipients)) {
            $recipients = [$participant->email];
        }

        // Normalisasi dan hilangkan duplikat email yang valid
        $cleanRecipients = array_values(array_unique(array_filter(
            array_map(fn ($e) => strtolower(trim((string) $e)), $recipients),
            fn ($e) => filter_var($e, FILTER_VALIDATE_EMAIL) !== false
        )));

        if (empty($cleanRecipients)) {
            return back()->withErrors(['recipients' => 'Minimal pilih atau masukkan satu alamat email penerima yang valid.']);
        }

        foreach ($cleanRecipients as $targetEmail) {
            $recipientName = null;
            if ($targetEmail === strtolower($participant->email)) {
                $recipientName = $participant->name;
            } else {
                $matchedRater = $participant->raters->first(fn ($r) => strtolower((string) $r->email) === $targetEmail);
                if ($matchedRater) {
                    $recipientName = $matchedRater->role->label();
                }
            }

            // Catat email_logs awal (status: queued, tanpa lampiran/isi jawaban)
            $emailLog = EmailLog::create([
                'type' => EmailLogType::ResultShare,
                'recipient_email' => $targetEmail,
                'user_id' => $participant->id,
                'status' => EmailLogStatus::Queued,
                'queued_at' => now(),
            ]);

            // Dispatch job ke queue
            SendAssessmentResultPdfJob::dispatch($participant, $emailLog->id, $targetEmail, $recipientName);
        }

        // Catat audit activity_log (FR-044: tanpa nilai jawaban, token, atau URL bertanda tangan)
        activity('results')
            ->causedBy($request->user())
            ->performedOn($participant)
            ->log('Kirim PDF hasil assessment ke: '.implode(', ', $cleanRecipients));

        $count = count($cleanRecipients);
        $summary = $count === 1 ? $cleanRecipients[0] : "{$count} penerima (".implode(', ', $cleanRecipients).')';

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Pengiriman PDF hasil assessment ke {$summary} berhasil dijadwalkan.",
        ]);

        return back();
    }
}
