import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

/** Auto-dismiss per severity (ms): info/success 4s, warning 6s, error 8s. */
const DURATION: Record<FlashToast['type'], number> = {
    success: 4000,
    info: 4000,
    warning: 6000,
    error: 8000,
};

export function useFlashToast(): void {
    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const data = flash?.toast as FlashToast | undefined;

            if (!data) {
                return;
            }

            toast[data.type](data.message, { duration: DURATION[data.type] });
        });
    }, []);
}
