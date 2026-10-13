<?php

namespace Tests\Feature\Participant;

use App\Models\Answer;
use App\Models\Question;
use App\Models\Rater;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Spatie\Activitylog\Models\Activity;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->participant = User::factory()->participant()->create();
    $this->selfRater = Rater::factory()->selfRater()->create(['participant_id' => $this->participant->id]);
    $this->bossRater = Rater::factory()->boss()->create(['participant_id' => $this->participant->id]);
    $this->subRaters = Rater::factory()->subordinate()->count(3)->create(['participant_id' => $this->participant->id]);

    // Buat 39 pertanyaan untuk kuesioner
    $this->questions = Question::factory()->count(39)->create();
});

it('menolak submit jika jawaban kurang dari 39 butir', function () {
    // Isi 38 pertanyaan saja (kurang 1)
    foreach ($this->questions->take(38) as $q) {
        Answer::create([
            'rater_id' => $this->selfRater->id,
            'question_id' => $q->id,
            'value' => 5,
        ]);
    }

    $response = $this->actingAs($this->participant)
        ->post(route('participant.assessment.submit'));

    $response->assertSessionHasErrors('assessment');
    expect($this->selfRater->fresh()->submitted_at)->toBeNull();
});

it('berhasil submit saat seluruh 39 pertanyaan terjawab dan mencatat audit log non-sensitif (FR-044)', function () {
    // Isi ke-39 pertanyaan
    foreach ($this->questions as $q) {
        Answer::create([
            'rater_id' => $this->selfRater->id,
            'question_id' => $q->id,
            'value' => fake()->numberBetween(1, 6),
        ]);
    }

    $response = $this->actingAs($this->participant)
        ->post(route('participant.assessment.submit'));

    $response->assertRedirect(route('dashboard'));

    // Pastikan submitted_at terisi
    expect($this->selfRater->fresh()->submitted_at)->not->toBeNull();

    // Verifikasi activity log non-sensitif (FR-044: tanpa nilai jawaban atau token)
    $activity = Activity::where('log_name', 'assessment')
        ->where('subject_id', $this->selfRater->id)
        ->latest('id')
        ->first();

    expect($activity)->not->toBeNull();
    expect($activity->description)->toBe('Menyerahkan self-assessment');
    // Memastikan properties tidak menyimpan array jawaban atau skor
    expect($activity->properties->has('answers'))->toBeFalse();
    expect($activity->properties->has('scores'))->toBeFalse();
});

it('menolak submit ganda jika self rater sudah pernah diserahkan', function () {
    $this->selfRater->update(['submitted_at' => now()]);

    $response = $this->actingAs($this->participant)
        ->post(route('participant.assessment.submit'));

    $response->assertSessionHasErrors('assessment');
});
