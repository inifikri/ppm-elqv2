import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InvitationDeliveryTarget = {
    bossEmail: string;
    subordinateEmails: string[];
    totalQuestions?: number;
};

export type QuestionsLoaderMode =
    | 'loading-questions'
    | 'sending-invitations'
    | 'submitting-assessment';

export type QuestionsLoaderProps = {
    isResuming?: boolean;
    onRetry?: () => void;
    error?: boolean;
    className?: string;
    mode?: QuestionsLoaderMode;
    invitationTarget?: InvitationDeliveryTarget;
    totalQuestions?: number;
};

export function QuestionsLoader({
    isResuming = false,
    onRetry,
    error = false,
    className,
    mode = 'loading-questions',
    invitationTarget,
}: QuestionsLoaderProps) {
    // 0..3 = ceklis email 1..4 (Proses 1: Pengiriman email), 4 = Proses 2: Menyiapkan pertanyaan
    const [progressStep, setProgressStep] = useState(0);

    useEffect(() => {
        if (mode !== 'sending-invitations') {
            return;
        }

        const timings = [600, 1400, 2200, 3000, 3800];
        const timers = timings.map((ms, index) =>
            setTimeout(() => {
                setProgressStep(index + 1);
            }, ms)
        );

        return () => {
            timers.forEach((t) => clearTimeout(t));
        };
    }, [mode]);

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

    if (mode === 'sending-invitations') {
        const emails = [
            invitationTarget?.bossEmail,
            ...(invitationTarget?.subordinateEmails ?? []),
        ].filter((e): e is string => Boolean(e && e.trim()));

        const isPreparingQuestions = progressStep >= 4;
        const progressPercent = [18, 38, 58, 78, 92, 97][Math.min(progressStep, 5)];

        return (
            <div
                role="status"
                aria-live="polite"
                aria-busy="true"
                className={cn(
                    'flex min-h-[60dvh] flex-col items-center justify-center px-4 py-12',
                    className
                )}
            >
                <div className="w-full max-w-xs space-y-5">
                    {/* Indikator 2 Proses + Loading Spinner Kecil + Loading Bar */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium">
                            <span className="inline-flex items-center gap-2 text-foreground">
                                <progress
                                    aria-label={
                                        isPreparingQuestions
                                            ? 'Menyiapkan pertanyaan asesmen'
                                            : 'Mengirim email undangan'
                                    }
                                    className="loading-spinner loading-spinner-xs shrink-0"
                                />
                                <span>
                                    {isPreparingQuestions
                                        ? 'Menyiapkan pertanyaan asesmen…'
                                        : 'Mengirim email undangan…'}
                                </span>
                            </span>
                            <span className="tabular-nums text-muted-foreground">
                                {progressPercent}%
                            </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Daftar Email Minimalis (Icon Ceklis + Nama Email) */}
                    {emails.length > 0 && (
                        <div className="space-y-2 pt-1">
                            {emails.map((email, idx) => {
                                const isChecked = progressStep > idx;

                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            'flex items-center gap-2.5 text-xs transition-opacity duration-300',
                                            isChecked
                                                ? 'text-foreground'
                                                : 'text-muted-foreground/45'
                                        )}
                                    >
                                        <CheckCircle2
                                            className={cn(
                                                'size-4 shrink-0 transition-colors duration-300',
                                                isChecked
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-muted-foreground/30'
                                            )}
                                        />
                                        <span className="truncate">{email}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const isSubmittingMode = mode === 'submitting-assessment';

    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className={cn(
                'flex min-h-[55dvh] flex-col items-center justify-center px-4 py-12 text-center',
                className
            )}
        >
            <div className="w-full max-w-xs space-y-4">
                <div className="flex justify-center">
                    <progress
                        aria-label={
                            isSubmittingMode
                                ? 'Menyimpan hasil asesmen'
                                : 'Memuat lembar kuesioner'
                        }
                        className="loading-spinner"
                    />
                </div>

                <div className="space-y-1">
                    <h2 className="text-sm font-medium text-foreground">
                        {isSubmittingMode
                            ? 'Menyimpan hasil asesmen…'
                            : isResuming
                            ? 'Memuat jawaban Anda sebelumnya…'
                            : 'Menyiapkan pertanyaan asesmen…'}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Mohon tunggu sebentar
                    </p>
                </div>
            </div>
        </div>
    );
}

