import type { ReactNode } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

/**
 * Right-side drawer on top of Radix Dialog: role=dialog, aria-modal, focus trap,
 * Esc to close, focus returns to trigger, body scroll lock. Title labels the dialog.
 */
export function Drawer({
    open,
    onOpenChange,
    title,
    description,
    footer,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    footer?: ReactNode;
    children: ReactNode;
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[calc(100%-2rem)] gap-0 rounded-l-modal sm:max-w-[400px]"
            >
                <SheetHeader className="border-b pr-12">
                    <SheetTitle className="text-sm">{title}</SheetTitle>
                    {description ? (
                        <SheetDescription className="text-xs">
                            {description}
                        </SheetDescription>
                    ) : (
                        <SheetDescription className="sr-only">
                            {title}
                        </SheetDescription>
                    )}
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4">{children}</div>
                {footer && (
                    <SheetFooter className="flex-row justify-end border-t">
                        {footer}
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}
