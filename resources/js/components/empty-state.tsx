import { type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            {Icon && (
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="size-6" aria-hidden="true" />
                </div>
            )}
            <div className="space-y-1">
                <h3 className="text-sm font-medium">{title}</h3>
                {description && (
                    <p className="max-w-sm text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}
