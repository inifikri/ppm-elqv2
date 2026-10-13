import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export type WizardActionBarProps = {
    primaryLabel: string;
    onPrimaryClick: () => void;
    primaryDisabled?: boolean;
    primaryLoading?: boolean;
    primaryIcon?: ReactNode;
    secondaryLabel?: string;
    onSecondaryClick?: () => void;
    secondaryDisabled?: boolean;
    secondaryIcon?: ReactNode;
    className?: string;
};

export function WizardActionBar({
    primaryLabel,
    onPrimaryClick,
    primaryDisabled = false,
    primaryLoading = false,
    primaryIcon,
    secondaryLabel,
    onSecondaryClick,
    secondaryDisabled = false,
    secondaryIcon,
    className,
}: WizardActionBarProps) {
    return (
        <div
            className={cn(
                'fixed bottom-0 left-0 right-0 z-35 bg-background/95 backdrop-blur-md',
                'pb-[max(1rem,env(safe-area-inset-bottom,1rem))] pt-3 px-4 sm:px-6',
                className
            )}
        >
            <div className="mx-auto flex max-w-2xl flex-col sm:flex-row-reverse sm:items-center sm:justify-between gap-2.5">
                <Button
                    type="button"
                    size="lg"
                    disabled={primaryDisabled}
                    loading={primaryLoading}
                    onClick={onPrimaryClick}
                    className="w-full sm:w-auto sm:min-w-[160px]"
                >
                    {!primaryLoading && primaryIcon}
                    <span>{primaryLoading ? 'Memproses...' : primaryLabel}</span>
                </Button>

                {secondaryLabel && onSecondaryClick && (
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        disabled={secondaryDisabled || primaryLoading}
                        onClick={onSecondaryClick}
                        className="w-full sm:w-auto"
                    >
                        {secondaryIcon}
                        <span>{secondaryLabel}</span>
                    </Button>
                )}
            </div>
        </div>
    );
}
