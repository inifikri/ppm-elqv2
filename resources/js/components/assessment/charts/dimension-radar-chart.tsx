import { useMemo } from 'react';
import type { ChartData } from 'chart.js';
import { ChartCanvas, type AccessibleTableData } from './chart-canvas';
import type { DimensionScore } from '@/types/assessment';

function computeMean(values: (number | null | undefined)[]): number | null {
    const valid = values.filter((v): v is number => v !== null && v !== undefined);
    if (valid.length === 0) return null;
    return Number((valid.reduce((acc, v) => acc + v, 0) / valid.length).toFixed(2));
}

export function DimensionRadarChart({ dimensions = [] }: { dimensions?: DimensionScore[] }) {
    const safeDimensions = Array.isArray(dimensions) ? dimensions : [];

    const chartData: ChartData = useMemo(() => {
        const labels = safeDimensions.map((d) => d.name);

        return {
            labels,
            datasets: [
                {
                    label: 'Diri Sendiri (Self)',
                    data: safeDimensions.map((d) => d.scores.self ?? 0),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.22)',
                    borderWidth: 2,
                    pointBackgroundColor: '#6366f1',
                    pointRadius: 3,
                },
                {
                    label: 'Atasan (Boss)',
                    data: safeDimensions.map((d) => d.scores.boss ?? 0),
                    borderColor: '#32327f',
                    backgroundColor: 'rgba(50, 50, 127, 0.22)',
                    borderWidth: 2,
                    pointBackgroundColor: '#32327f',
                    pointRadius: 3,
                },
                {
                    label: 'Bawahan/Rekan (Subordinate/Peer)',
                    data: safeDimensions.map((d) => d.scores.subordinate ?? 0),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.22)',
                    borderWidth: 2,
                    pointBackgroundColor: '#f59e0b',
                    pointRadius: 3,
                },
                {
                    label: 'Rata-rata (Average)',
                    data: safeDimensions.map((d) => d.scores.average ?? 0),
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.16)',
                    borderWidth: 2.5,
                    borderDash: [5, 4],
                    pointBackgroundColor: '#0ea5e9',
                    pointRadius: 3.5,
                },
            ],
        };
    }, [safeDimensions]);

    const accessibleSummary: AccessibleTableData = useMemo(() => {
        return {
            headers: ['Dimensi', 'Diri Sendiri', 'Atasan', 'Bawahan/Rekan', 'Rata-rata'],
            rows: safeDimensions.map((d) => [
                d.name,
                d.scores.self,
                d.scores.boss,
                d.scores.subordinate,
                d.scores.average,
            ]),
            footer: [
                'Rata-rata (Average)',
                computeMean(safeDimensions.map((d) => d.scores.self)),
                computeMean(safeDimensions.map((d) => d.scores.boss)),
                computeMean(safeDimensions.map((d) => d.scores.subordinate)),
                computeMean(safeDimensions.map((d) => d.scores.average)),
            ],
        };
    }, [safeDimensions]);

    return (
        <ChartCanvas
            type="radar"
            data={chartData}
            title="Radar perbandingan 3 dimensi kepemimpinan antar role dan rata-rata"
            accessibleSummary={accessibleSummary}
            height={340}
        />
    );
}
