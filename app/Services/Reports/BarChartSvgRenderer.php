<?php

namespace App\Services\Reports;

class BarChartSvgRenderer
{
    /**
     * Konfigurasi series standar: urutan, label, dan warna palet.
     * Konsisten di seluruh laporan PDF (Asumsi C-2).
     *
     * @var array<string, array{key: string, label: string, color: string}>
     */
    public const SERIES = [
        'average' => [
            'key' => 'average',
            'label' => 'Rata-rata',
            'color' => '#1e40af', // Blue 800
        ],
        'self' => [
            'key' => 'self',
            'label' => 'Diri Sendiri',
            'color' => '#64748b', // Slate 500
        ],
        'boss' => [
            'key' => 'boss',
            'label' => 'Atasan',
            'color' => '#0d9488', // Teal 600
        ],
        'subordinate' => [
            'key' => 'subordinate',
            'label' => 'Bawahan',
            'color' => '#d97706', // Amber 600
        ],
    ];

    /**
     * Render Vertical Grouped Bar Chart (biasanya untuk ringkasan dimensi).
     *
     * @param  list<array{label: string, scores: array{average?: float|null, self?: float|null, boss?: float|null, subordinate?: float|null}}>  $groups
     * @return string Valid SVG markup
     */
    public function renderVerticalGroupedBarSvg(array $groups, int $width = 680, int $height = 260): string
    {
        if (empty($groups)) {
            return $this->renderEmptySvg($width, $height, 'Belum ada data untuk grafik.');
        }

        $marginTop = 36;
        $marginBottom = 50;
        $marginLeft = 40;
        $marginRight = 20;

        $chartWidth = $width - $marginLeft - $marginRight;
        $chartHeight = $height - $marginTop - $marginBottom;

        $groupCount = count($groups);
        $seriesCount = count(self::SERIES);
        $groupSlotWidth = $chartWidth / max(1, $groupCount);

        $barSpacing = 3;
        $groupPadding = max(16, $groupSlotWidth * 0.18);
        $availableForBars = $groupSlotWidth - ($groupPadding * 2) - (($seriesCount - 1) * $barSpacing);
        $barWidth = max(8, min(24, $availableForBars / $seriesCount));

        $svg = [];
        $svg[] = sprintf(
            '<svg width="%d" height="%d" viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" style="font-family: Arial, Helvetica, sans-serif; display: block; margin: 0 auto; background: #ffffff;">',
            $width,
            $height,
            $width,
            $height
        );

        // 1. Legenda di atas grafik
        $svg[] = $this->renderLegendSvg($width, 14);

        // 2. Garis grid dan label sumbu Y (skala 1 s.d. 6)
        for ($val = 1; $val <= 6; $val++) {
            $y = $marginTop + $chartHeight - (($val / 6.0) * $chartHeight);
            $svg[] = sprintf(
                '<line x1="%d" y1="%.1f" x2="%d" y2="%.1f" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2,2" />',
                $marginLeft,
                $y,
                $width - $marginRight,
                $y
            );
            $svg[] = sprintf(
                '<text x="%d" y="%.1f" font-size="9" fill="#94a3b8" text-anchor="end" alignment-baseline="middle">%d</text>',
                $marginLeft - 6,
                $y,
                $val
            );
        }

        // Garis basis sumbu X (skala 0 / dasar grafik)
        $baseY = $marginTop + $chartHeight;
        $svg[] = sprintf(
            '<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="#cbd5e1" stroke-width="1.5" />',
            $marginLeft,
            $baseY,
            $width - $marginRight,
            $baseY
        );

        // 3. Render kelompok bar vertikal
        foreach ($groups as $gIndex => $group) {
            $groupCenterX = $marginLeft + ($gIndex * $groupSlotWidth) + ($groupSlotWidth / 2);
            $totalBarsWidth = ($seriesCount * $barWidth) + (($seriesCount - 1) * $barSpacing);
            $groupStartX = $groupCenterX - ($totalBarsWidth / 2);

            $sIndex = 0;
            foreach (self::SERIES as $seriesKey => $seriesCfg) {
                $score = $group['scores'][$seriesKey] ?? null;
                $barX = $groupStartX + ($sIndex * ($barWidth + $barSpacing));

                if ($score !== null && $score > 0) {
                    $clampedScore = max(0, min(6.0, (float) $score));
                    $barH = ($clampedScore / 6.0) * $chartHeight;
                    $barY = $baseY - $barH;

                    $svg[] = sprintf(
                        '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="2" fill="%s" />',
                        $barX,
                        $barY,
                        $barWidth,
                        $barH,
                        $seriesCfg['color']
                    );

                    // Label angka di atas bar
                    $svg[] = sprintf(
                        '<text x="%.1f" y="%.1f" font-size="8.5" font-weight="bold" fill="#334155" text-anchor="middle">%.2f</text>',
                        $barX + ($barWidth / 2),
                        $barY - 4,
                        $clampedScore
                    );
                } else {
                    // Skor kosong: tampilkan label '-'
                    $svg[] = sprintf(
                        '<text x="%.1f" y="%.1f" font-size="8" fill="#cbd5e1" text-anchor="middle">-</text>',
                        $barX + ($barWidth / 2),
                        $baseY - 4
                    );
                }

                $sIndex++;
            }

            // Label grup di bawah sumbu X (wrap 2 baris jika panjang)
            $labelLines = $this->wrapText($group['label'], 18);
            foreach ($labelLines as $lIdx => $line) {
                $svg[] = sprintf(
                    '<text x="%.1f" y="%.1f" font-size="9.5" font-weight="bold" fill="#1e293b" text-anchor="middle">%s</text>',
                    $groupCenterX,
                    $baseY + 16 + ($lIdx * 12),
                    htmlspecialchars($line, ENT_XML1, 'UTF-8')
                );
            }
        }

        $svg[] = '</svg>';

        return implode("\n", $svg);
    }

