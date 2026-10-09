import { useId } from 'react';
import type { ReactNode } from 'react';

/** Titled form section: one column on mobile, two on desktop. Wide fields use `sm:col-span-2`. */
export function FormCard({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    const titleId = useId();

    return (
        <section
            aria-labelledby={titleId}
            className="rounded-card border bg-card"
        >
            <header className="space-y-0.5 border-b p-4">
                <h2 id={titleId} className="text-sm font-semibold">
                    {title}
                </h2>
                {description && (
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                )}
            </header>
            <div className="grid gap-4 p-4 sm:grid-cols-2">{children}</div>
        </section>
    );
}
