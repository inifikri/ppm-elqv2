<?php

namespace App\Services\Reports;

use App\Enums\EffectivenessCategory;

class AssessmentReportData
{
    /**
     * @param  array{id: int, name: string, email: string, phone: string, company: string, position: string}  $participant
     * @param  array{self: array{submitted: int, total: int, is_complete: bool}, boss: array{submitted: int, total: int, is_complete: bool}, subordinate: array{submitted: int, total: int, is_complete: bool}, total_submitted: int, total_raters: int, is_all_complete: bool}  $answeredRaters
     * @param  array{self: float|null, boss: float|null, subordinate: float|null}  $roleOverallScores
     * @param  list<array{
     *     id: int,
     *     name: string,
     *     sort_order: int,
     *     scores: array{average: float|null, self: float|null, boss: float|null, subordinate: float|null},
     *     category: EffectivenessCategory|null,
     *     sub_dimensions: list<array{
     *         id: int,
     *         name: string,
     *         sort_order: int,
     *         scores: array{average: float|null, self: float|null, boss: float|null, subordinate: float|null},
     *         questions: list<array{
     *             no: int,
     *             id: int,
     *             text: string,
     *             scores: array{average: float|null, self: float|null, boss: float|null, subordinate: float|null}
     *         }>
     *     }>
     * }>  $dimensions
     */
    public function __construct(
        public readonly array $participant,
        public readonly string $printedAt,
        public readonly bool $hasData,
        public readonly array $answeredRaters,
        public readonly ?float $overallScore,
        public readonly ?EffectivenessCategory $overallCategory,
        public readonly array $roleOverallScores,
        public readonly array $dimensions,
    ) {}

    /**
     * Format data untuk input bar chart dimensi.
     *
     * @return list<array{label: string, scores: array{average: float|null, self: float|null, boss: float|null, subordinate: float|null}}>
     */
    public function getDimensionChartItems(): array
    {
        $items = [];
        foreach ($this->dimensions as $dim) {
            $items[] = [
                'label' => $dim['name'],
                'scores' => $dim['scores'],
            ];
        }

        return $items;
    }

    /**
     * Format data untuk input bar chart horizontal sub-dimensi pada dimensi tertentu.
     *
     * @return list<array{label: string, scores: array{average: float|null, self: float|null, boss: float|null, subordinate: float|null}}>
     */
    public function getSubDimensionChartItems(int $dimensionId): array
    {
        foreach ($this->dimensions as $dim) {
            if ($dim['id'] === $dimensionId) {
                $items = [];
                foreach ($dim['sub_dimensions'] as $sub) {
                    $items[] = [
                        'label' => $sub['name'],
                        'scores' => $sub['scores'],
                    ];
                }

                return $items;
            }
        }

        return [];
    }
}
