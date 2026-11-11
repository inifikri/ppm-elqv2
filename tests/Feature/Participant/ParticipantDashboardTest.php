<?php

namespace Tests\Feature\Participant;

use App\Models\Answer;
use App\Models\Dimension;
use App\Models\Question;
use App\Models\Rater;
use App\Models\SubDimension;
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

it('menampilkan dashboard peserta beserta hasil kalkulasi assessment teragregasi tanpa detail butir jawaban', function () {
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
            // Hasil kalkulasi agregat disertakan
            ->has('result')
            ->where('result.participant.id', $this->participant->id)
            // STRICT PRIVACY: Tidak boleh ada detail jawaban butir per butir soal
            ->missing('result.detailed_answers')
            ->missing('result.details')
            ->missing('detailed_answers')
        );
});

it('peserta dapat mengunduh laporan PDF hasil assessment ketika data tersedia', function () {
    $dimension = Dimension::factory()->create(['name' => 'Task Oriented']);
    $subDimension = SubDimension::factory()->create(['dimension_id' => $dimension->id, 'name' => 'Planning']);
    $question = Question::factory()->create(['sub_dimension_id' => $subDimension->id]);

    Answer::factory()->create([
        'rater_id' => $this->selfRater->id,
        'question_id' => $question->id,
        'value' => 5,
    ]);

    $response = $this->actingAs($this->participant)->get(route('participant.result.pdf'));

    $response->assertOk();
    expect($response->headers->get('content-type'))->toBe('application/pdf');
    expect($response->headers->get('content-disposition'))->toContain('attachment');
});

it('tamu diarahkan ke login saat mengakses dashboard dan download PDF peserta', function () {
    $this->get(route('participant.dashboard'))->assertRedirect('/login');
    $this->get(route('participant.result.pdf'))->assertRedirect('/login');
});
