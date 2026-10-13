import { useMemo } from 'react';
import type { ChartData, ChartOptions } from 'chart.js';
import { ChartCanvas, type AccessibleTableData } from './chart-canvas';
import type { SubDimensionScore } from '@/types/assessment';

export function SubDimensionBarChart({
    dimensionName,
    subDimensions,
}: {
    dimensionName: string;
    subDimensions: SubDimensionScore[];
}) {
    const chartData: ChartData = useMemo(() => {
        const labels = subDimensions.map((sd) => sd.name);

        return {
            labels,
            datasets: [
                {
                    label: 'Diri Sendiri',
                    data: subDimensions.map((sd) => sd.scores.self ?? 0),
                    backgroundColor: '#6366f1',
                    borderRadius: 4,
                },
                {
                    label: 'Atasan',
                    data: subDimensions.map((sd) => sd.scores.boss ?? 0),
                    backgroundColor: '#10b981',
                    borderRadius: 4,
                },
                {
                    label: 'Bawahan',
                    data: subDimensions.map((sd) => sd.scores.subordinate ?? 0),
                    backgroundColor: '#f59e0b',
                    borderRadius: 4,
                },
            ],
        };
    }, [subDimensions]);

    const chartOptions: ChartOptions = useMemo(() => {
        return {
            indexAxis: 'y' as const,
            scales: {
                x: {
                    min: 0,
                    max: 6,
                    ticks: { stepSize: 1 },
                },
            },
        };
    }, []);

    const accessibleSummary: AccessibleTableData = useMemo(() => {
        return {
            headers: ['Sub-Dimensi', 'Diri Sendiri', 'Atasan', 'Bawahan', 'Rata-rata'],
            rows: subDimensions.map((sd) => [
                sd.name,
                sd.scores.self,
                sd.scores.boss,
                sd.scores.subordinate,
                sd.scores.average,
            ]),
        };
    }, [subDimensions]);

    const height = Math.max(260, subDimensions.length * 48);

    return (
        <ChartCanvas
            type="bar"
            data={chartData}
            options={chartOptions}
            title={`Grafik horizontal sub-dimensi untuk ${dimensionName}`}
            accessibleSummary={accessibleSummary}
            height={height}
        />
    );
}
