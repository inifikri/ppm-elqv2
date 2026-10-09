import { AppContent } from '@/components/app-content';
import { AppFooter } from '@/components/app-footer';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
            >
                Skip to content
            </a>
            <AppSidebar />
            <AppContent
                id="main-content"
                variant="sidebar"
                className="min-w-0 overflow-x-clip"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
                <AppFooter />
            </AppContent>
        </AppShell>
    );
}
