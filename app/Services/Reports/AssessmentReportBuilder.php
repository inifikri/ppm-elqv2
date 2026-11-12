<?php

namespace App\Services\Reports;

use App\Enums\EffectivenessCategory;
use App\Enums\RaterRole;
use App\Models\Question;
use App\Models\User;
use App\Services\Scoring\ScoreCalculator;
use Illuminate\Support\Facades\DB;

class AssessmentReportBuilder
{
    public function __construct(
        private readonly ScoreCalculator $calculator,
    ) {}

    /**
     * Bangun DTO laporan lengkap untuk peserta.
     */
    public function build(User $participant): AssessmentReportData
    {
        $participant->loadMissing('participantProfile.company');

        // 1. Hitung ringkasan skor dan hierarki dimensi dari ScoreCalculator
        $calculated = $this->calculator->calculate($participant);

        $participantInfo = [
            'id' => $participant->id,
            'name' => $participant->name,
            'email' => $participant->email,
            'phone' => $participant->phone ?? '-',
            'company' => $participant->participantProfile?->company?->name ?? '-',
            'position' => $participant->participantProfile?->position ?? '-',
        ];

        $printedAt = now()->locale('id')->isoFormat('D MMMM Y');

        if (! $calculated['has_data']) {
            return new AssessmentReportData(
                participant: $participantInfo,
                printedAt: $printedAt,
                hasData: false,
                answeredRaters: $calculated['answered_raters'],
                overallScore: null,
                overallCategory: null,
                roleOverallScores: [
                    'self' => null,
                    'boss' => null,
                    'subordinate' => null,
                ],
                dimensions: [],
            );
        }

        // 2. Ambil agregat nilai per pertanyaan untuk seluruh rater yang sudah submit (single query efisien)
        $questionScoresRaw = DB::table('answers')
            ->join('raters', 'raters.id', '=', 'answers.rater_id')
            ->where('raters.participant_id', $participant->id)
            ->whereNotNull('raters.submitted_at')
            ->selectRaw('answers.question_id, raters.role, AVG(answers.value) as avg_val')
            ->groupBy('answers.question_id', 'raters.role')
            ->get();

        $questionScoreMap = [];
        foreach ($questionScoresRaw as $row) {
            $questionScoreMap[$row->question_id][$row->role] = round((float) $row->avg_val, 2);
        }

        // 3. Ambil daftar seluruh pertanyaan beserta relasi sub_dimensi & dimensi dengan sorting ketat
        $questions = Question::withTrashed()
            ->join('sub_dimensions', 'sub_dimensions.id', '=', 'questions.sub_dimension_id')
            ->join('dimensions', 'dimensions.id', '=', 'sub_dimensions.dimension_id')
            ->select([
                'questions.id',
                'questions.text',
                'questions.sort_order as question_sort',
                'sub_dimensions.id as sub_dim_id',
                'dimensions.id as dim_id',
            ])
            ->orderBy('dimensions.sort_order')
            ->orderBy('sub_dimensions.sort_order')
            ->orderBy('questions.sort_order')
            ->get();

        // Kelompokkan pertanyaan per sub-dimensi dengan nomor urut 1..N
        $questionsBySubDim = [];
        $seq = 1;
        foreach ($questions as $q) {
            $qScores = $questionScoreMap[$q->id] ?? [];
            $self = $qScores[RaterRole::SelfRater->value] ?? null;
            $boss = $qScores[RaterRole::Boss->value] ?? null;
            $sub = $qScores[RaterRole::Subordinate->value] ?? null;

            $valid = array_filter([$self, $boss, $sub], fn ($v) => $v !== null);
            $avg = count($valid) > 0 ? round(array_sum($valid) / count($valid), 2) : null;

            $questionsBySubDim[$q->sub_dim_id][] = [
                'no' => $seq++,
                'id' => $q->id,
                'text' => $q->text,
                'scores' => [
                    'average' => $avg,
                    'self' => $self,
                    'boss' => $boss,
                    'subordinate' => $sub,
                ],
            ];
        }

        // 4. Susun hirarki dimensi dengan kategori dan lampiran pertanyaan
        $enrichedDimensions = [];
        foreach ($calculated['dimensions'] as $dim) {
            $dimCategory = EffectivenessCategory::fromScore($dim['scores']['average'] ?? null);

            $enrichedSubDims = [];
            foreach ($dim['sub_dimensions'] as $sub) {
                $enrichedSubDims[] = [
                    'id' => $sub['id'],
                    'name' => $sub['name'],
                    'sort_order' => $sub['sort_order'],
                    'scores' => $sub['scores'],
                    'questions' => $questionsBySubDim[$sub['id']] ?? [],
                ];
            }

            $enrichedDimensions[] = [
                'id' => $dim['id'],
                'name' => $dim['name'],
                'sort_order' => $dim['sort_order'],
                'scores' => $dim['scores'],
                'category' => $dimCategory,
                'sub_dimensions' => $enrichedSubDims,
            ];
        }

        $overallCategory = EffectivenessCategory::fromScore($calculated['overall_score']);

        return new AssessmentReportData(
            participant: $participantInfo,
            printedAt: $printedAt,
            hasData: true,
            answeredRaters: $calculated['answered_raters'],
            overallScore: $calculated['overall_score'],
            overallCategory: $overallCategory,
            roleOverallScores: $calculated['role_overall_scores'],
            dimensions: $enrichedDimensions,
        );
    }
}
