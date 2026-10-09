import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageContainer({
    children,
    className,
    narrow = false,
}: {
    children: ReactNode;
    className?: string;
    /** Form pages: max ~720px. Default: max ~1536px. */
    narrow?: boolean;
}) {
    return (
        <div
            className={cn(
                'mx-auto w-full space-y-6 p-4 md:p-6',
                narrow ? 'max-w-[720px]' : 'max-w-[1536px]',
                className,
            )}
        >
            {children}
        </div>
    );
}
