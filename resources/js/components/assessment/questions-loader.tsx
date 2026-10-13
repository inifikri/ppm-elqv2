import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type QuestionsLoaderProps = {
    isResuming?: boolean;
    onRetry?: () => void;
    error?: boolean;
    className?: string;
};

export function QuestionsLoader({
    isResuming = false,
    onRetry,
    error = false,
    className,
}: QuestionsLoaderProps) {
    const [isSlow, setIsSlow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsSlow(true);
        }, 3200);

        return () => clearTimeout(timer);
    }, []);

    if (error) {
        return (
            <div
                role="alert"
                className={cn(
                    'flex min-h-[50dvh] flex-col items-center justify-center p-6 text-center space-y-4',
                    className
                )}
            >
                <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <RefreshCw className="size-6" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-base font-semibold text-foreground">
                        Terjadi Kendala Memuat Pertanyaan
                    </h2>
                    <p className="text-xs text-muted-foreground max-w-sm">
                        Koneksi terganggu saat mengambil butir kuesioner. Silakan coba lagi.
                    </p>
                </div>
                {onRetry && (
                    <Button
                        type="button"
                        onClick={onRetry}
                        variant="outline"
                        size="sm"
                        className="gap-2 text-xs"
                    >
                        <RefreshCw className="size-3.5" />
                        <span>Coba lagi</span>
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className={cn(
                'flex min-h-[50dvh] flex-col items-center justify-center p-6 text-center space-y-6',
                className
            )}
        >
            {/* CSS-only pulsing ring loader */}
            <div className="relative flex size-14 items-center justify-center">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/20 opacity-75 motion-reduce:hidden" />
                <div className="relative inline-flex size-10 items-center justify-center rounded-full border-2 border-primary/30 border-t-primary animate-spin motion-reduce:animate-none">
                    <div className="size-2 rounded-full bg-primary" />
                </div>
            </div>

            {/* Informative text */}
            <div className="space-y-1.5 max-w-sm">
                <h2 className="text-sm sm:text-base font-semibold text-foreground">
                    Sebentar lagi, mohon tunggu…
                </h2>
                <p className="text-xs text-muted-foreground">
                    {isResuming
                        ? 'Memuat jawaban Anda sebelumnya'
                        : 'Menyiapkan pertanyaan untuk Anda'}
                </p>
                {isSlow && (
                    <p className="text-[11px] text-muted-foreground/80 italic pt-1 animate-in fade-in duration-300">
                        Masih memproses, mohon jangan tutup halaman…
                    </p>
                )}
            </div>

            {/* Micro skeleton placeholder preview */}
            <div className="w-full max-w-sm space-y-2.5 pt-4 opacity-50 pointer-events-none">
                <div className="h-4 w-1/3 bg-muted rounded-md animate-pulse motion-reduce:animate-none" />
                <div className="h-10 w-full bg-muted rounded-xl animate-pulse motion-reduce:animate-none" />
                <div className="h-10 w-full bg-muted/60 rounded-xl animate-pulse motion-reduce:animate-none" />
            </div>
        </div>
    );
}
