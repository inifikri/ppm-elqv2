import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/**
 * Debounced server-side filter: pushes `params` to `url` as query and keeps
 * `loading` true while an Inertia visit is in flight.
 */
export function useLiveFilters(
    url: string,
    applied: Record<string, string | number | null>,
    only: string[],
) {
    const [values, setValues] = useState(applied);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (JSON.stringify(values) === JSON.stringify(applied)) {
            return;
        }

        const timer = setTimeout(
            () =>
                router.get(
                    url,
                    Object.fromEntries(
                        Object.entries(values).filter(
                            ([, v]) => v !== '' && v !== null,
                        ),
                    ),
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                        only,
                    },
                ),
            300,
        );

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values]);

    useEffect(() => {
        const offStart = router.on('start', () => setLoading(true));
        const offFinish = router.on('finish', () => setLoading(false));

        return () => {
            offStart();
            offFinish();
        };
    }, []);

    return {
        values,
        loading,
        set: (key: string, value: string | number | null) =>
            setValues((prev) => ({ ...prev, [key]: value })),
    };
}
