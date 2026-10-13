import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Send, ArrowRight } from 'lucide-react';
import type { AssessmentQuestionItem } from '@/types/assessment';

export type QuestionNavigatorProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    questions: AssessmentQuestionItem[];
    answers: Record<string, number>;
    currentIndex: number;
    onSelectQuestion: (index: number) => void;
    onSubmitClick: () => void;
};

export function QuestionNavigator({
    open,
    onOpenChange,
    questions,
    answers,
    currentIndex,
    onSelectQuestion,
    onSubmitClick,
}: QuestionNavigatorProps) {
    const total = questions.length;
    const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
    const isAllAnswered = answeredCount === total && total > 0;
    const firstUnansweredIndex = questions.findIndex((q) => answers[q.id] === undefined);

    const handleJump = (index: number) => {
        onSelectQuestion(index);
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="max-h-[85dvh] rounded-t-2xl sm:max-h-[80dvh] p-4 sm:p-6 flex flex-col"
            >
                <div className="mx-auto w-full max-w-2xl flex-1 flex flex-col min-h-0">
                    <SheetHeader className="text-left pb-2 space-y-1">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-base sm:text-lg font-bold">
                                Daftar 39 Pertanyaan
                            </SheetTitle>
                            <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                                {answeredCount} / {total} Terjawab
                            </span>
                        </div>
                        <SheetDescription className="text-xs text-muted-foreground">
                            Pilih nomor soal untuk langsung menuju ke pertanyaan tersebut.
                        </SheetDescription>
                    </SheetHeader>

                    {/* Legend */}
                    <div className="flex items-center gap-4 py-2 border-y text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <span className="size-3 rounded-full bg-emerald-600" />
                            <span>Terisi</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="size-3 rounded-full border border-border bg-card" />
                            <span>Belum terisi</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="size-3 rounded-full border-2 border-primary bg-primary/20" />
                            <span>Posisi saat ini</span>
                        </div>
                    </div>

                    {/* Grid buttons: 1-39 */}
                    <div className="flex-1 overflow-y-auto py-3 pr-1">
                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                            {questions.map((q, idx) => {
                                const isAnswered = answers[q.id] !== undefined;
                                const isCurrent = idx === currentIndex;

                                return (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => handleJump(idx)}
                                        aria-label={`Nomor ${idx + 1}, ${isAnswered ? 'sudah dijawab' : 'belum dijawab'}`}
                                        className={cn(
                                            'relative flex h-11 w-full items-center justify-center rounded-lg border text-xs font-semibold transition-all',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                            isCurrent && 'ring-2 ring-primary ring-offset-2',
                                            isAnswered
                                                ? 'border-emerald-600/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                                                : 'border-border/80 bg-card text-muted-foreground hover:bg-muted/50'
                                        )}
                                    >
                                        <span>{idx + 1}</span>
                                        {isAnswered && (
                                            <span className="absolute top-1 right-1 text-emerald-600 dark:text-emerald-400">
                                                <Check className="size-2.5 stroke-[3]" />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t space-y-2">
                        {firstUnansweredIndex !== -1 && !isAllAnswered && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleJump(firstUnansweredIndex)}
                                className="w-full text-xs h-9 gap-1.5"
                            >
                                <span>Lompat ke Soal Belum Terisi (#{firstUnansweredIndex + 1})</span>
                                <ArrowRight className="size-3.5" />
                            </Button>
                        )}

                        <Button
                            type="button"
                            size="lg"
                            disabled={!isAllAnswered}
                            onClick={() => {
                                onOpenChange(false);
                                onSubmitClick();
                            }}
                            className={cn(
                                'w-full h-11 text-xs sm:text-sm font-semibold gap-2 shadow-sm',
                                isAllAnswered && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            )}
                        >
                            <Send className="size-4" />
                            {isAllAnswered
                                ? 'Kirim Self-Assessment Sekarang'
                                : `Lengkapi Semua Soal (${total - answeredCount} tersisa)`}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
