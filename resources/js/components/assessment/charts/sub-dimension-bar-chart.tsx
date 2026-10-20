import { useMemo } from 'react';
import type { ChartData, ChartOptions } from 'chart.js';
import { ChartCanvas, type AccessibleTableData } from './chart-canvas';
import type { SubDimensionScore } from '@/types/assessment';

function computeMean(values: (number | null | undefined)[]): number | null {
    const valid = values.filter((v): v is number => v !== null && v !== undefined);
    if (valid.length === 0) return null;
    return Number((valid.reduce((acc, v) => acc + v, 0) / valid.length).toFixed(2));
}

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
                {
                    label: 'Rata-rata (Average)',
                    data: subDimensions.map((sd) => sd.scores.average ?? 0),
                    backgroundColor: '#0ea5e9',
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
            footer: [
                `Rata-rata ${dimensionName}`,
                computeMean(subDimensions.map((sd) => sd.scores.self)),
                computeMean(subDimensions.map((sd) => sd.scores.boss)),
                computeMean(subDimensions.map((sd) => sd.scores.subordinate)),
                computeMean(subDimensions.map((sd) => sd.scores.average)),
            ],
        };
    }, [dimensionName, subDimensions]);

    const height = Math.max(280, subDimensions.length * 56);

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
