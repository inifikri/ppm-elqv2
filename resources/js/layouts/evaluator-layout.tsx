import { AppFooter } from '@/components/app-footer';
import AppLogo from '@/components/app-logo';
import { ThemeToggle } from '@/components/theme-toggle';

/** No nav: evaluators arrive via signed URL and only do one thing. */
export default function EvaluatorLayout({
    step,
    children,
}: {
    step?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="border-b bg-surface">
                <div className="mx-auto flex h-14 w-full max-w-2xl items-center gap-4 px-4">
                    <AppLogo />
                    <div className="ml-auto flex items-center gap-2 text-sm text-text-secondary">
                        {step}
                        <ThemeToggle />
                    </div>
                </div>
            </header>
            <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-4 text-base md:py-8">
                {children}
            </main>
            <AppFooter />
        </div>
    );
}
