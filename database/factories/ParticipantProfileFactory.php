<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\ParticipantProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ParticipantProfile>
 */
class ParticipantProfileFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->participant(),
            'company_id' => Company::factory(),
            'position' => fake()->jobTitle(),
        ];
    }
}
