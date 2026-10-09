import { Orbit } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Wordmark "ELQ" buatan sendiri (bukan logo PPM). */
export function AuthBrandMark({ className }: { className?: string }) {
    return (
        <span className={cn('inline-flex items-center gap-2', className)}>
            <span className="flex size-8 items-center justify-center rounded-control bg-primary text-primary-foreground">
                <Orbit className="size-4" aria-hidden="true" />
            </span>
            <span className="text-base font-semibold tracking-tight">ELQ</span>
        </span>
    );
}
