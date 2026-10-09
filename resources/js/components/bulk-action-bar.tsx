import { X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type BulkAction = {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    destructive?: boolean;
    /** When set, the action runs only after the user confirms. */
    confirm?: { title: string; description: string };
};

/** Floating bottom-center bar shown while rows are selected. Pass only permitted actions. */
export function BulkActionBar({
    selectedCount,
    actions,
    onClear,
}: {
    selectedCount: number;
    actions: BulkAction[];
    onClear: () => void;
}) {
    const open = selectedCount > 0;
    const [shownCount, setShownCount] = useState(selectedCount);
    const [pending, setPending] = useState<BulkAction | null>(null);

    // Keep the last count visible while the exit animation runs.
    if (open && selectedCount !== shownCount) {
        setShownCount(selectedCount);
    }

    useEffect(() => {
        if (!open || pending) {
            return;
        }

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClear();
            }
        };
        document.addEventListener('keydown', onKeyDown);

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, pending, onClear]);

    return (
        <>
            <div
                role="region"
                aria-label="Aksi massal"
                inert={!open}
                className={cn(
                    'fixed bottom-6 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-bar border border-slate-800 bg-slate-900 p-1.5 pl-3 text-white shadow-sm transition-[opacity,translate,visibility] duration-200 dark:border-slate-600',
                    open
                        ? 'visible translate-y-0 opacity-100'
                        : 'invisible translate-y-4 opacity-0',
                )}
            >
                <span
                    aria-live="polite"
                    className="mr-2 text-sm font-medium whitespace-nowrap"
                >
                    {shownCount} dipilih
                </span>
                {actions.map((action) => (
                    <Button
                        key={action.label}
                        icon={action.icon}
                        size="sm"
                        variant={action.destructive ? 'destructive' : 'ghost'}
                        className={cn(
                            !action.destructive &&
                                'text-white hover:bg-white/10 hover:text-white',
                        )}
                        onClick={() =>
                            action.confirm
                                ? setPending(action)
                                : action.onClick()
                        }
                    >
                        {action.label}
                    </Button>
                ))}
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Batal pilih"
                    title="Batal pilih (Esc)"
                    className="text-white hover:bg-white/10 hover:text-white"
                    onClick={onClear}
                >
                    <X />
                </Button>
            </div>
            <ConfirmDeleteDialog
                title={pending?.confirm?.title ?? ''}
                description={pending?.confirm?.description ?? ''}
                confirmLabel={pending?.label}
                open={pending !== null}
                onOpenChange={(o) => !o && setPending(null)}
                onConfirm={() => pending?.onClick()}
            />
        </>
    );
}
