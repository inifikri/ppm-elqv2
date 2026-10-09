import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Label + control + hint + inline error. The control must use `id`
 * and may set `aria-describedby={`${id}-error`}` / `aria-invalid`.
 */
export function FormField({
    id,
    label,
    description,
    error,
    required,
    className,
    children,
}: {
    id: string;
    label: string;
    /** Short hint under the control; replaced by the error when present. */
    description?: string;
    error?: string;
    required?: boolean;
    /** Grid placement inside FormCard, e.g. `sm:col-span-2`. */
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('grid content-start gap-2', className)}>
            <Label htmlFor={id}>
                {label}
                {required && (
                    <span aria-hidden="true" className="text-destructive">
                        *
                    </span>
                )}
            </Label>
            {children}
            {description && !error && (
                <p
                    id={`${id}-description`}
                    className="text-xs text-muted-foreground"
                >
                    {description}
                </p>
            )}
            <InputError id={`${id}-error`} message={error} />
        </div>
    );
}
