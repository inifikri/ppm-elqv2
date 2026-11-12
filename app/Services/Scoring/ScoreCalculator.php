<?php

namespace App\Services\Scoring;

use App\Enums\RaterRole;
use App\Models\Dimension;
use App\Models\Question;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ScoreCalculator
{
    /**
     * Hitung skor assessment untuk satu peserta.
     * Murni komputasi on-demand, tidak disimpan ke database.
     *
     * @return array<string, mixed>
     */
    public function calculate(User $participant): array
    {
        // 1. Ambil status penyelesaian per role penilai
        $ratersStats = DB::table('raters')
            ->where('participant_id', $participant->id)
            ->selectRaw('role, count(*) as total, count(submitted_at) as submitted')
            ->groupBy('role')
            ->get()
            ->keyBy('role');

        $selfTotal = (int) ($ratersStats->get(RaterRole::SelfRater->value)?->total ?? 0);
        $selfSubmitted = (int) ($ratersStats->get(RaterRole::SelfRater->value)?->submitted ?? 0);

        $bossTotal = (int) ($ratersStats->get(RaterRole::Boss->value)?->total ?? 0);
        $bossSubmitted = (int) ($ratersStats->get(RaterRole::Boss->value)?->submitted ?? 0);

        $subTotal = (int) ($ratersStats->get(RaterRole::Subordinate->value)?->total ?? 0);
        $subSubmitted = (int) ($ratersStats->get(RaterRole::Subordinate->value)?->submitted ?? 0);

        $totalSubmitted = $selfSubmitted + $bossSubmitted + $subSubmitted;
        $totalRaters = $selfTotal + $bossTotal + $subTotal;

        $answeredRaters = [
            'self' => [
                'submitted' => $selfSubmitted,
                'total' => $selfTotal,
                'is_complete' => $selfTotal > 0 && $selfSubmitted >= $selfTotal,
            ],
            'boss' => [
                'submitted' => $bossSubmitted,
                'total' => $bossTotal,
                'is_complete' => $bossTotal > 0 && $bossSubmitted >= $bossTotal,
            ],
            'subordinate' => [
                'submitted' => $subSubmitted,
                'total' => $subTotal,
                'is_complete' => $subTotal > 0 && $subSubmitted >= $subTotal,
            ],
            'total_submitted' => $totalSubmitted,
            'total_raters' => $totalRaters,
            'is_all_complete' => $totalRaters > 0 && $totalSubmitted >= $totalRaters,
        ];

        $participantInfo = [
            'id' => $participant->id,
            'name' => $participant->name,
            'email' => $participant->email,
            'company' => $participant->participantProfile?->company?->name,
            'position' => $participant->participantProfile?->position,
        ];

        // Jika tidak ada rater yang sudah submit sama sekali
        if ($totalSubmitted === 0) {
            return [
                'has_data' => false,
                'participant' => $participantInfo,
                'answered_raters' => $answeredRaters,
                'overall_score' => null,
                'role_overall_scores' => [
                    'self' => null,
                    'boss' => null,
                    'subordinate' => null,
                ],
                'dimensions' => [],
            ];
        }

        // 2. Query agregat tunggal untuk rata-rata nilai per (dimensi, sub_dimensi, role)
        // Pertanyaan / sub-dimensi soft-deleted tetap dihitung untuk integritas data historis.
        $rawScores = DB::table('dimensions')
            ->join('sub_dimensions', 'sub_dimensions.dimension_id', '=', 'dimensions.id')
            ->join('questions', 'questions.sub_dimension_id', '=', 'sub_dimensions.id')
            ->join('answers', 'answers.question_id', '=', 'questions.id')
            ->join('raters', 'raters.id', '=', 'answers.rater_id')
            ->where('raters.participant_id', $participant->id)
            ->whereNotNull('raters.submitted_at')
            ->selectRaw('
                dimensions.id as dimension_id,
                sub_dimensions.id as sub_dimension_id,
                raters.role,
                AVG(answers.value) as avg_score,
                COUNT(answers.id) as answer_count
            ')
            ->groupBy(
                'dimensions.id',
                'sub_dimensions.id',
                'raters.role'
            )
            ->get();

        $subScores = [];
        foreach ($rawScores as $row) {
            $subScores[$row->dimension_id][$row->sub_dimension_id][$row->role] = round((float) $row->avg_score, 2);
        }

        // 3. Susun hirarki dimensi dan sub-dimensi
        $dimensionsList = Dimension::query()
            ->with(['subDimensions' => fn ($q) => $q->withTrashed()->orderBy('sort_order')])
            ->orderBy('sort_order')
            ->get();

        $dimensionsResult = [];
        $roleDimAccumulator = [
            RaterRole::SelfRater->value => [],
            RaterRole::Boss->value => [],
            RaterRole::Subordinate->value => [],
        ];

        foreach ($dimensionsList as $dimension) {
            $dimSubResults = [];
            $dimRoleSubScores = [
                RaterRole::SelfRater->value => [],
                RaterRole::Boss->value => [],
                RaterRole::Subordinate->value => [],
            ];

            foreach ($dimension->subDimensions as $subDim) {
                $subMap = $subScores[$dimension->id][$subDim->id] ?? [];

                $selfScore = $subMap[RaterRole::SelfRater->value] ?? null;
                $bossScore = $subMap[RaterRole::Boss->value] ?? null;
                $subScore = $subMap[RaterRole::Subordinate->value] ?? null;

                $rolesWithScore = array_filter([$selfScore, $bossScore, $subScore], fn ($v) => $v !== null);
                $avgAll = count($rolesWithScore) > 0
                    ? round(array_sum($rolesWithScore) / count($rolesWithScore), 2)
                    : null;

                if ($selfScore !== null) {
                    $dimRoleSubScores[RaterRole::SelfRater->value][] = $selfScore;
                }
                if ($bossScore !== null) {
                    $dimRoleSubScores[RaterRole::Boss->value][] = $bossScore;
                }
                if ($subScore !== null) {
                    $dimRoleSubScores[RaterRole::Subordinate->value][] = $subScore;
                }

                $dimSubResults[] = [
                    'id' => $subDim->id,
                    'name' => $subDim->name,
                    'sort_order' => $subDim->sort_order,
                    'scores' => [
                        'self' => $selfScore,
                        'boss' => $bossScore,
                        'subordinate' => $subScore,
                        'average' => $avgAll,
                    ],
                ];
            }

            // Rata-rata per dimensi untuk masing-masing role
            $dimSelf = count($dimRoleSubScores[RaterRole::SelfRater->value]) > 0
                ? round(array_sum($dimRoleSubScores[RaterRole::SelfRater->value]) / count($dimRoleSubScores[RaterRole::SelfRater->value]), 2)
                : null;
            $dimBoss = count($dimRoleSubScores[RaterRole::Boss->value]) > 0
                ? round(array_sum($dimRoleSubScores[RaterRole::Boss->value]) / count($dimRoleSubScores[RaterRole::Boss->value]), 2)
                : null;
            $dimSub = count($dimRoleSubScores[RaterRole::Subordinate->value]) > 0
                ? round(array_sum($dimRoleSubScores[RaterRole::Subordinate->value]) / count($dimRoleSubScores[RaterRole::Subordinate->value]), 2)
                : null;

            $dimRolesPresent = array_filter([$dimSelf, $dimBoss, $dimSub], fn ($v) => $v !== null);
            $dimAvg = count($dimRolesPresent) > 0
                ? round(array_sum($dimRolesPresent) / count($dimRolesPresent), 2)
                : null;

            if ($dimSelf !== null) {
                $roleDimAccumulator[RaterRole::SelfRater->value][] = $dimSelf;
            }
            if ($dimBoss !== null) {
                $roleDimAccumulator[RaterRole::Boss->value][] = $dimBoss;
            }
            if ($dimSub !== null) {
                $roleDimAccumulator[RaterRole::Subordinate->value][] = $dimSub;
            }

            $dimensionsResult[] = [
                'id' => $dimension->id,
                'name' => $dimension->name,
                'sort_order' => $dimension->sort_order,
                'scores' => [
                    'self' => $dimSelf,
                    'boss' => $dimBoss,
                    'subordinate' => $dimSub,
                    'average' => $dimAvg,
                ],
                'sub_dimensions' => $dimSubResults,
            ];
        }

        // Skor keseluruhan per role (rata-rata skor antar dimensi)
        $roleOverallScores = [
            'self' => count($roleDimAccumulator[RaterRole::SelfRater->value]) > 0
                ? round(array_sum($roleDimAccumulator[RaterRole::SelfRater->value]) / count($roleDimAccumulator[RaterRole::SelfRater->value]), 2)
                : null,
            'boss' => count($roleDimAccumulator[RaterRole::Boss->value]) > 0
                ? round(array_sum($roleDimAccumulator[RaterRole::Boss->value]) / count($roleDimAccumulator[RaterRole::Boss->value]), 2)
                : null,
            'subordinate' => count($roleDimAccumulator[RaterRole::Subordinate->value]) > 0
                ? round(array_sum($roleDimAccumulator[RaterRole::Subordinate->value]) / count($roleDimAccumulator[RaterRole::Subordinate->value]), 2)
                : null,
        ];

        // Overall score: rata-rata antar role yang sudah submit (bobot sama)
        $validRoleScores = array_filter($roleOverallScores, fn ($v) => $v !== null);
        $overallScore = count($validRoleScores) > 0
            ? round(array_sum($validRoleScores) / count($validRoleScores), 2)
            : null;

        return [
            'has_data' => true,
            'participant' => $participantInfo,
            'answered_raters' => $answeredRaters,
            'overall_score' => $overallScore,
            'role_overall_scores' => $roleOverallScores,
            'dimensions' => $dimensionsResult,
        ];
    }

    /**
     * Ambil rincian jawaban per pertanyaan untuk tabel server-side paginated (FR-020).
     */
    public function getDetailedAnswers(User $participant, ?int $dimensionId = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = Question::withTrashed()
            ->join('sub_dimensions', 'sub_dimensions.id', '=', 'questions.sub_dimension_id')
            ->join('dimensions', 'dimensions.id', '=', 'sub_dimensions.dimension_id')
            ->when($dimensionId !== null, fn ($q) => $q->where('dimensions.id', $dimensionId))
            ->select([
                'questions.id',
                'questions.text',
                'questions.sort_order as question_sort',
                'sub_dimensions.id as sub_dimension_id',
                'sub_dimensions.name as sub_dimension_name',
                'dimensions.id as dimension_id',
                'dimensions.name as dimension_name',
            ])
            ->orderBy('dimensions.sort_order')
            ->orderBy('sub_dimensions.sort_order')
            ->orderBy('questions.sort_order');

        $paginator = $query->paginate($perPage)->withQueryString();

        $questionIds = $paginator->getCollection()->pluck('id');

        if ($questionIds->isEmpty()) {
            return $paginator;
        }

        // Ambil nilai jawaban untuk pertanyaan di halaman ini dari rater yang sudah submit
        $answers = DB::table('answers')
            ->join('raters', 'raters.id', '=', 'answers.rater_id')
            ->where('raters.participant_id', $participant->id)
            ->whereNotNull('raters.submitted_at')
            ->whereIn('answers.question_id', $questionIds)
            ->selectRaw('answers.question_id, raters.role, AVG(answers.value) as avg_val')
            ->groupBy('answers.question_id', 'raters.role')
            ->get();

        $answerMap = [];
        foreach ($answers as $ans) {
            $answerMap[$ans->question_id][$ans->role] = round((float) $ans->avg_val, 2);
        }

        $transformed = $paginator->getCollection()->map(function ($q) use ($answerMap) {
            $qScores = $answerMap[$q->id] ?? [];
            $selfScore = $qScores[RaterRole::SelfRater->value] ?? null;
            $bossScore = $qScores[RaterRole::Boss->value] ?? null;
            $subScore = $qScores[RaterRole::Subordinate->value] ?? null;

            $validScores = array_filter([$selfScore, $bossScore, $subScore], fn ($v) => $v !== null);
            $average = count($validScores) > 0 ? round(array_sum($validScores) / count($validScores), 2) : null;

            return [
                'id' => $q->id,
                'text' => $q->text,
                'dimension_id' => $q->dimension_id,
                'dimension_name' => $q->dimension_name,
                'sub_dimension_id' => $q->sub_dimension_id,
                'sub_dimension_name' => $q->sub_dimension_name,
                'self_score' => $selfScore,
                'boss_score' => $bossScore,
                'subordinate_score' => $subScore,
                'average' => $average,
            ];
        });

        $paginator->setCollection($transformed);

        return $paginator;
    }
}
