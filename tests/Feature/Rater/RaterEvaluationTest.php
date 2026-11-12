<?php

namespace Tests\Feature\Rater;

use App\Http\Controllers\Rater\RaterEvaluationController;
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

it('dapat mengakses kuesioner dengan toleransi spasi atau encoding pada ulid', function () {
    $encodedUlid = '%20'.$this->bossRater->ulid.'%20';
    $response = $this->get('/rater/'.$encodedUlid);

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('evaluator/assessment')
        ->where('rater.ulid', $this->bossRater->ulid)
    );
});

it('dapat membuka mode simulasi pratinjau kuesioner menggunakan reserved preview ulid', function () {
    $previewUlid = RaterEvaluationController::PREVIEW_ULID_BOSS;
    $response = $this->get(route('rater.evaluation', ['ulid' => $previewUlid]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('evaluator/assessment')
        ->where('isPreview', true)
        ->where('rater.role', 'boss')
    );
});

it('dapat melakukan autosave simulasi dan submit pada mode pratinjau', function () {
    $previewUlid = RaterEvaluationController::PREVIEW_ULID_BOSS;

    $saveResponse = $this->postJson(route('rater.answers.save', ['ulid' => $previewUlid]), [
        'question_id' => 1,
        'value' => 5,
    ]);

    $saveResponse->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'question_id' => 1,
                'value' => 5,
            ],
        ]);

    $submitResponse = $this->post(route('rater.submit', ['ulid' => $previewUlid]));
    $submitResponse->assertRedirect(route('rater.evaluation', ['ulid' => $previewUlid, 'preview_completed' => 1]));
});
