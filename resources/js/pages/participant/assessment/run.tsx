import { useState, useEffect, useCallback, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { AssessmentProgress, type AutosaveStatus } from '@/components/assessment/assessment-progress';
import { QuestionCard } from '@/components/assessment/question-card';
import { QuestionNavigator } from '@/components/assessment/question-navigator';
import { QuestionsLoader } from '@/components/assessment/questions-loader';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, ArrowRight, CheckCircle2, LayoutGrid, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { AssessmentQuestionItem } from '@/types/assessment';

function getXsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export default function AssessmentRun({
    questions,
    initialAnswers,
    initialIndex = 1,
}: {
    questions: AssessmentQuestionItem[];
    initialAnswers: Record<string, number>;
    initialIndex?: number;
    participant?: {
        name: string;
        email: string;
    };
}) {
    // Convert 1-based initialIndex from backend to 0-based array index
    const startIndex = Math.min(
        Math.max(0, (initialIndex || 1) - 1),
        Math.max(0, questions.length - 1)
    );

    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const [answers, setAnswers] = useState<Record<string, number>>(() => {
        const parsed: Record<string, number> = {};
        Object.entries(initialAnswers || {}).forEach(([k, v]) => {
            parsed[String(k)] = Number(v);
        });
        return parsed;
    });

    const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');
    const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
    const [navigatorOpen, setNavigatorOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const lastFailedSave = useRef<{ questionId: number; value: number } | null>(null);

    const currentQuestion = questions[currentIndex];
    const totalQuestions = questions.length;
    const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
    const isAllAnswered = answeredCount === totalQuestions && totalQuestions > 0;
    const isCurrentAnswered = currentQuestion !== undefined && answers[currentQuestion.id] !== undefined;

    // Send answer to server via fetch
    const persistAnswer = useCallback(async (questionId: number, value: number) => {
        setAutosaveStatus('saving');
        lastFailedSave.current = { questionId, value };

        try {
            const res = await fetch('/participant/assessment/answers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    question_id: questionId,
                    value,
                }),
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            lastFailedSave.current = null;
            setAutosaveStatus('saved');
            setTimeout(() => {
                setAutosaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
            }, 1800);
        } catch {
            setAutosaveStatus('error');
            toast.error('Gagal menyimpan jawaban secara otomatis. Periksa koneksi internet Anda.');
        }
    }, []);

    const handleSelectOption = (value: number) => {
        if (!currentQuestion) return;

        // Optimistic state update
        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.id]: value,
        }));

        // Send to backend (tanpa auto-advance)
        persistAnswer(currentQuestion.id, value);
    };

    const handleRetryAutosave = () => {
        if (lastFailedSave.current) {
            persistAnswer(lastFailedSave.current.questionId, lastFailedSave.current.value);
        }
    };

    // Keyboard navigation (1-6 to rate, Left/Right arrow to navigate)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if active element is an input, textarea, or dialog open
            if (
                confirmSubmitOpen ||
                navigatorOpen ||
                ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
            ) {
                return;
            }

            if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
                e.preventDefault();
                handleSelectOption(parseInt(e.key, 10));
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setCurrentIndex((prev) => Math.max(0, prev - 1));
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (isCurrentAnswered) {
                    setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, totalQuestions, confirmSubmitOpen, navigatorOpen, currentQuestion, isCurrentAnswered]);

    const handleFinalSubmit = () => {
        if (!isAllAnswered) {
            toast.error(`Harap selesaikan seluruh ${totalQuestions} pertanyaan sebelum mengirim.`);
            return;
        }

        setIsSubmitting(true);
        router.post(
            '/participant/assessment/submit',
            {},
            {
                preserveScroll: true,
                onError: () => {
                    toast.error('Gagal mengirimkan asesmen. Pastikan semua soal telah terjawab.');
                    setIsSubmitting(false);
                    setConfirmSubmitOpen(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    if (!currentQuestion) {
        return (
            <QuestionsLoader
                isResuming={Object.keys(initialAnswers || {}).length > 0}
                onRetry={() => window.location.reload()}
            />
        );
    }

    return (
        <>
            <Head title={`Pertanyaan ${currentIndex + 1} dari ${totalQuestions} - Self-Assessment`} />

            <div className="space-y-4 pb-24 sm:pb-12">
                {/* Sticky Progress Header (tanpa garis pembatas bawah) */}
                <AssessmentProgress
                    currentIndex={currentIndex}
                    totalQuestions={totalQuestions}
                    answeredCount={answeredCount}
                    autosaveStatus={autosaveStatus}
                    onRetryAutosave={handleRetryAutosave}
                    onOpenNavigator={() => setNavigatorOpen(true)}
                />

                {/* Main Question Card */}
                <div className="pt-2">
                    <QuestionCard
                        question={currentQuestion}
                        questionNumber={currentIndex + 1}
                        selectedValue={answers[currentQuestion.id] ?? null}
                        onChange={handleSelectOption}
                        disabled={isSubmitting}
                    />
                </div>

                {/* Bottom Navigation Bar (tanpa garis pembatas, tombol konsisten admin, mobile friendly) */}
                <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] sm:static sm:bg-transparent sm:p-0">
                    <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 sm:gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                            disabled={currentIndex === 0 || isSubmitting}
                            className="gap-1.5"
                        >
                            <ArrowLeft className="size-4" />
                            <span>Sebelumnya</span>
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => setNavigatorOpen(true)}
                            className="gap-1.5"
                            title={`Buka daftar ${totalQuestions} pertanyaan`}
                        >
                            <LayoutGrid className="size-4 text-primary" />
                            <span className="hidden sm:inline">Daftar Soal</span>
                            <span className="sm:hidden text-xs">{answeredCount}/{totalQuestions}</span>
                        </Button>

                        <div className="flex items-center gap-2">
                            {currentIndex < totalQuestions - 1 ? (
                                <Button
                                    type="button"
                                    size="lg"
                                    onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                                    disabled={!isCurrentAnswered || isSubmitting}
                                    className="gap-1.5"
                                >
                                    <span>Selanjutnya</span>
                                    <ArrowRight className="size-4" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    size="lg"
                                    onClick={() => setConfirmSubmitOpen(true)}
                                    disabled={!isAllAnswered || isSubmitting}
                                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    <CheckCircle2 className="size-4" />
                                    <span>Selesai &amp; Kirim</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Submit Confirmation Dialog (margin-padding aman di mobile agar tidak mepet) */}
                <AlertDialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
                    <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-md max-h-[85dvh] overflow-y-auto p-6 sm:p-7 rounded-2xl">
                        <AlertDialogHeader className="space-y-2 text-left">
                            <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Send className="size-5 text-primary" />
                                Kirim Self-Assessment
                            </AlertDialogTitle>
                            <AlertDialogDescription asChild>
                                <div className="space-y-3 pt-1 text-sm text-muted-foreground text-left leading-relaxed">
                                    <p>
                                        Seluruh <strong>{totalQuestions} pertanyaan</strong> telah Anda jawab dengan lengkap.
                                    </p>
                                    <p className="rounded-lg bg-muted/60 p-3.5 text-xs leading-relaxed text-foreground/80">
                                        Setelah diserahkan, jawaban Anda akan disimpan secara permanen dan tidak dapat diubah kembali.
                                    </p>
                                    <p className="text-xs font-medium text-foreground">
                                        Apakah Anda yakin ingin menyelesaikan kuesioner ini sekarang?
                                    </p>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="pt-3 flex-col sm:flex-row gap-2.5">
                            <AlertDialogCancel disabled={isSubmitting} className="w-full sm:w-auto">
                                Periksa Kembali
                            </AlertDialogCancel>
                            <Button
                                type="button"
                                disabled={isSubmitting}
                                loading={isSubmitting}
                                onClick={handleFinalSubmit}
                                className="w-full sm:w-auto"
                            >
                                Ya, Kirim Asesmen
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Mobile-Friendly Question List Navigator */}
                <QuestionNavigator
                    open={navigatorOpen}
                    onOpenChange={setNavigatorOpen}
                    questions={questions}
                    answers={answers}
                    currentIndex={currentIndex}
                    onSelectQuestion={setCurrentIndex}
                    onSubmitClick={() => setConfirmSubmitOpen(true)}
                    submitLabel="Kirim Self-Assessment Sekarang"
                />
            </div>
        </>
    );
}
