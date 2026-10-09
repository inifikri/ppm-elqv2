import { ClipboardCheck } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/format-relative-time';
import type { DashboardData } from '@/types';

export function RecentAssessments({
    items,
}: {
    items: DashboardData['recent_assessments'];
}) {
    return (
        <Card className="shadow-none">
            <CardHeader>
                <CardTitle>Assessment terbaru</CardTitle>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <EmptyState
                        icon={ClipboardCheck}
                        title="Belum ada assessment masuk"
                    />
                ) : (
                    <ul className="divide-y">
                        {items.map((item) => (
                            <li
                                key={item.id}
                                className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-medium">
                                        {item.participant}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Dinilai oleh {item.role}
                                    </p>
                                </div>
                                <time
                                    dateTime={item.submitted_at}
                                    className="shrink-0 text-xs text-muted-foreground"
                                >
                                    {formatRelativeTime(item.submitted_at)}
                                </time>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
