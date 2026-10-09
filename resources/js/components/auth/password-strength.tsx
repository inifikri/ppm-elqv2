import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    passwordRules,
    passwordStrength,
    strengthLabels,
} from '@/lib/password-rules';

const bars = ['bg-destructive', 'bg-warning', 'bg-warning', 'bg-success'];

/** Bar 4 segmen + label + checklist aturan live. */
export function PasswordStrength({ value }: { value: string }) {
    const score = value ? passwordStrength(value) : 0;

    return (
        <div className="grid gap-2">
            <div className="flex items-center gap-3">
                <div
                    className="grid flex-1 grid-cols-4 gap-1"
                    aria-hidden="true"
                >
                    {bars.map((color, i) => (
                        <span
                            key={i}
                            className={cn(
                                'h-1.5 rounded-full bg-muted transition-colors duration-300 motion-reduce:transition-none',
                                i < score && color,
                            )}
                        />
                    ))}
                </div>
                <span
                    className="w-24 text-right text-xs text-muted-foreground"
                    aria-live="polite"
                >
                    {value ? strengthLabels[score] : ''}
                </span>
            </div>
            <ul className="grid gap-1 text-xs sm:grid-cols-2">
                {passwordRules.map((r) => {
                    const ok = r.test(value);

                    return (
                        <li
                            key={r.id}
                            className={cn(
                                'flex items-center gap-1.5',
                                ok ? 'text-success' : 'text-muted-foreground',
                            )}
                        >
                            {ok ? (
                                <Check
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                            ) : (
                                <X className="size-3.5" aria-hidden="true" />
                            )}
                            {r.label}
                            <span className="sr-only">
                                {ok ? ' (terpenuhi)' : ' (belum terpenuhi)'}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
