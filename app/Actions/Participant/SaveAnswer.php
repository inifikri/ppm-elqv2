<?php

namespace App\Actions\Participant;

use App\Enums\RaterRole;
use App\Models\Answer;
use App\Models\Question;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class SaveAnswer
{
    /**
     * @param  array{question_id: int, value: int}  $data
     * @return array{question_id: int, value: int, saved_at: string}
     */
    public function handle(User $participant, array $data): array
    {
        $selfRater = $participant->raters()->firstWhere('role', RaterRole::SelfRater);

        if (! $selfRater) {
            abort(403, 'Rater self belum terdaftar.');
        }

        if ($selfRater->submitted_at !== null) {
            abort(422, 'Asesmen sudah diserahkan dan tidak dapat diubah.');
        }

        $questionId = (int) $data['question_id'];
        $value = (int) $data['value'];

        if ($value < 1 || $value > 6) {
            throw ValidationException::withMessages([
                'value' => 'Nilai jawaban harus antara 1 sampai 6.',
            ]);
        }

        $questionExists = Question::query()->whereKey($questionId)->exists();
        if (! $questionExists) {
            throw ValidationException::withMessages([
                'question_id' => 'Pertanyaan tidak valid.',
            ]);
        }

        Answer::updateOrCreate(
            [
                'rater_id' => $selfRater->id,
                'question_id' => $questionId,
            ],
            [
                'value' => $value,
            ]
        );

        return [
            'question_id' => $questionId,
            'value' => $value,
            'saved_at' => now()->toIso8601String(),
        ];
    }
}
