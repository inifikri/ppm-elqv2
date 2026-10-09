import { Link } from '@inertiajs/react';
import { AuthBrandMark } from '@/components/auth/auth-brand-mark';
import { ThemeToggle } from '@/components/theme-toggle';
import { login } from '@/routes';

/** Tanpa border; menyatu dengan latar halaman. */
export function AuthTopbar() {
    return (
        <header className="flex items-center justify-between px-4 py-3 sm:px-6">
            <Link
                href={login()}
                aria-label="ELQ Assessment 360"
                className="rounded-control focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
                <AuthBrandMark />
            </Link>
            <ThemeToggle />
        </header>
    );
}
