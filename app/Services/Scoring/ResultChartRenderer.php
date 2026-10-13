<?php

namespace App\Services\Scoring;

use App\Enums\RaterRole;

class ResultChartRenderer
{
    /**
     * Render SVG Radar Chart untuk 3 Dimensi (Self, Atasan, Bawahan).
     *
     * @param  list<array{id: int, name: string, scores: array{self: float|null, boss: float|null, subordinate: float|null, average: float|null}}>  $dimensions
     */
    public function renderRadarSvg(array $dimensions): string
    {
        $count = count($dimensions);
        if ($count < 3) {
            return '<!-- Dimensi kurang dari 3 untuk radar chart. Fallback ke tabel nilai. -->';
        }

        $width = 460;
        $height = 360;
        $centerX = 230;
        $centerY = 175;
        $radius = 120;
        $maxScore = 6.0;

        // Hitung sudut tiap sumbu (mulai dari atas / -90 derajat)
        $angles = [];
        for ($i = 0; $i < $count; $i++) {
            $angles[$i] = -M_PI / 2 + ($i * 2 * M_PI / $count);
        }

        $svg = [];
        $svg[] = sprintf(
            '<svg width="%d" height="%d" viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg" style="font-family: Arial, Helvetica, sans-serif; display: block; margin: 0 auto;">',
            $width,
            $height,
            $width,
            $height
        );

        // 1. Grid konsentris lingkaran/poligon (skala 1 s.d. 6)
        for ($level = 1; $level <= 6; $level++) {
            $r = ($level / $maxScore) * $radius;
            $gridPoints = [];
            for ($i = 0; $i < $count; $i++) {
                $gx = $centerX + $r * cos($angles[$i]);
                $gy = $centerY + $r * sin($angles[$i]);
                $gridPoints[] = sprintf('%.1f,%.1f', $gx, $gy);
            }
            $fill = $level === 6 ? '#f8fafc' : 'none';
            $stroke = $level % 2 === 0 ? '#cbd5e1' : '#e2e8f0';
            $svg[] = sprintf(
                '<polygon points="%s" fill="%s" stroke="%s" stroke-width="1" />',
                implode(' ', $gridPoints),
                $fill,
                $stroke
            );

            // Label skala pada sumbu atas
            if ($level > 0) {
                $lblY = $centerY - $r + 10;
                $svg[] = sprintf(
                    '<text x="%d" y="%.1f" font-size="9" fill="#94a3b8" text-anchor="middle">%d</text>',
                    $centerX + 8,
                    $lblY,
                    $level
                );
            }
        }

        // 2. Garis sumbu & label dimensi
        for ($i = 0; $i < $count; $i++) {
            $ex = $centerX + $radius * cos($angles[$i]);
            $ey = $centerY + $radius * sin($angles[$i]);
            $svg[] = sprintf(
                '<line x1="%d" y1="%d" x2="%.1f" y2="%.1f" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2" />',
                $centerX,
                $centerY,
                $ex,
                $ey
            );

            // Label teks dimensi di ujung sumbu
            $lx = $centerX + ($radius + 24) * cos($angles[$i]);
            $ly = $centerY + ($radius + 18) * sin($angles[$i]);
            $anchor = 'middle';
            if (cos($angles[$i]) > 0.3) {
                $anchor = 'start';
            } elseif (cos($angles[$i]) < -0.3) {
                $anchor = 'end';
            }

            $dimName = htmlspecialchars($dimensions[$i]['name'], ENT_XML1);
            $svg[] = sprintf(
                '<text x="%.1f" y="%.1f" font-size="11" font-weight="bold" fill="#1e293b" text-anchor="%s">%s</text>',
                $lx,
                $ly,
                $anchor,
                $dimName
            );
        }

        // 3. Poligon nilai untuk setiap role
        $rolesConfig = [
            RaterRole::SelfRater->value => [
                'label' => 'Diri Sendiri',
                'fill' => 'rgba(99, 102, 241, 0.25)',
                'stroke' => '#4f46e5',
                'strokeWidth' => 2,
            ],
            RaterRole::Boss->value => [
                'label' => 'Atasan',
                'fill' => 'rgba(16, 185, 129, 0.25)',
                'stroke' => '#059669',
                'strokeWidth' => 2,
            ],
            RaterRole::Subordinate->value => [
                'label' => 'Bawahan',
                'fill' => 'rgba(245, 158, 11, 0.25)',
                'stroke' => '#d97706',
                'strokeWidth' => 2,
            ],
        ];

        foreach ($rolesConfig as $roleKey => $cfg) {
            $points = [];
            $hasScore = false;

            for ($i = 0; $i < $count; $i++) {
                $score = $dimensions[$i]['scores'][$roleKey] ?? null;
                $val = $score !== null ? max(0, min($maxScore, (float) $score)) : 0;
                if ($score !== null) {
                    $hasScore = true;
                }
                $r = ($val / $maxScore) * $radius;
                $px = $centerX + $r * cos($angles[$i]);
                $py = $centerY + $r * sin($angles[$i]);
                $points[] = sprintf('%.1f,%.1f', $px, $py);
            }

            if ($hasScore && count($points) === $count) {
                $svg[] = sprintf(
                    '<polygon points="%s" fill="%s" stroke="%s" stroke-width="%d" />',
                    implode(' ', $points),
                    $cfg['fill'],
                    $cfg['stroke'],
                    $cfg['strokeWidth']
                );

                // Titik sudut (dots)
                for ($i = 0; $i < $count; $i++) {
                    $score = $dimensions[$i]['scores'][$roleKey] ?? null;
                    if ($score !== null) {
                        $val = max(0, min($maxScore, (float) $score));
                        $r = ($val / $maxScore) * $radius;
                        $px = $centerX + $r * cos($angles[$i]);
                        $py = $centerY + $r * sin($angles[$i]);
                        $svg[] = sprintf(
                            '<circle cx="%.1f" cy="%.1f" r="3" fill="%s" />',
                            $px,
                            $py,
                            $cfg['stroke']
                        );
                    }
                }
            }
        }

        // 4. Legend di bagian bawah
        $legY = $height - 20;
        $items = [
            ['label' => 'Diri Sendiri', 'color' => '#4f46e5'],
            ['label' => 'Atasan', 'color' => '#059669'],
            ['label' => 'Bawahan', 'color' => '#d97706'],
        ];

        $startX = 110;
        foreach ($items as $idx => $item) {
            $ix = $startX + ($idx * 90);
            $svg[] = sprintf(
                '<rect x="%d" y="%d" width="12" height="12" fill="%s" rx="2" />',
                $ix,
                $legY - 10,
                $item['color']
            );
            $svg[] = sprintf(
                '<text x="%d" y="%d" font-size="10" fill="#475569">%s</text>',
                $ix + 16,
                $legY,
                $item['label']
            );
        }

        $svg[] = '</svg>';

        return implode("\n", $svg);
    }
}
