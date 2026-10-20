import { useMemo } from 'react';
import type { ChartData, ChartOptions } from 'chart.js';
import { ChartCanvas, type AccessibleTableData } from './chart-canvas';
import type { DimensionScore } from '@/types/assessment';

function computeMean(values: (number | null | undefined)[]): number | null {
    const valid = values.filter((v): v is number => v !== null && v !== undefined);
    if (valid.length === 0) return null;
    return Number((valid.reduce((acc, v) => acc + v, 0) / valid.length).toFixed(2));
}

export function RoleComparisonBarChart({ dimensions }: { dimensions: DimensionScore[] }) {
    const chartData: ChartData = useMemo(() => {
        const labels = dimensions.map((d) => d.name);

        return {
            labels,
            datasets: [
                {
                    label: 'Diri Sendiri',
                    data: dimensions.map((d) => d.scores.self ?? 0),
                    backgroundColor: '#6366f1',
                    borderRadius: 4,
                },
                {
                    label: 'Atasan',
                    data: dimensions.map((d) => d.scores.boss ?? 0),
                    backgroundColor: '#10b981',
                    borderRadius: 4,
                },
                {
                    label: 'Bawahan',
                    data: dimensions.map((d) => d.scores.subordinate ?? 0),
                    backgroundColor: '#f59e0b',
                    borderRadius: 4,
                },
                {
                    label: 'Rata-rata (Average)',
                    data: dimensions.map((d) => d.scores.average ?? 0),
                    backgroundColor: '#0ea5e9',
                    borderRadius: 4,
                },
            ],
        };
    }, [dimensions]);

    const chartOptions: ChartOptions = useMemo(() => {
        return {
            scales: {
                y: {
                    min: 0,
                    max: 6,
                    ticks: { stepSize: 1 },
                },
            },
        };
    }, []);

    const accessibleSummary: AccessibleTableData = useMemo(() => {
        return {
            headers: ['Dimensi', 'Diri Sendiri', 'Atasan', 'Bawahan', 'Rata-rata'],
            rows: dimensions.map((d) => [
                d.name,
                d.scores.self,
                d.scores.boss,
                d.scores.subordinate,
                d.scores.average,
            ]),
            footer: [
                'Rata-rata (Average)',
                computeMean(dimensions.map((d) => d.scores.self)),
                computeMean(dimensions.map((d) => d.scores.boss)),
                computeMean(dimensions.map((d) => d.scores.subordinate)),
                computeMean(dimensions.map((d) => d.scores.average)),
            ],
        };
    }, [dimensions]);

    return (
        <ChartCanvas
            type="bar"
            data={chartData}
            options={chartOptions}
            title="Perbandingan grouped bar per dimensi dan rata-rata"
            accessibleSummary={accessibleSummary}
            height={340}
        />
    );
}
