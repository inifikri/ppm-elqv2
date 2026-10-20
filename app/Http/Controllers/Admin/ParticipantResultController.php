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

        $participant->loadMissing('participantProfile.company');
        $result = $calculator->calculate($participant);

        return Inertia::render('admin/participants/result/show', [
            'result' => $result,
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
     * Jadwalkan pengiriman PDF ke email akun peserta via queue (FR-021).
     */
    public function sendPdf(SendResultPdfRequest $request, User $participant): RedirectResponse
    {
        Gate::authorize(PermissionName::ResultsShare->value);

        // Catat email_logs awal (status: queued, tanpa lampiran/isi jawaban)
        $emailLog = EmailLog::create([
            'type' => EmailLogType::ResultShare,
            'recipient_email' => $participant->email,
            'user_id' => $participant->id,
            'status' => EmailLogStatus::Queued,
            'queued_at' => now(),
        ]);

        // Catat audit activity_log (FR-044: tanpa nilai jawaban, token, atau URL bertanda tangan)
        activity('results')
            ->causedBy($request->user())
            ->performedOn($participant)
            ->log('Kirim PDF hasil assessment ke email peserta');

        // Dispatch job ke queue
        SendAssessmentResultPdfJob::dispatch($participant, $emailLog->id);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Pengiriman PDF hasil assessment ke {$participant->email} berhasil dijadwalkan.",
        ]);

        return back();
    }
}
