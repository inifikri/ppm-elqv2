import { cn } from '@/lib/utils';

/** Kartu form auth: border tipis + shadow lembut berlapis. */
export function AuthCard({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            className={cn(
                'rounded-modal border border-border/60 bg-card p-5 text-card-foreground shadow-[0_1px_2px_0_rgb(15_23_42/0.04),0_8px_24px_-8px_rgb(15_23_42/0.10)] sm:p-6 dark:border-border dark:shadow-[0_1px_2px_0_rgb(0_0_0/0.3),0_8px_24px_-8px_rgb(0_0_0/0.5)]',
                className,
            )}
            {...props}
        />
    );
}
