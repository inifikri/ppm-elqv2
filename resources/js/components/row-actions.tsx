import { Pencil, Trash2 } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { useState } from 'react';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { Button } from '@/components/ui/button';

export function RowActions({
    name,
    editHref,
    deleteUrl,
    deleteTitle,
    deleteDescription,
}: {
    name: string;
    editHref: InertiaLinkProps['href'];
    deleteUrl: string;
    deleteTitle: string;
    deleteDescription: string;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex justify-end">
            <Button asChild variant="ghost" size="icon">
                <Link href={editHref} aria-label={`Ubah ${name}`}>
                    <Pencil />
                </Link>
            </Button>
            <Button
                variant="ghost"
                size="icon"
                aria-label={`Hapus ${name}`}
                onClick={() => setOpen(true)}
            >
                <Trash2 />
            </Button>
            <ConfirmDeleteDialog
                title={deleteTitle}
                open={open}
                onOpenChange={setOpen}
                description={deleteDescription}
                onConfirm={() =>
                    router.delete(deleteUrl, { preserveScroll: true })
                }
            />
        </div>
    );
}
