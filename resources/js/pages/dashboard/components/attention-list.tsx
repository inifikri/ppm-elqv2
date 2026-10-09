import { CircleCheck } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardData } from '@/types';

export function AttentionList({
    items,
}: {
    items: DashboardData['attention'];
}) {
    return (
        <Card className="shadow-none">
            <CardHeader>
                <CardTitle>Perlu perhatian</CardTitle>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <EmptyState
                        icon={CircleCheck}
                        title="Semua beres"
                        description="Tidak ada yang perlu ditindaklanjuti."
                    />
                ) : (
                    <ul className="space-y-3">
                        {items.map((item) => (
                            <li
                                key={item.key}
                                className="flex items-start justify-between gap-3 text-sm"
                            >
                                <span>{item.label}</span>
                                <Badge variant={item.tone}>{item.count}</Badge>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
