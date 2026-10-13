import { useMemo } from 'react';
import type { ChartData, ChartOptions } from 'chart.js';
import { ChartCanvas, type AccessibleTableData } from './chart-canvas';
import type { DimensionScore } from '@/types/assessment';

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
            headers: ['Dimensi', 'Diri Sendiri', 'Atasan', 'Bawahan'],
            rows: dimensions.map((d) => [
                d.name,
                d.scores.self,
                d.scores.boss,
                d.scores.subordinate,
            ]),
        };
    }, [dimensions]);

    return (
        <ChartCanvas
            type="bar"
            data={chartData}
            options={chartOptions}
            title="Perbandingan grouped bar per dimensi"
            accessibleSummary={accessibleSummary}
            height={340}
        />
    );
}
