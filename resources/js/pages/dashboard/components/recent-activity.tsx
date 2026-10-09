import { History } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/format-relative-time';
import type { DashboardData } from '@/types';

export function RecentActivity({
    items,
}: {
    items: DashboardData['recent_activity'];
}) {
    return (
        <Card className="shadow-none">
            <CardHeader>
                <CardTitle>Aktivitas terbaru</CardTitle>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <EmptyState icon={History} title="Belum ada aktivitas" />
                ) : (
                    <ul className="divide-y">
                        {items.map((item) => (
                            <li
                                key={item.id}
                                className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
                            >
                                <p className="min-w-0 truncate">
                                    <span className="font-medium">
                                        {item.actor}
                                    </span>{' '}
                                    <span className="text-muted-foreground">
                                        {item.description} {item.subject}
                                    </span>
                                </p>
                                <time
                                    dateTime={item.at}
                                    className="shrink-0 text-xs text-muted-foreground"
                                >
                                    {formatRelativeTime(item.at)}
                                </time>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
