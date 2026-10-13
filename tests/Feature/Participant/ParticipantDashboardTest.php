<?php

namespace Tests\Feature\Participant;

use App\Models\Rater;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->participant = User::factory()->participant()->create([
        'name' => 'Budi Santoso',
        'email' => 'budi@example.com',
    ]);

    $this->selfRater = Rater::factory()->selfRater()->submitted()->create(['participant_id' => $this->participant->id]);
    $this->bossRater = Rater::factory()->boss()->create(['participant_id' => $this->participant->id, 'email' => 'atasan@example.com']);
    $this->subRaters = Rater::factory()->subordinate()->count(3)->create(['participant_id' => $this->participant->id]);
});

it('menampilkan status evaluasi pada dashboard peserta tanpa mengekspos skor atau hasil (FR-039)', function () {
    $response = $this->actingAs($this->participant)->get(route('participant.dashboard'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('participant/dashboard')
            ->where('participant.name', 'Budi Santoso')
            ->where('participant.email', 'budi@example.com')
            ->where('self_assessment.is_submitted', true)
            ->where('evaluators.total_invited', 4)
            ->where('evaluators.boss.email', 'atasan@example.com')
            ->has('evaluators.subordinates', 3)
            // STRICT FR-039: Tidak boleh ada skor atau hasil kalkulasi
            ->missing('scores')
            ->missing('overall_score')
            ->missing('dimensions')
            ->missing('results')
        );
});
