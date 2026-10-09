import { ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

/** Explicit link to the parent index page; dirty-form confirm is handled by UnsavedChangesGuard. */
export function BackButton({ href }: { href: InertiaLinkProps['href'] }) {
    return (
        <Button
            asChild
            icon={ArrowLeft}
            variant="ghost"
            size="sm"
            className="-ml-2 self-start"
        >
            <Link href={href}>Kembali</Link>
        </Button>
    );
}
