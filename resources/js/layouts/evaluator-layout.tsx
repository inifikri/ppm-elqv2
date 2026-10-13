import { AppFooter } from '@/components/app-footer';
import AppLogo from '@/components/app-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { TopbarShell } from '@/components/layout/topbar-shell';

/** No nav: evaluators arrive via signed URL and only do one thing. */
export default function EvaluatorLayout({
    step,
    children,
}: {
    step?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-[100dvh] flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
            <TopbarShell
                maxWidth="2xl"
                left={<AppLogo />}
                right={
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {step}
                        <ThemeToggle />
                    </div>
                }
            />
            <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-4 text-base sm:px-6 md:py-8">
                {children}
            </main>
            <AppFooter />
        </div>
    );
}
