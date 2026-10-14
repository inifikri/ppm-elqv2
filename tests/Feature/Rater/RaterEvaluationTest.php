<?php

namespace Tests\Feature\Rater;

use App\Models\Answer;
use App\Models\Question;
use App\Models\Rater;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->participant = User::factory()->participant()->create([
        'name' => 'Budi Santoso',
    ]);
    $this->bossRater = Rater::factory()->boss()->create([
        'participant_id' => $this->participant->id,
        'email' => 'atasan@example.com',
    ]);
    $this->questions = Question::factory()->count(39)->create();
});

it('penilai dapat langsung mengakses kuesioner tanpa login via tautan ulid', function () {
    $response = $this->get(route('rater.evaluation', ['ulid' => $this->bossRater->ulid]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('evaluator/assessment')
        ->has('questions', 39)
        ->where('rater.ulid', $this->bossRater->ulid)
        ->where('participant.name', 'Budi Santoso')
    );
});

it('mengembalikan halaman 404 link-unavailable jika ulid tidak ditemukan', function () {
    $response = $this->get(route('rater.evaluation', ['ulid' => '01nonexistentulid000000000']));

    $response->assertStatus(404);
    $response->assertViewIs('errors.link-unavailable');
});

it('menampilkan halaman selesai jika penilai sudah pernah mengirimkan asesmen', function () {
    $this->bossRater->update(['submitted_at' => now()]);

    $response = $this->get(route('rater.evaluation', ['ulid' => $this->bossRater->ulid]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('evaluator/completed')
        ->where('rater.ulid', $this->bossRater->ulid)
        ->where('participant.name', 'Budi Santoso')
    );
});

it('penilai dapat menyimpan jawaban autosave tanpa login', function () {
    $question = $this->questions->first();

    $response = $this->postJson(route('rater.answers.save', ['ulid' => $this->bossRater->ulid]), [
        'question_id' => $question->id,
        'value' => 5,
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'question_id' => $question->id,
                'value' => 5,
            ],
        ]);

    $this->assertDatabaseHas('answers', [
        'rater_id' => $this->bossRater->id,
        'question_id' => $question->id,
        'value' => 5,
    ]);
});

it('menolak autosave jika asesmen penilai sudah pernah diserahkan', function () {
    $this->bossRater->update(['submitted_at' => now()]);
    $question = $this->questions->first();

    $response = $this->postJson(route('rater.answers.save', ['ulid' => $this->bossRater->ulid]), [
        'question_id' => $question->id,
        'value' => 5,
    ]);

    $response->assertStatus(422);
});

it('menolak submit jika pertanyaan belum seluruhnya dijawab', function () {
    // Hanya jawab 38 pertanyaan
    foreach ($this->questions->take(38) as $q) {
        Answer::create([
            'rater_id' => $this->bossRater->id,
            'question_id' => $q->id,
            'value' => 4,
        ]);
    }

    $response = $this->post(route('rater.submit', ['ulid' => $this->bossRater->ulid]));

    $response->assertSessionHasErrors('assessment');
    expect($this->bossRater->fresh()->submitted_at)->toBeNull();
});

it('berhasil submit saat seluruh 39 pertanyaan telah dijawab', function () {
    foreach ($this->questions as $q) {
        Answer::create([
            'rater_id' => $this->bossRater->id,
            'question_id' => $q->id,
            'value' => 5,
        ]);
    }

    $response = $this->post(route('rater.submit', ['ulid' => $this->bossRater->ulid]));

    $response->assertRedirect(route('rater.evaluation', ['ulid' => $this->bossRater->ulid]));
    expect($this->bossRater->fresh()->submitted_at)->not->toBeNull();
});
