<?php

namespace Tests\Feature\Participant;

use App\Models\Answer;
use App\Models\Question;
use App\Models\Rater;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->participant = User::factory()->participant()->create();
    $this->selfRater = Rater::factory()->selfRater()->create(['participant_id' => $this->participant->id]);
    $this->question = Question::factory()->create();
});

it('berhasil menyimpan jawaban autosave skala 1 sampai 6', function () {
    $response = $this->actingAs($this->participant)
        ->postJson(route('participant.assessment.answers.save'), [
            'question_id' => $this->question->id,
            'value' => 5,
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'question_id' => $this->question->id,
                'value' => 5,
            ],
        ]);

    $this->assertDatabaseHas('answers', [
        'rater_id' => $this->selfRater->id,
        'question_id' => $this->question->id,
        'value' => 5,
    ]);
});

it('mengubah jawaban jika pertanyaan yang sama disimpan kembali (upsert)', function () {
    // Simpan nilai 2
    $this->actingAs($this->participant)
        ->postJson(route('participant.assessment.answers.save'), [
            'question_id' => $this->question->id,
            'value' => 2,
        ])->assertOk();

    // Ubah ke nilai 6
    $this->actingAs($this->participant)
        ->postJson(route('participant.assessment.answers.save'), [
            'question_id' => $this->question->id,
            'value' => 6,
        ])->assertOk();

    expect(Answer::where('rater_id', $this->selfRater->id)->count())->toBe(1);
    $this->assertDatabaseHas('answers', [
        'rater_id' => $this->selfRater->id,
        'question_id' => $this->question->id,
        'value' => 6,
    ]);
});

it('validasi menolak nilai jawaban di luar 1 sampai 6', function () {
    $this->actingAs($this->participant)
        ->postJson(route('participant.assessment.answers.save'), [
            'question_id' => $this->question->id,
            'value' => 0,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('value');

    $this->actingAs($this->participant)
        ->postJson(route('participant.assessment.answers.save'), [
            'question_id' => $this->question->id,
            'value' => 7,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('value');
});

it('validasi menolak question_id yang tidak ada di database', function () {
    $this->actingAs($this->participant)
        ->postJson(route('participant.assessment.answers.save'), [
            'question_id' => 999999,
            'value' => 4,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('question_id');
});

it('menolak simpan jawaban jika self rater sudah disubmit', function () {
    $this->selfRater->update(['submitted_at' => now()]);

    $this->actingAs($this->participant)
        ->postJson(route('participant.assessment.answers.save'), [
            'question_id' => $this->question->id,
            'value' => 4,
        ])
        ->assertStatus(422);
});
