import { ChartColumn } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { DashboardData } from '@/types';

const MAX_SCORE = 6;

export function DimensionOverview({
    dimensions,
}: {
    dimensions: DashboardData['dimensions'];
}) {
    return (
        <Card className="shadow-none">
            <CardHeader>
                <CardTitle>Rata-rata skor per dimensi</CardTitle>
            </CardHeader>
            <CardContent>
                {dimensions.length === 0 ? (
                    <EmptyState
                        icon={ChartColumn}
                        title="Belum ada jawaban"
                        description="Skor muncul setelah penilai mengirim assessment."
                    />
                ) : (
                    <ul className="space-y-3">
                        {dimensions.map((d) => (
                            <li key={d.id} className="space-y-1">
                                <div className="flex justify-between gap-3 text-sm">
                                    <span className="truncate">{d.name}</span>
                                    <span className="font-medium tabular-nums">
                                        {d.average.toFixed(2)}
                                        <span className="text-muted-foreground">
                                            {' '}
                                            / {MAX_SCORE}
                                        </span>
                                    </span>
                                </div>
                                <Progress
                                    value={(d.average / MAX_SCORE) * 100}
                                    aria-label={`Skor ${d.name}`}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
