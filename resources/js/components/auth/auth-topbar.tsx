import { ThemeToggle } from '@/components/theme-toggle';

/** Topbar dengan ThemeToggle di sisi kanan; logo berpindah ke posisi tengah halaman. */
export function AuthTopbar() {
    return (
        <header className="flex items-center justify-end px-4 py-3 sm:px-6">
            <ThemeToggle />
        </header>
    );
}