    /**
     * Render Horizontal Grouped Bar Chart (sangat cocok untuk Sub-Dimensi dengan label panjang).
     *
     * @param  list<array{label: string, scores: array{average?: float|null, self?: float|null, boss?: float|null, subordinate?: float|null}}>  $items
     * @param  int|null  $height  Bila null, tinggi dihitung dinamis berdasarkan jumlah item
     * @return string Valid SVG markup
     */
    public function renderHorizontalGroupedBarSvg(array $items, int $width = 680, ?int $height = null): string
    {
        if (empty($items)) {
            return $this->renderEmptySvg($width, 160, 'Belum ada data untuk grafik.');
        }

        $itemCount = count($items);
        $seriesCount = count(self::SERIES);

        $barHeight = 11;
        $barGap = 3;
        $itemPadding = 16;
        $groupHeight = ($seriesCount * $barHeight) + (($seriesCount - 1) * $barGap) + $itemPadding;

        $marginTop = 36;
        $marginBottom = 36;
        $labelWidth = 210; // Area teks kiri
        $marginRight = 36; // Area angka kanan

        $calculatedHeight = $height ?? ($marginTop + ($itemCount * $groupHeight) + $marginBottom);
        $chartWidth = $width - $labelWidth - $marginRight;

        $svg = [];
        $svg[] = sprintf(
            '<svg width="%d" height="%d" viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" style="font-family: Arial, Helvetica, sans-serif; display: block; margin: 0 auto; background: #ffffff;">',
            $width,
            $calculatedHeight,
            $width,
            $calculatedHeight
        );

        // 1. Legenda di atas
        $svg[] = $this->renderLegendSvg($width, 14);

        // 2. Garis grid vertikal dan label sumbu X (skala 1 s.d. 6)
        $chartBottom = $marginTop + ($itemCount * $groupHeight);
        for ($val = 1; $val <= 6; $val++) {
            $x = $labelWidth + (($val / 6.0) * $chartWidth);
            $svg[] = sprintf(
                '<line x1="%.1f" y1="%d" x2="%.1f" y2="%.1f" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2,2" />',
                $x,
                $marginTop,
                $x,
                $chartBottom
            );
            $svg[] = sprintf(
                '<text x="%.1f" y="%.1f" font-size="9" fill="#94a3b8" text-anchor="middle">%d</text>',
                $x,
                $chartBottom + 14,
                $val
            );
        }

        // Garis batas vertikal kiri (sumbu Y)
        $svg[] = sprintf(
            '<line x1="%d" y1="%d" x2="%d" y2="%.1f" stroke="#cbd5e1" stroke-width="1.5" />',
            $labelWidth,
            $marginTop,
            $labelWidth,
            $chartBottom
        );

        // 3. Render bar horizontal per sub-dimensi
        foreach ($items as $iIndex => $item) {
            $groupY = $marginTop + ($iIndex * $groupHeight) + ($itemPadding / 2);

            // Label sub-dimensi di sebelah kiri (wrap 2 baris jika panjang)
            $labelLines = $this->wrapText($item['label'], 32);
            $labelYStart = $groupY + (($seriesCount * ($barHeight + $barGap)) / 2) - ((count($labelLines) - 1) * 6);

            foreach ($labelLines as $lIdx => $line) {
                $svg[] = sprintf(
                    '<text x="%d" y="%.1f" font-size="9.5" font-weight="bold" fill="#1e293b" text-anchor="end" alignment-baseline="middle">%s</text>',
                    $labelWidth - 10,
                    $labelYStart + ($lIdx * 12),
                    htmlspecialchars($line, ENT_XML1, 'UTF-8')
                );
            }

            // Bar tiap series
            $sIndex = 0;
            foreach (self::SERIES as $seriesKey => $seriesCfg) {
                $score = $item['scores'][$seriesKey] ?? null;
                $barY = $groupY + ($sIndex * ($barHeight + $barGap));

                if ($score !== null && $score > 0) {
                    $clampedScore = max(0, min(6.0, (float) $score));
                    $barW = ($clampedScore / 6.0) * $chartWidth;

                    $svg[] = sprintf(
                        '<rect x="%d" y="%.1f" width="%.1f" height="%d" rx="2" fill="%s" />',
                        $labelWidth,
                        $barY,
                        $barW,
                        $barHeight,
                        $seriesCfg['color']
                    );

                    // Nilai di kanan bar
                    $svg[] = sprintf(
                        '<text x="%.1f" y="%.1f" font-size="8.5" font-weight="bold" fill="#334155" text-anchor="start" alignment-baseline="middle">%.2f</text>',
                        $labelWidth + $barW + 5,
                        $barY + ($barHeight / 2) + 1,
                        $clampedScore
                    );
                } else {
                    // Nilai kosong
                    $svg[] = sprintf(
                        '<text x="%d" y="%.1f" font-size="8" fill="#cbd5e1" text-anchor="start" alignment-baseline="middle">-</text>',
                        $labelWidth + 6,
                        $barY + ($barHeight / 2) + 1
                    );
                }

                $sIndex++;
            }

            // Garis pemisah halus antar grup (kecuali baris terakhir)
            if ($iIndex < $itemCount - 1) {
                $separatorY = $groupY + ($seriesCount * ($barHeight + $barGap)) + ($itemPadding / 2);
                $svg[] = sprintf(
                    '<line x1="%d" y1="%.1f" x2="%d" y2="%.1f" stroke="#f1f5f9" stroke-width="1" />',
                    $labelWidth,
                    $separatorY,
                    $width - $marginRight,
                    $separatorY
                );
            }
        }

        $svg[] = '</svg>';

        return implode("\n", $svg);
    }

