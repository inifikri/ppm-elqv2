import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Custom font-size token `text-caption` must not be read as a text color,
// otherwise twMerge drops sibling `text-*-foreground` classes.
const twMerge = extendTailwindMerge({
    extend: { classGroups: { 'font-size': [{ text: ['caption'] }] } },
});

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}
