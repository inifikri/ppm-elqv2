<?php

namespace Database\Factories;

use App\Models\Question;
use App\Models\SubDimension;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Question>
 */
class QuestionFactory extends Factory
{
    /**
     * Teks PLACEHOLDER palsu khusus dev/test, BUKAN konten asli kuesioner ELQ.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sub_dimension_id' => SubDimension::factory(),
            'text' => '[PLACEHOLDER] '.fake()->unique()->sentence(8),
            'sort_order' => fake()->numberBetween(1, 50),
        ];
    }
}