    /**
     * Konversi string SVG menjadi Data URI base64 yang aman disematkan pada tag <img src="...">.
     */
    public function toBase64DataUri(string $svg): string
    {
        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }

    /**
     * Helper render legenda warna series di atas chart.
     */
    private function renderLegendSvg(int $width, int $y): string
    {
        $legendItems = [];
        $itemWidth = 110;
        $totalLegendWidth = count(self::SERIES) * $itemWidth;
        $startX = ($width - $totalLegendWidth) / 2;

        $idx = 0;
        foreach (self::SERIES as $series) {
            $itemX = $startX + ($idx * $itemWidth);
            $legendItems[] = sprintf(
                '<rect x="%.1f" y="%d" width="10" height="10" rx="2" fill="%s" />'.
                '<text x="%.1f" y="%d" font-size="9" font-weight="500" fill="#475569" alignment-baseline="middle">%s</text>',
                $itemX,
                $y - 8,
                $series['color'],
                $itemX + 14,
                $y - 2,
                htmlspecialchars($series['label'], ENT_XML1, 'UTF-8')
            );
            $idx++;
        }

        return implode("\n", $legendItems);
    }

    /**
     * Wrap teks panjang ke dalam beberapa baris jika melebihi panjang karakter.
     *
     * @return list<string>
     */
    private function wrapText(string $text, int $maxChars = 24): array
    {
        if (mb_strlen($text) <= $maxChars) {
            return [$text];
        }

        $words = explode(' ', $text);
        $lines = [];
        $current = '';

        foreach ($words as $word) {
            if ($current === '') {
                $current = $word;
            } elseif (mb_strlen($current.' '.$word) <= $maxChars) {
                $current .= ' '.$word;
            } else {
                $lines[] = $current;
                $current = $word;
            }
        }

        if ($current !== '') {
            $lines[] = $current;
        }

        return array_slice($lines, 0, 3); // Maksimal 3 baris
    }

    private function renderEmptySvg(int $width, int $height, string $message): string
    {
        return sprintf(
            '<svg width="%d" height="%d" xmlns="http://www.w3.org/2000/svg" style="font-family: Arial, sans-serif; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px;">'.
            '<text x="%d" y="%d" font-size="11" fill="#94a3b8" text-anchor="middle">%s</text>'.
            '</svg>',
            $width,
            $height,
            (int) ($width / 2),
            (int) ($height / 2),
            htmlspecialchars($message, ENT_XML1, 'UTF-8')
        );
    }
}
