import { Link, usePage } from '@inertiajs/react';
import { AppFooter } from '@/components/app-footer';
import AppLogo from '@/components/app-logo';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

// ponytail: only existing routes. Add Penilai/Self Assessment/Hasil/Profil as phases 4-6 ship their routes.
const navItems = [{ title: 'Dashboard', href: dashboard() }];

export default function ParticipantLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { auth } = usePage().props;
    const getInitials = useInitials();
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
            >
                Skip to content
            </a>
            <header className="border-b bg-surface">
                <div className="mx-auto flex h-14 w-full max-w-[1536px] items-center gap-4 px-4 md:px-6">
                    <Link href={dashboard()} className="flex items-center">
                        <AppLogo />
                    </Link>
                    <nav aria-label="Utama" className="flex flex-1 gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.title}
                                href={item.href}
                                aria-current={
                                    isCurrentUrl(item.href) ? 'page' : undefined
                                }
                                className={cn(
                                    'inline-flex h-control items-center rounded-control px-3 text-sm font-medium text-text-secondary hover:bg-accent hover:text-accent-foreground pointer-coarse:h-11 pointer-coarse:h-touch',
                                    isCurrentUrl(item.href) &&
                                        'bg-accent text-accent-foreground',
                                )}
                            >
                                {item.title}
                            </Link>
                        ))}
                    </nav>
                    <ThemeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                                aria-label="Menu pengguna"
                            >
                                <Avatar className="size-8">
                                    <AvatarImage
                                        src={auth.user?.avatar ?? undefined}
                                        alt=""
                                    />
                                    <AvatarFallback>
                                        {getInitials(auth.user?.name ?? '')}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            {auth.user && <UserMenuContent user={auth.user} />}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <main
                id="main-content"
                className="mx-auto w-full max-w-[1536px] min-w-0 flex-1 space-y-4 p-4 md:p-6"
            >
                {breadcrumbs.length > 0 && (
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                )}
                {children}
            </main>
            <AppFooter />
        </div>
    );
}
