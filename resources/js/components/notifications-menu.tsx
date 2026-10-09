import { Bell } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DashboardData } from '@/types';

export function NotificationsMenu() {
    const { notifications } = usePage<{
        notifications?: DashboardData['attention'];
    }>().props;
    const items = notifications ?? [];
    const total = items.reduce((sum, item) => sum + item.count, 0);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={
                        total > 0
                            ? `Notifikasi, ${total} perlu perhatian`
                            : 'Notifikasi'
                    }
                >
                    <Bell />
                    {total > 0 && (
                        <span
                            aria-hidden
                            className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive"
                        />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Perlu perhatian</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {items.length === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                        Tidak ada notifikasi.
                    </p>
                ) : (
                    <ul className="space-y-1 p-1">
                        {items.map((item) => (
                            <li
                                key={item.key}
                                className="flex items-start justify-between gap-3 rounded-control px-2 py-1.5 text-sm"
                            >
                                <span>{item.label}</span>
                                <span className="font-semibold tabular-nums">
                                    {item.count}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
