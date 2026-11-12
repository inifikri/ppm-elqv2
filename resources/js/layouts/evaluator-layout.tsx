import { AppFooter } from '@/components/app-footer';
import AppLogo from '@/components/app-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { TopbarShell } from '@/components/layout/topbar-shell';
import { cn } from '@/lib/utils';

/** No nav: evaluators arrive via signed URL and only do one thing. */
export default function EvaluatorLayout({
    step,
    maxWidth = '2xl',
    children,
}: {
    step?: React.ReactNode;
    maxWidth?: '2xl' | '4xl' | '5xl' | '6xl' | '7xl';
    children: React.ReactNode;
}) {
    const mainMaxWidthClass = {
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        '7xl': 'max-w-7xl',
    }[maxWidth] ?? 'max-w-2xl';

    const topbarMaxWidth =
        maxWidth === '6xl' || maxWidth === '7xl'
            ? '7xl'
            : maxWidth === '4xl'
              ? 'xl'
              : maxWidth === '2xl'
                ? '2xl'
                : '5xl';

    return (
        <div className="flex min-h-[100dvh] flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
            <TopbarShell
                maxWidth={topbarMaxWidth}
                left={<AppLogo />}
                right={
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {step}
                        <ThemeToggle />
                    </div>
                }
            />
            <main className={cn(
                'mx-auto w-full flex-1 space-y-4 px-4 py-4 text-base sm:px-6 md:py-8',
                mainMaxWidthClass
            )}>
                {children}
            </main>
            <AppFooter />
        </div>
    );
}
