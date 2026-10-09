import { usePage } from '@inertiajs/react';

export function AppFooter() {
    const { name } = usePage().props;

    return (
        <footer className="mt-auto px-4 py-4 text-xs text-text-muted md:px-6">
            &copy; {new Date().getFullYear()} {name}
        </footer>
    );
}
