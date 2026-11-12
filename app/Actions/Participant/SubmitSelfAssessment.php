<?php

namespace App\Actions\Participant;

use App\Enums\RaterRole;
use App\Models\Answer;
use App\Models\Question;
use App\Models\Rater;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubmitSelfAssessment
{
    public function handle(User $participant): Rater
    {
        $selfRater = $participant->raters()->firstWhere('role', RaterRole::SelfRater);

        if (! $selfRater) {
            abort(403, 'Rater self belum terdaftar.');
        }

        if ($selfRater->submitted_at !== null) {
            throw ValidationException::withMessages([
                'assessment' => 'Asesmen sudah pernah diserahkan.',
            ]);
        }

        $totalQuestions = Question::query()->count();
        $answeredCount = Answer::query()->where('rater_id', $selfRater->id)->count();

        if ($answeredCount < $totalQuestions) {
            throw ValidationException::withMessages([
                'assessment' => "Semua pertanyaan wajib dijawab ({$answeredCount}/{$totalQuestions} terjawab).",
            ]);
        }

        return DB::transaction(function () use ($selfRater, $participant) {
            $locked = Rater::query()->whereKey($selfRater->id)->lockForUpdate()->first();

            if ($locked->submitted_at !== null) {
                throw ValidationException::withMessages([
                    'assessment' => 'Asesmen sudah pernah diserahkan.',
                ]);
            }

            $locked->update(['submitted_at' => now()]);

            // FR-044: Catat peristiwa saja, tanpa nilai jawaban
            activity('assessment')
                ->causedBy($participant)
                ->performedOn($locked)
                ->log('Menyerahkan self-assessment');

            return $locked;
        });
    }
}
