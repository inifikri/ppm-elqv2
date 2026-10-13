import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export type WizardStepProps = {
    badge?: string;
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
};

export function WizardStep({
    badge,
    title,
    description,
    children,
    className,
}: WizardStepProps) {
    return (
        <section
            className={cn(
                'space-y-6 animate-in fade-in-50 duration-200 motion-reduce:animate-none',
                className
            )}
            aria-labelledby="wizard-step-title"
        >
            <header className="space-y-1.5 text-left">
                {badge && (
                    <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold py-0.5 px-2.5 mb-1"
                    >
                        {badge}
                    </Badge>
                )}
                <h1
                    id="wizard-step-title"
                    className="text-lg sm:text-xl font-bold tracking-tight text-foreground text-balance"
                >
                    {title}
                </h1>
                {description && (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-balance line-clamp-3">
                        {description}
                    </p>
                )}
            </header>

            <div className="space-y-4">
                {children}
            </div>
        </section>
    );
}
