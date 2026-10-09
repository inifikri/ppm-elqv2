<?php

namespace Database\Factories;

use App\Models\Answer;
use App\Models\Question;
use App\Models\Rater;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Answer>
 */
class AnswerFactory extends Factory
{
    public const MIN_VALUE = 1;

    public const MAX_VALUE = 6;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'rater_id' => Rater::factory(),
            'question_id' => Question::factory(),
            'value' => fake()->numberBetween(self::MIN_VALUE, self::MAX_VALUE),
        ];
    }
}
