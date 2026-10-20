<?php

namespace Tests\Feature\Admin\Results;

use App\Enums\EffectivenessCategory;
use App\Models\Answer;
use App\Models\Dimension;
use App\Models\Question;
use App\Models\Rater;
use App\Models\SubDimension;
use App\Models\User;
use App\Services\Reports\AssessmentReportBuilder;
use Database\Seeders\RolePermissionSeeder;

beforeEach(fn () => $this->seed(RolePermissionSeeder::class));

test('AssessmentReportBuilder: peserta tanpa rater submitted menghasilkan hasData false', function () {
    $participant = User::factory()->participant()->create();
    Rater::factory()->selfRater()->create(['participant_id' => $participant->id, 'submitted_at' => null]);

    $builder = app(AssessmentReportBuilder::class);
    $dto = $builder->build($participant);

    expect($dto->hasData)->toBeFalse()
        ->and($dto->overallScore)->toBeNull()
        ->and($dto->overallCategory)->toBeNull()
        ->and($dto->dimensions)->toBeEmpty();
});

test('AssessmentReportBuilder: menyusun hierarki DTO lengkap, kategori efektivitas, dan penomoran pertanyaan', function () {
    $participant = User::factory()->participant()->create(['name' => 'Budi Pratama', 'phone' => '08123456789']);

    $dim1 = Dimension::factory()->create(['name' => 'Task Oriented', 'sort_order' => 1]);
    $sub1 = SubDimension::factory()->create(['dimension_id' => $dim1->id, 'name' => 'Perencanaan', 'sort_order' => 1]);
    $q1 = Question::factory()->create(['sub_dimension_id' => $sub1->id, 'text' => 'Pertanyaan 1', 'sort_order' => 1]);
    $q2 = Question::factory()->create(['sub_dimension_id' => $sub1->id, 'text' => 'Pertanyaan 2', 'sort_order' => 2]);

    $self = Rater::factory()->selfRater()->submitted()->create(['participant_id' => $participant->id]);
    Answer::factory()->create(['rater_id' => $self->id, 'question_id' => $q1->id, 'value' => 6]);
    Answer::factory()->create(['rater_id' => $self->id, 'question_id' => $q2->id, 'value' => 6]);

    $boss = Rater::factory()->boss()->submitted()->create(['participant_id' => $participant->id]);
    Answer::factory()->create(['rater_id' => $boss->id, 'question_id' => $q1->id, 'value' => 5]);
    Answer::factory()->create(['rater_id' => $boss->id, 'question_id' => $q2->id, 'value' => 5]);

    $builder = app(AssessmentReportBuilder::class);
    $dto = $builder->build($participant);

    expect($dto->hasData)->toBeTrue()
        ->and($dto->participant['name'])->toBe('Budi Pratama')
        ->and($dto->participant['phone'])->toBe('08123456789')
        ->and($dto->overallScore)->toBe(5.5) // (6 + 5) / 2 = 5.5
        ->and($dto->overallCategory)->toBe(EffectivenessCategory::Effective)
        ->and($dto->dimensions)->toHaveCount(1);

    $dimension = $dto->dimensions[0];
    expect($dimension['name'])->toBe('Task Oriented')
        ->and($dimension['category'])->toBe(EffectivenessCategory::Effective)
        ->and($dimension['sub_dimensions'])->toHaveCount(1);

    $subDim = $dimension['sub_dimensions'][0];
    expect($subDim['name'])->toBe('Perencanaan')
        ->and($subDim['questions'])->toHaveCount(2)
        ->and($subDim['questions'][0]['no'])->toBe(1)
        ->and($subDim['questions'][0]['scores']['self'])->toBe(6.0)
        ->and($subDim['questions'][0]['scores']['boss'])->toBe(5.0)
        ->and($subDim['questions'][0]['scores']['average'])->toBe(5.5)
        ->and($subDim['questions'][1]['no'])->toBe(2);

    // Verifikasi method helper chart items
    $dimChartItems = $dto->getDimensionChartItems();
    expect($dimChartItems)->toHaveCount(1)
        ->and($dimChartItems[0]['label'])->toBe('Task Oriented');

    $subChartItems = $dto->getSubDimensionChartItems($dim1->id);
    expect($subChartItems)->toHaveCount(1)
        ->and($subChartItems[0]['label'])->toBe('Perencanaan');
});
