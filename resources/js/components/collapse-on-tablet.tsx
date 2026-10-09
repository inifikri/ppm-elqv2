import { useEffect } from 'react';
import { useSidebar } from '@/components/ui/sidebar';

/** Tablet (768-1023px): start with icon-only sidebar. Mobile uses drawer. */
export function CollapseOnTablet() {
    const { setOpen } = useSidebar();

    useEffect(() => {
        if (
            window.matchMedia('(min-width: 768px) and (max-width: 1023px)')
                .matches
        ) {
            setOpen(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
    }, []);

    return null;
}
