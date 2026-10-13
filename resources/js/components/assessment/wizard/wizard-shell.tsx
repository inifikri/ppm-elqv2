import { cn } from '@/lib/utils';
import { WizardProgress } from './wizard-progress';
import type { ReactNode } from 'react';

export type WizardShellProps = {
    currentStep: number;
    totalSteps: number;
    stepTitle?: string;
    showProgress?: boolean;
    children: ReactNode;
    actionBar?: ReactNode;
    className?: string;
};

export function WizardShell({
    currentStep,
    totalSteps,
    stepTitle,
    showProgress = true,
    children,
    actionBar,
    className,
}: WizardShellProps) {
    return (
        <div className={cn('relative mx-auto w-full max-w-2xl space-y-6 pb-28 sm:pb-24', className)}>
            {showProgress && (
                <div className="sticky top-14 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-1 pb-3 bg-background/95 backdrop-blur-md">
                    <WizardProgress
                        currentStep={currentStep}
                        totalSteps={totalSteps}
                        stepTitle={stepTitle}
                    />
                </div>
            )}

            <div className="min-w-0">
                {children}
            </div>

            {actionBar}
        </div>
    );
}
