import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { RotateCcw, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Uniform form actions: right-aligned on desktop, stacked full-width on mobile (Simpan first). */
export function FormFooter({
    processing,
    cancelHref,
    onReset,
    canReset = true,
    submitTestId,
}: {
    processing: boolean;
    cancelHref?: InertiaLinkProps['href'];
    /** Show a Reset button (edit forms). */
    onReset?: () => void;
    canReset?: boolean;
    submitTestId?: string;
}) {
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end [&>*]:max-sm:w-full">
            <Button
                type="submit"
                icon={Save}
                loading={processing}
                data-test={submitTestId}
            >
                Simpan
            </Button>
            {onReset && (
                <Button
                    type="button"
                    variant="outline"
                    icon={RotateCcw}
                    disabled={!canReset || processing}
                    onClick={onReset}
                >
                    Reset
                </Button>
            )}
            {cancelHref && (
                <Button asChild variant="outline" icon={X}>
                    <Link href={cancelHref}>Batal</Link>
                </Button>
            )}
        </div>
    );
}
