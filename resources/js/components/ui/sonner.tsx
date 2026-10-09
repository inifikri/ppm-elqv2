import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="top-center"
            visibleToasts={3}
            icons={{
                success: <CircleCheck />,
                info: <Info />,
                warning: <TriangleAlert />,
                error: <CircleX />,
            }}
            toastOptions={{
                classNames: {
                    toast: '!rounded-card !border !shadow-overlay !text-sm',
                    success:
                        '!border-success/30 !bg-success-subtle !text-success-subtle-foreground',
                    info: '!border-info/30 !bg-info-subtle !text-info-subtle-foreground',
                    warning:
                        '!border-warning/30 !bg-warning-subtle !text-warning-subtle-foreground',
                    error: '!border-destructive/30 !bg-destructive-subtle !text-destructive-subtle-foreground',
                },
            }}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                    '--border-radius': 'var(--radius-card)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
