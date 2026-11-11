import { cn } from '@/lib/utils';

/** Logo resmi PPM Manajemen dan Wordmark ELQ 360°. */
export function AuthBrandMark({
    className,
    centered = false,
}: {
    className?: string;
    centered?: boolean;
}) {
    if (centered) {
        return (
            <div className={cn('inline-flex items-center justify-center gap-3.5 sm:gap-4', className)}>
                <img
                    src="/image/Logo-PPM-01.png"
                    alt="PPM Manajemen"
                    className="h-11 sm:h-12 w-auto object-contain drop-shadow-xs"
                />
                <div className="h-9 w-px bg-border/80" aria-hidden="true" />
                <div className="flex flex-col text-left">
                    <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground leading-tight">
                        ELQ <span className="text-primary">360°</span>
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Executive Leadership Questionnaire
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('inline-flex items-center gap-3', className)}>
            <img
                src="/image/Logo-PPM-01.png"
                alt="PPM Manajemen"
                className="h-8 w-auto object-contain"
            />
            <div className="flex flex-col text-left">
                <span className="text-sm font-bold tracking-tight text-foreground leading-none">
                    ELQ <span className="text-primary">360°</span>
                </span>
                <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase mt-0.5">
                    Assessment System
                </span>
            </div>
        </div>
    );
}

