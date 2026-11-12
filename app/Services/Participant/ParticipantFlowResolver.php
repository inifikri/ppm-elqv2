<?php

namespace App\Services\Participant;

use App\Enums\RaterRole;
use App\Models\Question;
use App\Models\Rater;
use App\Models\User;
use Illuminate\Support\Collection;

class ParticipantFlowResolver
{
    public const STATE_SETUP_EVALUATORS = 'setup_evaluators';

    public const STATE_ASSESSMENT_RUN = 'assessment_run';

    public const STATE_COMPLETED = 'completed';

    /**
     * Tentukan state alur peserta saat ini.
     *
     * @return array{
     *     state: string,
     *     self_rater: Rater|null,
     *     boss_rater: Rater|null,
     *     subordinate_raters: Collection<int, Rater>,
     *     answered_count: int,
     *     total_questions: int,
     *     first_unanswered_index: int,
     *     is_all_answered: bool
     * }
     */
    public function resolve(User $participant): array
    {
        $raters = $participant->raters()->with(['answers'])->get();

        $selfRater = $raters->firstWhere('role', RaterRole::SelfRater);
        $bossRater = $raters->firstWhere('role', RaterRole::Boss);
        $subordinateRaters = $raters->where('role', RaterRole::Subordinate)->values();

        $hasCompleteRaters = $selfRater !== null
            && $bossRater !== null
            && $subordinateRaters->count() === 3;

        // State 1: Belum ada rater lengkap (1 self, 1 atasan, 3 bawahan)
        if (! $hasCompleteRaters) {
            return [
                'state' => self::STATE_SETUP_EVALUATORS,
                'self_rater' => $selfRater,
                'boss_rater' => $bossRater,
                'subordinate_raters' => $subordinateRaters,
                'answered_count' => 0,
                'total_questions' => 0,
                'first_unanswered_index' => 1,
                'is_all_answered' => false,
            ];
        }

        // State 3: Self sudah submit
        if ($selfRater->submitted_at !== null) {
            $totalQuestions = Question::query()->count();

            return [
                'state' => self::STATE_COMPLETED,
                'self_rater' => $selfRater,
                'boss_rater' => $bossRater,
                'subordinate_raters' => $subordinateRaters,
                'answered_count' => $totalQuestions,
                'total_questions' => $totalQuestions,
                'first_unanswered_index' => max(1, $totalQuestions),
                'is_all_answered' => true,
            ];
        }

        // State 2: Rater lengkap, self belum submit
        $questions = Question::query()->orderBy('sort_order')->orderBy('id')->get();
        $totalQuestions = $questions->count();
        $answeredQuestionIds = $selfRater->answers->pluck('question_id')->all();
        $answeredCount = count($answeredQuestionIds);

        // Cari 1-based index pertanyaan pertama yang belum dijawab
        $firstUnansweredIndex = 1;
        foreach ($questions as $index => $q) {
            if (! in_array($q->id, $answeredQuestionIds, true)) {
                $firstUnansweredIndex = $index + 1;
                break;
            }
        }

        if ($answeredCount >= $totalQuestions && $totalQuestions > 0) {
            $firstUnansweredIndex = $totalQuestions;
        }

        return [
            'state' => self::STATE_ASSESSMENT_RUN,
            'self_rater' => $selfRater,
            'boss_rater' => $bossRater,
            'subordinate_raters' => $subordinateRaters,
            'answered_count' => $answeredCount,
            'total_questions' => $totalQuestions,
            'first_unanswered_index' => $firstUnansweredIndex,
            'is_all_answered' => $answeredCount >= $totalQuestions && $totalQuestions > 0,
        ];
    }
}
