import { useMemo } from 'react';
import type { ChartData } from 'chart.js';
import { ChartCanvas, type AccessibleTableData } from './chart-canvas';
import type { DimensionScore } from '@/types/assessment';

export function DimensionRadarChart({ dimensions }: { dimensions: DimensionScore[] }) {
    const chartData: ChartData = useMemo(() => {
        const labels = dimensions.map((d) => d.name);

        return {
            labels,
            datasets: [
                {
                    label: 'Diri Sendiri (Self)',
                    data: dimensions.map((d) => d.scores.self ?? 0),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.25)',
                    borderWidth: 2,
                    pointBackgroundColor: '#6366f1',
                    pointRadius: 3,
                },
                {
                    label: 'Atasan (Boss)',
                    data: dimensions.map((d) => d.scores.boss ?? 0),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.25)',
                    borderWidth: 2,
                    pointBackgroundColor: '#10b981',
                    pointRadius: 3,
                },
                {
                    label: 'Bawahan (Subordinate)',
                    data: dimensions.map((d) => d.scores.subordinate ?? 0),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.25)',
                    borderWidth: 2,
                    pointBackgroundColor: '#f59e0b',
                    pointRadius: 3,
                },
            ],
        };
    }, [dimensions]);

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
        };
    }, [dimensions]);

    return (
        <ChartCanvas
            type="radar"
            data={chartData}
            title="Radar perbandingan 3 dimensi kepemimpinan antar role"
            accessibleSummary={accessibleSummary}
            height={340}
        />
    );
}
