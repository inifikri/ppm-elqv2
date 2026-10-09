import { useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { NavUser } from '@/components/nav-user';
import { NotificationsMenu } from '@/components/notifications-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

/** True once any scroll container (window or inner) has scrolled. */
function useScrolled() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = (event: Event) => {
            const target = event.target;
            const top =
                target instanceof Element ? target.scrollTop : window.scrollY;
            setScrolled(top > 4);
        };

        window.addEventListener('scroll', onScroll, {
            capture: true,
            passive: true,
        });

        return () => window.removeEventListener('scroll', onScroll, true);
    }, []);

    return scrolled;
}

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItem[];
}) {
    const scrolled = useScrolled();

    return (
        <header
            className={cn(
                'sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 px-4 transition-[width,height,background-color] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12',
                scrolled
                    ? 'bg-background/70 backdrop-blur-md'
                    : 'bg-transparent',
            )}
        >
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1 shrink-0" />
                <div className="min-w-0">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
                <NotificationsMenu />
                <ThemeToggle />
                <NavUser />
            </div>
        </header>
    );
}
