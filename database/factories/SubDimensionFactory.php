<?php

namespace Database\Factories;

use App\Models\Dimension;
use App\Models\SubDimension;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SubDimension>
 */
class SubDimensionFactory extends Factory
{
    /**
     * Nama PLACEHOLDER dev/test, bukan konten asli kuesioner.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'dimension_id' => Dimension::factory(),
            'name' => 'Sub-dimensi '.fake()->unique()->words(2, true),
            'sort_order' => fake()->numberBetween(1, 10),
        ];
    }
}
