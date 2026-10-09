import {
    Ban,
    Check,
    CircleX,
    Clock,
    Loader,
    type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STATUSES = {
    active: { label: 'Aktif', variant: 'success', icon: Check },
    inactive: { label: 'Nonaktif', variant: 'outline', icon: Ban },
    completed: { label: 'Selesai', variant: 'success', icon: Check },
    in_progress: { label: 'Berjalan', variant: 'info', icon: Loader },
    not_started: { label: 'Belum mulai', variant: 'outline', icon: Clock },
    sent: { label: 'Terkirim', variant: 'success', icon: Check },
    failed: { label: 'Gagal', variant: 'danger', icon: CircleX },
    pending: { label: 'Pending', variant: 'warning', icon: Clock },
} satisfies Record<
    string,
    {
        label: string;
        variant: 'success' | 'outline' | 'info' | 'danger' | 'warning';
        icon: LucideIcon;
    }
>;

export type Status = keyof typeof STATUSES;

/** Icon + text, never color alone. */
export function StatusBadge({ status }: { status: Status }) {
    const { label, variant, icon: Icon } = STATUSES[status];

    return (
        <Badge variant={variant}>
            <Icon aria-hidden="true" />
            {label}
        </Badge>
    );
}

export const activeStatus = (isActive: boolean): Status =>
    isActive ? 'active' : 'inactive';
