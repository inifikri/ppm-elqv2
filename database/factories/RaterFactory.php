<?php

namespace Database\Factories;

use App\Enums\RaterRole;
use App\Models\Rater;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Default: bawahan beremail. Setiap state menjaga CHECK constraint
 * (self tanpa email; boss/subordinate wajib email).
 *
 * @extends Factory<Rater>
 */
class RaterFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'participant_id' => User::factory()->participant(),
            'role' => RaterRole::Subordinate,
            'email' => fake()->unique()->safeEmail(),
            'submitted_at' => null,
        ];
    }

    public function selfRater(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => RaterRole::SelfRater,
            'email' => null,
        ]);
    }

    public function boss(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => RaterRole::Boss,
            'email' => fake()->unique()->safeEmail(),
        ]);
    }

    public function subordinate(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => RaterRole::Subordinate,
            'email' => fake()->unique()->safeEmail(),
        ]);
    }

    public function submitted(): static
    {
        return $this->state(fn (array $attributes) => [
            'submitted_at' => now(),
        ]);
    }
}
