import { Link } from '@inertiajs/react';
import { AuthBrandMark } from '@/components/auth/auth-brand-mark';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthTopbar } from '@/components/auth/auth-topbar';
import { login } from '@/routes';

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
    return (
        <div className="flex min-h-svh flex-col bg-background">
            <AuthTopbar />

            <main className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6">
                <section className="w-full max-w-md space-y-6">
                    {/* Logo PPM & Judul Website di Posisi Tengah */}
                    <div className="flex flex-col items-center justify-center text-center">
                        <Link
                            href={login()}
                            aria-label="ELQ Assessment 360"
                            className="rounded-xl p-1 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                            <AuthBrandMark centered />
                        </Link>
                    </div>

                    {title && (
                        <div className="text-center">
                            <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
                            {description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        {card ? <AuthCard>{children}</AuthCard> : children}
                    </div>
                </section>
            </main>

            <footer className="px-4 py-4 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} ELQ Assessment 360° &bull; PPM Manajemen
            </footer>
        </div>
    );
}

