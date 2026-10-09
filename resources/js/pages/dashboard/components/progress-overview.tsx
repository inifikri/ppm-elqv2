import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { DashboardData } from '@/types';

const SEGMENTS = [
    { key: 'completed', label: 'Selesai', className: 'bg-success' },
    { key: 'in_progress', label: 'Berjalan', className: 'bg-warning' },
    {
        key: 'not_started',
        label: 'Belum mulai',
        className: 'bg-muted-foreground/30',
    },
] as const;

export function ProgressOverview({
    kpi,
    roles,
}: {
    kpi: DashboardData['kpi'];
    roles: DashboardData['roles'];
}) {
    const total = kpi.completed + kpi.in_progress + kpi.not_started;

    return (
        <Card className="shadow-none">
            <CardHeader>
                <CardTitle>Status assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {total === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Belum ada peserta aktif.
                    </p>
                ) : (
                    <div className="space-y-3">
                        <div
                            className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
                            role="img"
                            aria-label={SEGMENTS.map(
                                (s) => `${s.label} ${kpi[s.key]}`,
                            ).join(', ')}
                        >
                            {SEGMENTS.map((s) => (
                                <div
                                    key={s.key}
                                    className={s.className}
                                    style={{
                                        width: `${(kpi[s.key] / total) * 100}%`,
                                    }}
                                />
                            ))}
                        </div>
                        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                            {SEGMENTS.map((s) => (
                                <li
                                    key={s.key}
                                    className="flex items-center gap-2"
                                >
                                    <span
                                        className={`size-2.5 rounded-full ${s.className}`}
                                        aria-hidden="true"
                                    />
                                    <span className="text-muted-foreground">
                                        {s.label}
                                    </span>
                                    <span className="font-medium tabular-nums">
                                        {kpi[s.key]}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="space-y-3">
                    <h3 className="text-sm font-medium">
                        Progres per peran penilai
                    </h3>
                    {roles.map((r) => (
                        <div key={r.role} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span>{r.label}</span>
                                <span className="text-muted-foreground tabular-nums">
                                    {r.submitted}/{r.total}
                                </span>
                            </div>
                            <Progress
                                value={
                                    r.total === 0
                                        ? 0
                                        : (r.submitted / r.total) * 100
                                }
                                aria-label={`Progres ${r.label}`}
                            />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
