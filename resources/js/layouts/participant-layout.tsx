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
import { TopbarShell } from '@/components/layout/topbar-shell';
import { useInitials } from '@/hooks/use-initials';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

export default function ParticipantLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { auth } = usePage().props;
    const getInitials = useInitials();

    return (
        <div className="flex min-h-[100dvh] flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
            >
                Skip to content
            </a>

            <TopbarShell
                maxWidth="2xl"
                left={
                    <Link href={dashboard()} className="flex items-center">
                        <AppLogo />
                    </Link>
                }
                right={
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <ThemeToggle />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full size-8 sm:size-9"
                                    aria-label="Menu pengguna"
                                >
                                    <Avatar className="size-7 sm:size-8">
                                        <AvatarImage
                                            src={auth.user?.avatar ?? undefined}
                                            alt=""
                                        />
                                        <AvatarFallback className="text-xs">
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
                }
            />

            <main
                id="main-content"
                className="mx-auto w-full max-w-2xl min-w-0 flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-6"
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
