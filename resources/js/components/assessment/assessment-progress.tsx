import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, AlertCircle, RefreshCw, LayoutGrid } from 'lucide-react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type AssessmentProgressProps = {
    currentIndex: number;
    totalQuestions: number;
    answeredCount: number;
    autosaveStatus: AutosaveStatus;
    onRetryAutosave?: () => void;
    onOpenNavigator?: () => void;
};

export function AssessmentProgress({
    currentIndex,
    totalQuestions,
    answeredCount,
    autosaveStatus,
    onRetryAutosave,
    onOpenNavigator,
}: AssessmentProgressProps) {
    const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

    return (
        <div className="sticky top-14 z-30 -mx-4 bg-background/95 backdrop-blur-md px-4 py-2 sm:-mx-6 sm:px-6">
            <div className="flex items-center justify-between gap-3">
                {/* Left: Question counter and autosave badge */}
                <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-foreground">
                        Pertanyaan {currentIndex + 1}
                        <span className="text-xs font-normal text-muted-foreground"> dari {totalQuestions}</span>
                    </span>

                    {/* Autosave Status */}
                    <div className="flex items-center text-xs">
                        {autosaveStatus === 'saving' && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <Loader2 className="size-3 animate-spin text-primary" />
                                <span className="hidden sm:inline">Menyimpan...</span>
                            </span>
                        )}
                        {autosaveStatus === 'saved' && (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-3" />
                                <span className="hidden sm:inline">Tersimpan</span>
                            </span>
                        )}
                        {autosaveStatus === 'error' && (
                            <button
                                type="button"
                                onClick={onRetryAutosave}
                                className="flex items-center gap-1 text-destructive hover:underline"
                                title="Klik untuk mencoba simpan kembali"
                            >
                                <AlertCircle className="size-3" />
                                <span>Gagal simpan</span>
                                <RefreshCw className="size-2.5 ml-0.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Counter text or Interactive Navigator Button */}
                {onOpenNavigator ? (
                    <button
                        type="button"
                        onClick={onOpenNavigator}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                        title="Lihat daftar pertanyaan"
                    >
                        <LayoutGrid className="size-3 text-primary" />
                        <span>Daftar Soal</span>
                        <span className="text-muted-foreground">({answeredCount}/{totalQuestions})</span>
                    </button>
                ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                        {answeredCount} dari {totalQuestions} terjawab
                    </span>
                )}
            </div>

            {/* Micro progress bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className={cn(
                        'h-full transition-all duration-300 rounded-full',
                        answeredCount === totalQuestions ? 'bg-emerald-600' : 'bg-primary'
                    )}
                    style={{ width: `${progressPercent}%` }}
                    role="progressbar"
                    aria-valuenow={answeredCount}
                    aria-valuemin={0}
                    aria-valuemax={totalQuestions}
                    aria-label="Kemajuan pengisian kuesioner"
                />
            </div>
        </div>
    );
}
