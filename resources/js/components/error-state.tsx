import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorState({
    title = 'Something went wrong',
    description = "We couldn't load the data.",
    onRetry,
}: {
    title?: string;
    description?: string;
    onRetry?: () => void;
}) {
    return (
        <div
            role="alert"
            className="flex flex-col items-center gap-3 px-6 py-12 text-center"
        >
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive-subtle text-destructive-subtle-foreground">
                <TriangleAlert className="size-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
                <h3 className="text-sm font-medium">{title}</h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                    {description}
                </p>
            </div>
            {onRetry && (
                <Button variant="outline" onClick={onRetry}>
                    Try Again
                </Button>
            )}
        </div>
    );
}
