import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const tones = {
    primary:
        'border-0 bg-linear-to-br from-primary to-[color-mix(in_oklab,var(--primary),black_15%)] text-primary-foreground',
    info: 'border-0 bg-linear-to-br from-info to-[color-mix(in_oklab,var(--info),black_15%)] text-info-foreground',
    warning:
        'border-0 bg-linear-to-br from-warning to-[color-mix(in_oklab,var(--warning),black_15%)] text-warning-foreground',
    success:
        'border-0 bg-linear-to-br from-success to-[color-mix(in_oklab,var(--success),black_15%)] text-success-foreground',
} as const;

export function StatCard({
    label,
    value,
    hint,
    icon: Icon,
    tone,
}: {
    label: string;
    value: string | number;
    hint?: string;
    icon?: LucideIcon;
    tone?: keyof typeof tones;
}) {
    const solid = tone ? tones[tone] : undefined;

    return (
        <Card className={cn('gap-0 py-0 shadow-none', solid)}>
            <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="space-y-1">
                    <p
                        className={cn(
                            'text-sm',
                            !solid && 'text-muted-foreground',
                        )}
                    >
                        {label}
                    </p>
                    <p className="text-3xl font-semibold tracking-tight tabular-nums">
                        {value}
                    </p>
                    {hint && (
                        <p
                            className={cn(
                                'text-xs',
                                solid ? 'opacity-90' : 'text-muted-foreground',
                            )}
                        >
                            {hint}
                        </p>
                    )}
                </div>
                {Icon && (
                    <div
                        className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-card',
                            solid
                                ? 'bg-white/20'
                                : 'bg-accent text-accent-foreground',
                        )}
                    >
                        <Icon className="size-5" aria-hidden="true" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function StatCardSkeleton() {
    return (
        <Card className="gap-0 py-0 shadow-none" aria-hidden="true">
            <CardContent className="space-y-3 p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
            </CardContent>
        </Card>
    );
}
