import type { ReactNode } from 'react';

export function Section({
    id,
    title,
    children,
}: {
    id: string;
    title: string;
    children: ReactNode;
}) {
    return (
        <section aria-labelledby={id} className="space-y-4">
            <h2 id={id} className="text-xl font-semibold">
                {title}
            </h2>
            {children}
        </section>
    );
}

export function Row({ children }: { children: ReactNode }) {
    return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}
