import { Link, usePage } from '@inertiajs/react';
import { LogIn, UserPlus } from 'lucide-react';
import { login, register } from '@/routes';
import { cn } from '@/lib/utils';

const tabs = [
    { label: 'Masuk', href: login, icon: LogIn },
    { label: 'Daftar', href: register, icon: UserPlus },
];

/** Segmented control: dua Link Inertia ke route Fortify; aktif ditentukan URL. */
export function AuthTabs() {
    const path = usePage().url.split('?')[0];

    return (
        <nav
            aria-label="Pilih Masuk atau Daftar"
            className="grid grid-cols-2 gap-1 rounded-card bg-muted p-1 shadow-[inset_0_1px_3px_0_rgb(0_0_0/0.12)] dark:shadow-[inset_0_1px_3px_0_rgb(0_0_0/0.5)]"
        >
            {tabs.map(({ label, href, icon: Icon }) => {
                const active = path === href().url;

                return (
                    <Link
                        key={label}
                        href={href()}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            'flex h-control items-center justify-center gap-2 rounded-control border border-transparent text-sm transition-[background-color,color,box-shadow] motion-reduce:transition-none pointer-coarse:h-touch',
                            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                            active
                                ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <Icon className="size-4" aria-hidden="true" />
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}
