<?php

namespace Tests\Unit\Enums;

use App\Enums\EffectivenessCategory;

test('EffectivenessCategory: null mengembalikan null', function () {
    expect(EffectivenessCategory::fromScore(null))->toBeNull();
});

test('EffectivenessCategory: boundary values dan pembulatan 1 desimal', function (float $score, EffectivenessCategory $expected) {
    expect(EffectivenessCategory::fromScore($score))->toBe($expected);
})->with([
    'skor 6.0' => [6.0, EffectivenessCategory::HighlyEffective],
    'skor 5.7 batas bawah highly' => [5.7, EffectivenessCategory::HighlyEffective],
    'skor 5.65 dibulatkan ke 5.7' => [5.65, EffectivenessCategory::HighlyEffective],
    'skor 5.6 batas atas effective' => [5.6, EffectivenessCategory::Effective],
    'skor 4.5 batas bawah effective' => [4.5, EffectivenessCategory::Effective],
    'skor 4.45 dibulatkan ke 4.5' => [4.45, EffectivenessCategory::Effective],
    'skor 4.4 batas atas moderate' => [4.4, EffectivenessCategory::ModerateEffective],
    'skor 3.6 batas bawah moderate' => [3.6, EffectivenessCategory::ModerateEffective],
    'skor 3.55 dibulatkan ke 3.6' => [3.55, EffectivenessCategory::ModerateEffective],
    'skor 3.5 batas atas least' => [3.5, EffectivenessCategory::LeastEffective],
    'skor 1.0 skor terendah' => [1.0, EffectivenessCategory::LeastEffective],
]);

test('EffectivenessCategory: metadata label, color, description tersedia', function () {
    foreach (EffectivenessCategory::cases() as $category) {
        expect($category->label())->toBeString()->not->toBeEmpty()
            ->and($category->scoreRange())->toBeString()->not->toBeEmpty()
            ->and($category->hexColor())->toStartWith('#')
            ->and($category->bgHexColor())->toStartWith('#')
            ->and($category->description())->toBeString()->not->toBeEmpty();
    }
});
