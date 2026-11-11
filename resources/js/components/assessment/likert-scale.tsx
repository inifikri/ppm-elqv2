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
            className="flex flex-col gap-2.5 w-full"
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
                            'group relative flex min-h-[48px] sm:min-h-[52px] w-full items-center justify-between rounded-xl border p-3.5 sm:px-4 text-left transition-all',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                            isSelected
                                ? 'border-primary bg-primary/10 font-semibold text-primary shadow-xs ring-1 ring-primary/30'
                                : 'border-border/80 bg-card hover:border-primary/40 hover:bg-muted/40 text-foreground',
                            disabled && 'cursor-not-allowed opacity-60'
                        )}
                    >
                        {/* Lingkaran nomor dan label jawaban (vertikal baris berurutan) */}
                        <div className="flex items-center gap-3 sm:gap-3.5">
                            <span
                                className={cn(
                                    'flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-colors',
                                    isSelected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                )}
                            >
                                {opt.value}
                            </span>
                            <span className="text-sm sm:text-base font-medium leading-normal">
                                {opt.label}
                            </span>
                        </div>

                        {/* Indikator terpilih dan keyboard shortcut di desktop */}
                        <div className="flex items-center gap-2.5">
                            <span
                                className={cn(
                                    'hidden sm:inline-flex text-[11px] font-mono px-2 py-0.5 rounded border transition-colors',
                                    isSelected
                                        ? 'border-primary/40 text-primary bg-primary/15'
                                        : 'border-muted-foreground/20 text-muted-foreground/60 group-hover:text-foreground'
                                )}
                            >
                                [{opt.value}]
                            </span>
                            {isSelected && (
                                <div className="flex size-5 sm:size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    <Check className="size-3 sm:size-3.5 stroke-[3]" />
                                </div>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
