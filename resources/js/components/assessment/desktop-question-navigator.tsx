import { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
    Compass,
    CheckCircle2,
    Send,
    ArrowUpRight,
    HelpCircle,
    Check,
} from 'lucide-react';
import type { AssessmentQuestionItem } from '@/types/assessment';

const SCORE_LABELS: Record<number, string> = {
    1: 'Sangat Tidak Setuju',
    2: 'Tidak Setuju',
    3: 'Agak Tidak Setuju',
    4: 'Agak Setuju',
    5: 'Setuju',
    6: 'Sangat Setuju',
};

export type DesktopQuestionNavigatorProps = {
    questions: AssessmentQuestionItem[];
    answers: Record<string, number>;
    currentIndex: number;
    onSelectQuestion: (index: number) => void;
    onSubmitClick: () => void;
    submitLabel?: string;
    isSubmitting?: boolean;
};

export function DesktopQuestionNavigator({
    questions,
    answers,
    currentIndex,
    onSelectQuestion,
    onSubmitClick,
    submitLabel = 'Kirim Self-Assessment',
    isSubmitting = false,
}: DesktopQuestionNavigatorProps) {
    const total = questions.length;
    const answeredCount = useMemo(
        () => questions.filter((q) => answers[q.id] !== undefined).length,
        [questions, answers]
    );
    const isAllAnswered = answeredCount === total && total > 0;
    const progressPercent = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
    const firstUnansweredIndex = useMemo(
        () => questions.findIndex((q) => answers[q.id] === undefined),
        [questions, answers]
    );

    const currentQuestion = questions[currentIndex];
    const currentScore = currentQuestion ? answers[currentQuestion.id] : undefined;

    return (
        <Card className="sticky top-20 border border-border/80 bg-card/90 shadow-sm backdrop-blur-sm transition-all duration-200">
            <CardHeader className="p-4 pb-3 space-y-3 border-b border-border/60">
                {/* Header Title & Progress Counter */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Compass className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground tracking-tight">
                                Navigasi Soal
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                                39 butir kuesioner ELQ
                            </p>
                        </div>
                    </div>

                    <Badge
                        variant="secondary"
                        className={cn(
                            'text-xs font-semibold px-2 py-0.5 border transition-colors',
                            isAllAnswered
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-primary/10 text-primary border-primary/20'
                        )}
                    >
                        {answeredCount}/{total} Selesai
                    </Badge>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Kemajuan</span>
                        <span className="font-semibold text-foreground">{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-300',
                                isAllAnswered ? 'bg-emerald-600' : 'bg-primary'
                            )}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Current Active Question Context */}
                {currentQuestion && (
                    <div className="rounded-lg bg-muted/50 p-2.5 text-xs space-y-1 border border-border/40">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">
                                Pertanyaan #{currentIndex + 1}
                            </span>
                            {currentScore !== undefined ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                                    <Check className="size-3" />
                                    Skor {currentScore} ({SCORE_LABELS[currentScore] || 'Terjawab'})
                                </span>
                            ) : (
                                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                    Belum Terisi
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {currentQuestion.dimension_name}
                            {currentQuestion.sub_dimension_name && ` • ${currentQuestion.sub_dimension_name}`}
                        </p>
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-4 space-y-4">
                {/* 39 Questions Grid */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                            Peta Nomor Soal
                        </span>
                        {!isAllAnswered && firstUnansweredIndex !== -1 && (
                            <button
                                type="button"
                                onClick={() => onSelectQuestion(firstUnansweredIndex)}
                                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                                title="Lompat ke pertanyaan yang belum dijawab"
                            >
                                <span>Lompat ke belum terisi (#{firstUnansweredIndex + 1})</span>
                                <ArrowUpRight className="size-3" />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                        {questions.map((q, idx) => {
                            const isAnswered = answers[q.id] !== undefined;
                            const isCurrent = idx === currentIndex;
                            const score = answers[q.id];

                            return (
                                <Tooltip key={q.id}>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            onClick={() => onSelectQuestion(idx)}
                                            aria-label={`Soal nomor ${idx + 1}, ${isAnswered ? `terjawab nilai ${score}` : 'belum dijawab'}`}
                                            className={cn(
                                                'relative flex h-9 w-full items-center justify-center rounded-lg border text-xs font-semibold select-none outline-none transition-colors',
                                                'focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0',
                                                // Active / Current Question: Single crisp border, no double ring or offset
                                                isCurrent
                                                    ? isAnswered
                                                        ? 'border-primary bg-primary text-primary-foreground font-bold shadow-xs'
                                                        : 'border-primary bg-primary/15 text-primary font-bold shadow-xs'
                                                    : isAnswered
                                                      ? 'border-transparent bg-primary/90 text-primary-foreground hover:bg-primary'
                                                      : 'border-border/70 bg-card text-muted-foreground hover:border-primary hover:bg-muted/50 hover:text-foreground'
                                            )}
                                        >
                                            <span>{idx + 1}</span>
                                            {/* Micro indicator for active state */}
                                            {isCurrent && (
                                                <span
                                                    className={cn(
                                                        'absolute bottom-1 h-0.5 w-3.5 rounded-full',
                                                        isAnswered ? 'bg-primary-foreground' : 'bg-primary'
                                                    )}
                                                    aria-hidden="true"
                                                />
                                            )}
                                            {/* Dot for answered when not current */}
                                            {isAnswered && !isCurrent && (
                                                <span
                                                    className="absolute top-1 right-1 size-1.5 rounded-full bg-white/80"
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs text-xs p-2 space-y-1">
                                        <p className="font-semibold">
                                            #{idx + 1}. {q.text}
                                        </p>
                                        <p className="text-[11px] opacity-90">
                                            {isAnswered
                                                ? `✓ Terjawab: Skor ${score} (${SCORE_LABELS[score] || ''})`
                                                : 'Belum dijawab (Klik untuk mengisi)'}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                </div>

                {/* Legend Guide */}
                <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-primary" />
                        <span>Terjawab</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full border-2 border-primary bg-primary/20" />
                        <span>Sedang Aktif</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full border border-border/80 bg-card" />
                        <span>Belum Terisi</span>
                    </div>
                </div>

                {/* Action CTA */}
                <div className="pt-1">
                    {isAllAnswered ? (
                        <Button
                            type="button"
                            size="default"
                            onClick={onSubmitClick}
                            disabled={isSubmitting}
                            className="w-full gap-2 font-semibold shadow-xs transition-transform active:scale-[0.98]"
                        >
                            <Send className="size-4" />
                            <span>{submitLabel}</span>
                        </Button>
                    ) : (
                        <div className="rounded-lg bg-muted/40 p-2.5 text-center text-xs text-muted-foreground border border-dashed border-border">
                            <span>
                                Sisa <strong className="text-foreground">{total - answeredCount}</strong> pertanyaan lagi untuk diselesaikan
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
