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
};

export function ChartCanvas({
    type,
    data,
    options = {},
    title,
    accessibleSummary,
    height = 320,
    className = '',
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
                              max: 6,
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
                              max: 6,
                          },
                      }),
                ...options.scales,
            },
            ...options,
        };

        const config: ChartConfiguration = {
            type,
            data,
            options: mergedOptions,
        };

        chartInstanceRef.current = new ChartJS(canvasRef.current, config);

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [type, data, options, isDark]);

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
                                {accessibleSummary.footer && (
                                    <TableFooter>
                                        <TableRow className="bg-muted/60 font-bold">
                                            {accessibleSummary.footer.map((cell, fIdx) => (
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
                                )}
                            </Table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
