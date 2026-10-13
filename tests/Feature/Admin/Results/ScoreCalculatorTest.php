<?php

namespace Tests\Feature\Admin\Results;

use App\Models\Answer;
use App\Models\Dimension;
use App\Models\Question;
use App\Models\Rater;
use App\Models\SubDimension;
use App\Models\User;
use App\Services\Scoring\ScoreCalculator;
use Database\Seeders\RolePermissionSeeder;

beforeEach(fn () => $this->seed(RolePermissionSeeder::class));

it('score calculator: tanpa data submit mengembalikan has_data false', function () {
    $participant = User::factory()->participant()->create();

    // Rater belum submit
    Rater::factory()->selfRater()->create([
        'participant_id' => $participant->id,
        'submitted_at' => null,
    ]);

    $calculator = app(ScoreCalculator::class);
    $result = $calculator->calculate($participant);

    expect($result['has_data'])->toBeFalse()
        ->and($result['overall_score'])->toBeNull()
        ->and($result['role_overall_scores']['self'])->toBeNull()
        ->and($result['answered_raters']['total_submitted'])->toBe(0)
        ->and($result['dimensions'])->toBeEmpty();
});

it('score calculator: rater belum submit diabaikan dalam penghitungan', function () {
    $participant = User::factory()->participant()->create();

    $dimension = Dimension::factory()->create(['name' => 'Dimensi 1', 'sort_order' => 1]);
    $subDim = SubDimension::factory()->create(['dimension_id' => $dimension->id, 'name' => 'Sub 1', 'sort_order' => 1]);
    $q1 = Question::factory()->create(['sub_dimension_id' => $subDim->id, 'sort_order' => 1]);

    // Self: sudah submit dengan nilai 5
    $selfRater = Rater::factory()->selfRater()->submitted()->create(['participant_id' => $participant->id]);
    Answer::factory()->create(['rater_id' => $selfRater->id, 'question_id' => $q1->id, 'value' => 5]);

    // Boss: belum submit, nilai 2 di database
    $bossRater = Rater::factory()->boss()->create(['participant_id' => $participant->id, 'submitted_at' => null]);
    Answer::factory()->create(['rater_id' => $bossRater->id, 'question_id' => $q1->id, 'value' => 2]);

    $calculator = app(ScoreCalculator::class);
    $result = $calculator->calculate($participant);

    expect($result['has_data'])->toBeTrue()
        ->and($result['answered_raters']['self']['submitted'])->toBe(1)
        ->and($result['answered_raters']['boss']['submitted'])->toBe(0)
        ->and($result['role_overall_scores']['self'])->toBe(5.0)
        ->and($result['role_overall_scores']['boss'])->toBeNull()
        ->and($result['overall_score'])->toBe(5.0); // Hanya self yang terhitung
});

it('score calculator: rata-rata bawahan 1 sampai 3 submit terhitung tepat', function () {
    $participant = User::factory()->participant()->create();

    $dim = Dimension::factory()->create(['name' => 'Kepemimpinan', 'sort_order' => 1]);
    $sub = SubDimension::factory()->create(['dimension_id' => $dim->id, 'name' => 'Komunikasi', 'sort_order' => 1]);
    $q1 = Question::factory()->create(['sub_dimension_id' => $sub->id, 'sort_order' => 1]);
    $q2 = Question::factory()->create(['sub_dimension_id' => $sub->id, 'sort_order' => 2]);

    // Bawahan 1 submit: Q1 = 4, Q2 = 4 (avg = 4.0)
    $sub1 = Rater::factory()->subordinate()->submitted()->create(['participant_id' => $participant->id]);
    Answer::factory()->create(['rater_id' => $sub1->id, 'question_id' => $q1->id, 'value' => 4]);
    Answer::factory()->create(['rater_id' => $sub1->id, 'question_id' => $q2->id, 'value' => 4]);

    // Bawahan 2 submit: Q1 = 6, Q2 = 6 (avg = 6.0)
    $sub2 = Rater::factory()->subordinate()->submitted()->create(['participant_id' => $participant->id]);
    Answer::factory()->create(['rater_id' => $sub2->id, 'question_id' => $q1->id, 'value' => 6]);
    Answer::factory()->create(['rater_id' => $sub2->id, 'question_id' => $q2->id, 'value' => 6]);

    // Bawahan 3 pending (belum submit)
    Rater::factory()->subordinate()->create(['participant_id' => $participant->id, 'submitted_at' => null]);

    $calculator = app(ScoreCalculator::class);
    $result = $calculator->calculate($participant);

    expect($result['answered_raters']['subordinate']['submitted'])->toBe(2)
        ->and($result['answered_raters']['subordinate']['total'])->toBe(3)
        ->and($result['role_overall_scores']['subordinate'])->toBe(5.0); // (4 + 6) / 2 = 5.0
});

it('score calculator: pertanyaan soft-deleted tetap dihitung untuk jawaban historis', function () {
    $participant = User::factory()->participant()->create();

    $dim = Dimension::factory()->create(['name' => 'Dimensi X', 'sort_order' => 1]);
    $sub = SubDimension::factory()->create(['dimension_id' => $dim->id, 'name' => 'Sub X', 'sort_order' => 1]);
    $q = Question::factory()->create(['sub_dimension_id' => $sub->id, 'sort_order' => 1]);

    $selfRater = Rater::factory()->selfRater()->submitted()->create(['participant_id' => $participant->id]);
    Answer::factory()->create(['rater_id' => $selfRater->id, 'question_id' => $q->id, 'value' => 6]);

    // Soft delete pertanyaan
    $q->delete();
    expect(Question::find($q->id))->toBeNull();
    expect(Question::withTrashed()->find($q->id))->not->toBeNull();

    $calculator = app(ScoreCalculator::class);
    $result = $calculator->calculate($participant);

    expect($result['has_data'])->toBeTrue()
        ->and($result['role_overall_scores']['self'])->toBe(6.0);
});
