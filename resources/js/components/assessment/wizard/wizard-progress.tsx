import { cn } from '@/lib/utils';

export type WizardProgressProps = {
    currentStep: number;
    totalSteps: number;
    stepTitle?: string;
    className?: string;
};

export function WizardProgress({
    currentStep,
    totalSteps,
    stepTitle,
    className,
}: WizardProgressProps) {
    const percent = Math.min(100, Math.max(0, Math.round((currentStep / totalSteps) * 100)));

    return (
        <div className={cn('w-full space-y-2', className)}>
            <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-primary">
                    Langkah {currentStep} dari {totalSteps}
                </span>
                {stepTitle && (
                    <span className="text-muted-foreground truncate max-w-[60%] text-right font-medium">
                        {stepTitle}
                    </span>
                )}
            </div>
            <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={currentStep}
                aria-valuemin={1}
                aria-valuemax={totalSteps}
                aria-label={`Kemajuan langkah ${currentStep} dari ${totalSteps}`}
            >
                <div
                    className="h-full bg-primary transition-all duration-300 ease-out rounded-full motion-reduce:transition-none"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
