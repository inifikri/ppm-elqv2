import { usePage } from '@inertiajs/react';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthTabs } from '@/components/auth/auth-tabs';
import { AuthTopbar } from '@/components/auth/auth-topbar';

export default function AuthLayout({
    title = '',
    description = '',
    card = true,
    children,
}: {
    title?: string;
    description?: string;
    /** false = halaman membungkus kartunya sendiri (mis. wizard dengan stepper di atas kartu). */
    card?: boolean;
    children: React.ReactNode;
}) {
    const path = usePage().url.split('?')[0];
    const showTabs = path === '/login' || path === '/register';

    return (
        <div className="flex min-h-svh flex-col bg-background">
            <AuthTopbar />

            <main className="flex flex-1 items-center justify-center px-4 py-4 sm:px-6">
                <section className="w-full max-w-md">
                    {showTabs && <AuthTabs />}

                    {title && (
                        <div className={showTabs ? 'mt-8' : ''}>
                            <h1 className="text-xl font-semibold">{title}</h1>
                            {description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                    )}

                    <div className={title ? 'mt-6' : showTabs ? 'mt-8' : ''}>
                        {card ? <AuthCard>{children}</AuthCard> : children}
                    </div>
                </section>
            </main>

            <footer className="px-4 py-4 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} ELQ Assessment
            </footer>
        </div>
    );
}
