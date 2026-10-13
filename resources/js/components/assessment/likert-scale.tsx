import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export const LIKERT_OPTIONS = [
    { value: 1, label: 'Sangat Tidak Setuju' },
    { value: 2, label: 'Tidak Setuju' },
    { value: 3, label: 'Agak Tidak Setuju' },
    { value: 4, label: 'Agak Setuju' },
    { value: 5, label: 'Setuju' },
    { value: 6, label: 'Sangat Setuju' },
] as const;

export type LikertScaleProps = {
    value?: number | null;
    onChange: (value: number) => void;
    disabled?: boolean;
    name?: string;
};

export function LikertScale({
    value,
    onChange,
    disabled = false,
    name = 'likert-option',
}: LikertScaleProps) {
    return (
        <div
            role="radiogroup"
            aria-label="Skala persetujuan 1 sampai 6"
            className="flex flex-col gap-2.5"
        >
            {LIKERT_OPTIONS.map((opt) => {
                const isSelected = value === opt.value;
                const optId = `${name}-${opt.value}`;

                return (
                    <button
                        key={opt.value}
                        id={optId}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={disabled}
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            'group relative flex min-h-[48px] w-full items-center justify-between rounded-xl border p-3.5 text-left text-sm transition-all sm:px-4',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                            isSelected
                                ? 'border-primary bg-primary/10 font-semibold text-primary shadow-xs'
                                : 'border-border/80 bg-card hover:border-border hover:bg-muted/40 text-foreground',
                            disabled && 'cursor-not-allowed opacity-60'
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <span
                                className={cn(
                                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                                    isSelected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                                )}
                            >
                                {opt.value}
                            </span>
                            <span className="text-sm font-medium leading-normal">
                                {opt.label}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Keyboard hint badge on desktop */}
                            <span
                                className={cn(
                                    'hidden text-[11px] font-mono px-1.5 py-0.5 rounded border sm:inline-block',
                                    isSelected
                                        ? 'border-primary/40 text-primary bg-primary/10'
                                        : 'border-muted-foreground/20 text-muted-foreground/60'
                                )}
                            >
                                {opt.value}
                            </span>
                            {isSelected && (
                                <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    <Check className="size-3 stroke-[3]" />
                                </div>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
