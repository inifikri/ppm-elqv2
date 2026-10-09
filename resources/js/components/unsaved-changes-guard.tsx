import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * While `dirty`, intercepts GET navigations (Kembali, Batal, sidebar, breadcrumb)
 * and tab close, asking for confirmation first. Form submissions (non-GET) pass.
 */
export function UnsavedChangesGuard({ dirty }: { dirty: boolean }) {
    const [target, setTarget] = useState<string | null>(null);
    const allowed = useRef(false);

    useEffect(() => {
        if (!dirty) {
            return;
        }

        const offBefore = router.on('before', (event) => {
            const { visit } = event.detail;

            if (allowed.current || visit.method !== 'get') {
                return true;
            }

            setTarget(visit.url.href);

            return false;
        });
        const warn = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener('beforeunload', warn);

        return () => {
            offBefore();
            window.removeEventListener('beforeunload', warn);
        };
    }, [dirty]);

    return (
        <AlertDialog
            open={target !== null}
            onOpenChange={(open) => !open && setTarget(null)}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tinggalkan halaman?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Perubahan yang belum disimpan akan hilang.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Tetap di sini</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            allowed.current = true;
                            router.visit(target ?? '');
                        }}
                    >
                        Tinggalkan
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
