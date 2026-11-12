import { useMemo } from 'react';
import type { ChartData, ChartOptions } from 'chart.js';
import { ChartCanvas, type AccessibleTableData } from './chart-canvas';
import type { DimensionScore, SubDimensionScore } from '@/types/assessment';

function computeMean(values: (number | null | undefined)[]): number | null {
    const valid = values.filter((v): v is number => v !== null && v !== undefined);
    if (valid.length === 0) return null;
    return Number((valid.reduce((acc, v) => acc + v, 0) / valid.length).toFixed(2));
}

export type SubDimensionBarChartProps = {
    dimensionName?: string;
    subDimensions?: SubDimensionScore[];
    dimensions?: DimensionScore[];
};

export function SubDimensionBarChart({
    dimensionName,
    subDimensions,
    dimensions,
}: SubDimensionBarChartProps) {
    const effectiveSubDimensions = useMemo<SubDimensionScore[]>(() => {
        if (Array.isArray(subDimensions) && subDimensions.length > 0) {
            return subDimensions;
        }
        if (Array.isArray(dimensions) && dimensions.length > 0) {
            return dimensions.flatMap((d) => d.sub_dimensions ?? []);
        }
        return [];
    }, [subDimensions, dimensions]);

    const titleDimensionName = dimensionName || 'Kompetensi Kepemimpinan';

    const chartData: ChartData = useMemo(() => {
        const labels = effectiveSubDimensions.map((sd) => sd.name);

        return {
            labels,
            datasets: [
                {
                    label: 'Diri Sendiri',
                    data: effectiveSubDimensions.map((sd) => sd.scores.self ?? 0),
                    backgroundColor: '#6366f1',
                    borderRadius: 4,
                },
                {
                    label: 'Atasan',
                    data: effectiveSubDimensions.map((sd) => sd.scores.boss ?? 0),
                    backgroundColor: '#32327f',
                    borderRadius: 4,
                },
                {
                    label: 'Bawahan/Rekan',
                    data: effectiveSubDimensions.map((sd) => sd.scores.subordinate ?? 0),
                    backgroundColor: '#f59e0b',
                    borderRadius: 4,
                },
                {
                    label: 'Rata-rata (Average)',
                    data: effectiveSubDimensions.map((sd) => sd.scores.average ?? 0),
                    backgroundColor: '#0ea5e9',
                    borderRadius: 4,
                },
            ],
        };
    }, [effectiveSubDimensions]);

    const chartOptions: ChartOptions = useMemo(() => {
        return {
            indexAxis: 'y' as const,
            scales: {
                x: {
                    min: 0,
                    max: 6.8,
                    ticks: { stepSize: 1 },
                },
            },
        };
    }, []);

    const accessibleSummary: AccessibleTableData = useMemo(() => {
        return {
            headers: ['Sub-Dimensi', 'Diri Sendiri', 'Atasan', 'Bawahan/Rekan', 'Rata-rata'],
            rows: effectiveSubDimensions.map((sd) => [
                sd.name,
                sd.scores.self,
                sd.scores.boss,
                sd.scores.subordinate,
                sd.scores.average,
            ]),
            footer: [
                `Rata-rata ${titleDimensionName}`,
                computeMean(effectiveSubDimensions.map((sd) => sd.scores.self)),
                computeMean(effectiveSubDimensions.map((sd) => sd.scores.boss)),
                computeMean(effectiveSubDimensions.map((sd) => sd.scores.subordinate)),
                computeMean(effectiveSubDimensions.map((sd) => sd.scores.average)),
            ],
        };
    }, [titleDimensionName, effectiveSubDimensions]);

    const height = Math.max(280, effectiveSubDimensions.length * 48);

    return (
        <ChartCanvas
            type="bar"
            data={chartData}
            options={chartOptions}
            title={`Grafik horizontal sub-dimensi untuk ${titleDimensionName}`}
            accessibleSummary={accessibleSummary}
            height={height}
        />
    );
}
