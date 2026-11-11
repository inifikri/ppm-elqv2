import { useEffect, useRef, useState } from 'react';
import {
    Chart as ChartJS,
    RadarController,
    BarController,
    RadialLinearScale,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    type ChartConfiguration,
    type ChartData,
    type ChartOptions,
    type ChartType,
    type Plugin,
} from 'chart.js';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';

// Registrasi controller & plugin Chart.js sekali saja
ChartJS.register(
    RadarController,
    BarController,
    RadialLinearScale,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

export type AccessibleTableData = {
    headers: string[];
    rows: (string | number | null | undefined)[][];
    footer?: (string | number | null | undefined)[];
};

export type ChartCanvasProps = {
    type: ChartType;
    data: ChartData;
    options?: ChartOptions;
    title?: string;
    accessibleSummary?: AccessibleTableData;
    height?: number;
    className?: string;
    showDataLabels?: boolean;
};

export function ChartCanvas({
    type,
    data,
    options = {},
    title,
    accessibleSummary,
    height = 320,
    className = '',
    showDataLabels = true,
}: ChartCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<ChartJS | null>(null);
    const [showTable, setShowTable] = useState(false);
    const { resolvedAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    useEffect(() => {
        if (!canvasRef.current) return;

        // Cleanup chart sebelumnya jika ada
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

        // Gabungkan opsi bawaan tema dengan options yang diberikan
        const mergedOptions: ChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        font: { family: 'inherit', size: 12 },
                    },
                    ...options.plugins?.legend,
                },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#0f172a',
                    titleColor: '#ffffff',
                    bodyColor: '#e2e8f0',
                    padding: 10,
                    cornerRadius: 6,
                    ...options.plugins?.tooltip,
                },
                ...options.plugins,
            },
            scales: {
                ...(type === 'radar'
                    ? {
                          r: {
                              grid: { color: gridColor },
                              angleLines: { color: gridColor },
                              pointLabels: {
                                  color: isDark ? '#e2e8f0' : '#1e293b',
                                  font: { size: 11, weight: 'bold' },
                              },
                              ticks: {
                                  color: textColor,
                                  backdropColor: 'transparent',
                                  stepSize: 1,
                              },
                              min: 0,
                              max: 6.5,
                          },
                      }
                    : {
                          x: {
                              grid: { color: gridColor },
                              ticks: { color: textColor },
                          },
                          y: {
                              grid: { color: gridColor },
                              ticks: { color: textColor },
                              min: 0,
                              max: 6.5,
                          },
                      }),
                ...options.scales,
            },
            ...options,
        };

        // Plugin custom untuk menampilkan label angka skor di setiap grafik
        const dataLabelsPlugin: Plugin = {
            id: 'chartDataLabelsPlugin',
            afterDatasetsDraw(chart) {
                if (!showDataLabels) return;

                const { ctx } = chart;
                ctx.save();

                chart.data.datasets.forEach((dataset, datasetIndex) => {
                    const meta = chart.getDatasetMeta(datasetIndex);
                    if (meta.hidden) return;

                    meta.data.forEach((element, index) => {
                        const rawVal = dataset.data[index];
                        if (rawVal === null || rawVal === undefined) return;
                        const val = typeof rawVal === 'number' ? rawVal : Number(rawVal);
                        if (isNaN(val) || val <= 0) return;

                        const text = val.toFixed(2);

                        if (chart.config.type === 'bar') {
                            const isHorizontal = chart.options.indexAxis === 'y';
                            if (isHorizontal) {
                                // Bar horizontal (Sub-dimensi)
                                ctx.font = '600 9.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                                ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
                                ctx.textAlign = 'left';
                                ctx.textBaseline = 'middle';
                                ctx.fillText(text, element.x + 4, element.y);
                            } else {
                                // Bar vertikal (Peran)
                                ctx.font = 'bold 9.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                                ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'bottom';
                                ctx.fillText(text, element.x, element.y - 3);
                            }
                        } else if (chart.config.type === 'radar') {
                            // Radar chart (Diagram 3 Dimensi)
                            ctx.font = 'bold 9.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                            ctx.fillStyle = (dataset.borderColor as string) || (isDark ? '#f8fafc' : '#0f172a');
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'bottom';

                            const rScale = chart.scales.r as any;
                            const cX = rScale?.xCenter ?? chart.width / 2;
                            const cY = rScale?.yCenter ?? chart.height / 2;
                            const dx = element.x - cX;
                            const dy = element.y - cY;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            const offX = dist > 0 ? (dx / dist) * 7 : 0;
                            const offY = dist > 0 ? (dy / dist) * 7 : -4;

                            ctx.fillText(text, element.x + offX, element.y + offY);
                        }
                    });
                });

                ctx.restore();
            },
        };

        const config: ChartConfiguration = {
            type,
            data,
            options: mergedOptions,
            plugins: [dataLabelsPlugin],
        };

        chartInstanceRef.current = new ChartJS(canvasRef.current, config);

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [type, data, options, isDark, showDataLabels]);

    return (
        <div className={`space-y-3 ${className}`}>
            <div style={{ height: `${height}px` }} className="relative w-full">
                <canvas ref={canvasRef} aria-label={title ?? 'Grafik data assessment'} />
            </div>

            {accessibleSummary && (
                <div className="pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        onClick={() => setShowTable((prev) => !prev)}
                        aria-expanded={showTable}
                    >
                        {showTable ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                        {showTable ? 'Sembunyikan tabel ringkasan' : 'Tampilkan tabel data (aksesibilitas)'}
                    </Button>

                    {showTable && (
                        <div className="mt-2 overflow-x-auto rounded-md border text-xs">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        {accessibleSummary.headers.map((h, i) => (
                                            <TableHead key={i} className="text-xs font-semibold py-2">
                                                {h}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {accessibleSummary.rows.map((row, rIdx) => (
                                        <TableRow key={rIdx}>
                                            {row.map((cell, cIdx) => (
                                                <TableCell key={cIdx} className="py-1.5 font-medium">
                                                    {cell !== null && cell !== undefined
                                                        ? typeof cell === 'number'
                                                            ? cell.toFixed(2)
                                                            : cell
                                                        : '-'}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow className="bg-muted/60 font-bold">
                                        {accessibleSummary.footer?.map((cell, fIdx) => (
                                            <TableCell key={fIdx} className="py-2 font-bold">
                                                {cell !== null && cell !== undefined
                                                    ? typeof cell === 'number'
                                                        ? cell.toFixed(2)
                                                        : cell
                                                    : '-'}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
