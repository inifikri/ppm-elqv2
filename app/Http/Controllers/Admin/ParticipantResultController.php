<?php

namespace App\Http\Controllers\Admin;

use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use App\Enums\PermissionName;
use App\Enums\RaterRole;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SendResultPdfRequest;
use App\Jobs\SendAssessmentResultPdfJob;
use App\Models\EmailLog;
use App\Models\User;
use App\Services\Scoring\ResultChartRenderer;
use App\Services\Scoring\ScoreCalculator;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ParticipantResultController extends Controller
{
    /**
     * Daftar ringkasan hasil assessment per peserta.
     */
    public function index(Request $request): Response
    {
        Gate::authorize(PermissionName::ResultsView->value);

        $search = $request->query('search');
        $like = $search === null || trim($search) === ''
            ? null
            : '%'.addcslashes(trim($search), '\\%_').'%';

        $participants = User::query()
            ->role(UserRole::Participant->value)
            ->with([
                'participantProfile.company',
                'raters' => fn ($q) => $q->select('id', 'participant_id', 'role', 'submitted_at'),
            ])
            ->when($like, fn ($query) => $query->where(fn ($q) => $q
                ->where('name', 'like', $like)
                ->orWhere('email', 'like', $like)
                ->orWhereHas('participantProfile', fn ($p) => $p
                    ->where('position', 'like', $like)
                    ->orWhereHas('company', fn ($c) => $c->where('name', 'like', $like)))))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(function (User $user) {
                $raters = $user->raters;
                $selfRater = $raters->firstWhere('role', RaterRole::SelfRater);
                $bossRater = $raters->firstWhere('role', RaterRole::Boss);
                $subRaters = $raters->where('role', RaterRole::Subordinate);

                $selfSubmitted = $selfRater?->submitted_at !== null;
                $bossSubmitted = $bossRater?->submitted_at !== null;
                $subTotal = $subRaters->count();
                $subSubmitted = $subRaters->whereNotNull('submitted_at')->count();

                $totalRaters = $raters->count();
                $totalSubmitted = $raters->whereNotNull('submitted_at')->count();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'company' => $user->participantProfile?->company?->name,
                    'position' => $user->participantProfile?->position,
                    'raters_status' => [
                        'self' => $selfSubmitted,
                        'boss' => $bossSubmitted,
                        'subordinate' => [
                            'submitted' => $subSubmitted,
                            'total' => $subTotal,
                        ],
                        'total_submitted' => $totalSubmitted,
                        'total_raters' => $totalRaters,
                    ],
                    'is_completed' => $totalRaters > 0 && $totalSubmitted >= $totalRaters,
                    'has_data' => $totalSubmitted > 0,
                ];
            });

        return Inertia::render('admin/participants/result/index', [
            'participants' => $participants,
            'filters' => [
                'search' => $search ?? '',
            ],
        ]);
    }

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
        ScoreCalculator $calculator,
        ResultChartRenderer $chartRenderer
    ): HttpResponse {
        Gate::authorize(PermissionName::ResultsExport->value);

        $participant->loadMissing('participantProfile.company');
        $result = $calculator->calculate($participant);
        $radarSvg = $chartRenderer->renderRadarSvg($result['dimensions'] ?? []);

        $pdf = Pdf::loadView('pdf.assessment-result', [
            'result' => $result,
            'radarSvg' => $radarSvg,
        ]);

        return $pdf->download("hasil-assessment-{$participant->name}.pdf");
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
