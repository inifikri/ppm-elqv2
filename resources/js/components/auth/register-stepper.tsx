import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = ['Data diri', 'Akun', 'Selesai'];

/** Stepper 3 segmen: aktif = aksen, selesai = centang. */
export function RegisterStepper({ current }: { current: 1 | 2 | 3 }) {
    return (
        <div>
            <p className="mb-3 text-xs text-muted-foreground">
                Langkah {current} dari {steps.length}
            </p>
            <ol className="grid grid-cols-3 gap-2">
                {steps.map((label, i) => {
                    const n = i + 1;
                    const done = n < current;
                    const active = n === current;

                    return (
                        <li
                            key={label}
                            aria-current={active ? 'step' : undefined}
                            className="grid gap-2"
                        >
                            <span
                                className={cn(
                                    'h-1.5 rounded-full bg-muted transition-colors duration-300 motion-reduce:transition-none',
                                    (done || active) && 'bg-primary',
                                )}
                            />
                            <span
                                className={cn(
                                    'flex items-center gap-1.5 text-xs',
                                    active
                                        ? 'font-medium text-primary'
                                        : done
                                          ? 'text-foreground'
                                          : 'text-muted-foreground',
                                )}
                            >
                                {done ? (
                                    <Check
                                        className="size-3.5 text-primary"
                                        aria-hidden="true"
                                    />
                                ) : null}
                                {label}
                                {done && (
                                    <span className="sr-only"> (selesai)</span>
                                )}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
