import { type LucideIcon } from 'lucide-react';
import type { InertiaLinkProps } from '@inertiajs/react';

export type BreadcrumbItem = {
    title: string;
    href?: NonNullable<InertiaLinkProps['href']>;
};

export type NavBadge = {
    count: number;
    /** Noun used in the aria-label, e.g. "pertanyaan". */
    label: string;
};

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    badge?: NavBadge | null;
};

export type NavGroup = {
    label: string;
    items: (NavItem & {
        /** false = also active on nested URLs (e.g. /admin/users/1/edit). */
        exact?: boolean;
    })[];
};
