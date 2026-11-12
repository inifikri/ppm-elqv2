<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\EmailLog;
use App\Models\Question;
use App\Services\Participant\ParticipantFlowResolver;
use App\Services\Reports\AssessmentPdfGenerator;
use App\Services\Reports\AssessmentReportBuilder;
use App\Services\Scoring\ScoreCalculator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ParticipantHomeController extends Controller
{
    /**
     * Entry point yang mengarahkan peserta ke langkah alur yang tepat.
     */
    public function index(Request $request, ParticipantFlowResolver $flowResolver): Response|RedirectResponse
    {
        $flow = $flowResolver->resolve($request->user());

        return match ($flow['state']) {
            ParticipantFlowResolver::STATE_SETUP_EVALUATORS => to_route('participant.evaluators.setup'),
            ParticipantFlowResolver::STATE_ASSESSMENT_RUN => to_route('participant.assessment.run'),
            ParticipantFlowResolver::STATE_COMPLETED => $this->dashboard($request, $flowResolver, app(ScoreCalculator::class)),
            default => to_route('participant.evaluators.setup'),
        };
    }

    /**
     * Halaman Dashboard Peserta (hanya bisa dibuka bila self sudah submit).
     */
    public function dashboard(
        Request $request,
        ParticipantFlowResolver $flowResolver,
        ScoreCalculator $calculator,
    ): Response|RedirectResponse {
        $user = $request->user();
        $flow = $flowResolver->resolve($user);

        if ($flow['state'] !== ParticipantFlowResolver::STATE_COMPLETED) {
            return $this->index($request, $flowResolver);
        }

        $user->loadMissing('participantProfile.company');

        $bossRater = $flow['boss_rater'];
        $subRaters = $flow['subordinate_raters'];

        // Ambil status email log terbaru untuk tiap rater
        $raterIds = collect([$bossRater?->id, ...$subRaters->pluck('id')])->filter()->all();
        $emailLogs = EmailLog::query()
            ->whereIn('rater_id', $raterIds)
            ->latest('id')
            ->get()
            ->keyBy('rater_id');

        $bossStatus = $bossRater ? [
            'email' => $bossRater->email,
            'is_submitted' => $bossRater->submitted_at !== null,
            'submitted_at' => $bossRater->submitted_at?->toIso8601String(),
            'email_status' => $emailLogs->get($bossRater->id)?->status?->value ?? 'queued',
        ] : null;

        $subordinatesStatus = $subRaters->map(fn ($r) => [
            'email' => $r->email,
            'is_submitted' => $r->submitted_at !== null,
            'submitted_at' => $r->submitted_at?->toIso8601String(),
            'email_status' => $emailLogs->get($r->id)?->status?->value ?? 'queued',
        ])->all();

        $totalInvited = count($subordinatesStatus) + ($bossStatus ? 1 : 0);
        $totalSubmitted = ($bossStatus && $bossStatus['is_submitted'] ? 1 : 0)
            + count(array_filter($subordinatesStatus, fn ($s) => $s['is_submitted']));

        // Hitung hasil assessment peserta (FR-017 s.d. FR-020)
        $result = $calculator->calculate($user);

        return Inertia::render('participant/dashboard', [
            'participant' => [
                'name' => $user->name,
                'email' => $user->email,
                'company' => $user->participantProfile?->company?->name,
                'position' => $user->participantProfile?->position,
            ],
            'self_assessment' => [
                'is_submitted' => true,
                'submitted_at' => $flow['self_rater']?->submitted_at?->toIso8601String(),
                'total_questions' => Question::count(),
            ],
            'evaluators' => [
                'boss' => $bossStatus,
                'subordinates' => $subordinatesStatus,
                'total_invited' => $totalInvited,
                'total_submitted' => $totalSubmitted,
            ],
            'result' => $result,
        ]);
    }

    /**
     * Download laporan PDF on-demand oleh peserta (FR-022).
     */
    public function pdf(
        Request $request,
        AssessmentReportBuilder $reportBuilder,
        AssessmentPdfGenerator $pdfGenerator,
    ): HttpResponse|RedirectResponse {
        $user = $request->user();
        $reportData = $reportBuilder->build($user);

        if (! $reportData->hasData) {
            return back()->with('error', 'Belum ada data penilaian yang selesai untuk diunduh.');
        }

        // Catat audit activity_log (FR-044)
        activity('results')
            ->causedBy($user)
            ->performedOn($user)
            ->log('Download PDF hasil assessment oleh peserta');

        $slug = Str::slug($user->name) ?: 'peserta';
        $filename = "ELQ-Hasil-Asesmen_{$slug}_".now()->format('Ymd').'.pdf';

        return $pdfGenerator->downloadResponse($reportData, $filename);
    }
}
