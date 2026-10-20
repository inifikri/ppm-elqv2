<?php

namespace Tests\Unit\Services\Reports;

use App\Services\Reports\BarChartSvgRenderer;

beforeEach(function () {
    $this->renderer = new BarChartSvgRenderer;
});

test('BarChartSvgRenderer: renderVerticalGroupedBarSvg menghasilkan markup SVG valid dengan data lengkap & parsial', function () {
    $data = [
        [
            'label' => 'Task Oriented',
            'scores' => [
                'average' => 5.25,
                'self' => 5.0,
                'boss' => 5.5,
                'subordinate' => 5.25,
            ],
        ],
        [
            'label' => 'People Oriented',
            'scores' => [
                'average' => 4.8,
                'self' => 4.5,
                'boss' => null, // Boss belum isi
                'subordinate' => 5.1,
            ],
        ],
    ];

    $svg = $this->renderer->renderVerticalGroupedBarSvg($data);

    expect($svg)->toBeString()
        ->and($svg)->toStartWith('<svg')
        ->and($svg)->toEndWith('</svg>')
        ->and($svg)->toContain('Task Oriented')
        ->and($svg)->toContain('People Oriented')
        ->and($svg)->toContain('5.25')
        ->and($svg)->toContain('5.50')
        ->and($svg)->toContain('4.80')
        ->and($svg)->toContain('Rata-rata')
        ->and($svg)->toContain('Diri Sendiri')
        ->and($svg)->toContain('Atasan')
        ->and($svg)->toContain('Bawahan');
});

test('BarChartSvgRenderer: renderHorizontalGroupedBarSvg membungkus teks panjang dan menangani nilai null', function () {
    $data = [
        [
            'label' => 'Pengembangan Diri dan Pembelajaran Berkelanjutan Organisasi',
            'scores' => [
                'average' => 4.75,
                'self' => 4.0,
                'boss' => null,
                'subordinate' => 5.5,
            ],
        ],
    ];

    $svg = $this->renderer->renderHorizontalGroupedBarSvg($data);

    expect($svg)->toBeString()
        ->and($svg)->toStartWith('<svg')
        ->and($svg)->toEndWith('</svg>')
        ->and($svg)->toContain('Pengembangan Diri')
        ->and($svg)->toContain('4.75')
        ->and($svg)->toContain('5.50')
        ->and($svg)->toContain('>');
});

test('BarChartSvgRenderer: render array kosong menghasilkan placeholder SVG yang aman', function () {
    $vertical = $this->renderer->renderVerticalGroupedBarSvg([]);
    $horizontal = $this->renderer->renderHorizontalGroupedBarSvg([]);

    expect($vertical)->toContain('Belum ada data')
        ->and($horizontal)->toContain('Belum ada data');
});

test('BarChartSvgRenderer: toBase64DataUri menghasilkan format data image svg yang benar', function () {
    $svg = '<svg><text>Test</text></svg>';
    $uri = $this->renderer->toBase64DataUri($svg);

    expect($uri)->toStartWith('data:image/svg+xml;base64,')
        ->and(base64_decode(str_replace('data:image/svg+xml;base64,', '', $uri)))->toBe($svg);
});
