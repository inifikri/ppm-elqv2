import { useState, useEffect, useCallback, useRef } from "react";
import { Head, router } from "@inertiajs/react";
import {
    AssessmentProgress,
    type AutosaveStatus,
} from "@/components/assessment/assessment-progress";
import { QuestionCard } from "@/components/assessment/question-card";
import { QuestionNavigator } from "@/components/assessment/question-navigator";
import { QuestionsLoader } from "@/components/assessment/questions-loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    LayoutGrid,
    Send,
    User,
} from "lucide-react";
import { toast } from "sonner";
import type { AssessmentQuestionItem } from "@/types/assessment";

function getXsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
}

interface EvaluatorAssessmentProps {
    rater: {
        ulid: string;
        role: string;
        role_label: string;
        email: string;
    };
    participant: {
        name: string;
        company?: string | null;
        position?: string | null;
    };
    questions: AssessmentQuestionItem[];
    initialAnswers: Record<string, number>;
    initialIndex?: number;
}

export default function EvaluatorAssessment({
    rater,
    participant,
    questions,
    initialAnswers,
    initialIndex = 1,
}: EvaluatorAssessmentProps) {
    const startIndex = Math.min(
        Math.max(0, (initialIndex || 1) - 1),
        Math.max(0, questions.length - 1),
    );

    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const [answers, setAnswers] = useState<Record<string, number>>(() => {
        const parsed: Record<string, number> = {};
        Object.entries(initialAnswers || {}).forEach(([k, v]) => {
            parsed[String(k)] = Number(v);
        });
        return parsed;
    });

    const [autosaveStatus, setAutosaveStatus] =
        useState<AutosaveStatus>("idle");
    const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
    const [navigatorOpen, setNavigatorOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const lastFailedSave = useRef<{ questionId: number; value: number } | null>(
        null,
    );

    const currentQuestion = questions[currentIndex];
    const totalQuestions = questions.length;
    const answeredCount = questions.filter(
        (q) => answers[q.id] !== undefined,
    ).length;
    const isAllAnswered =
        answeredCount === totalQuestions && totalQuestions > 0;
    const isCurrentAnswered =
        currentQuestion !== undefined &&
        answers[currentQuestion.id] !== undefined;

    // Persist answer to server via fetch
    const persistAnswer = useCallback(
        async (questionId: number, value: number) => {
            setAutosaveStatus("saving");
            lastFailedSave.current = { questionId, value };

            try {
                const res = await fetch(`/rater/${rater.ulid}/answers`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-XSRF-TOKEN": getXsrfToken(),
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
                setAutosaveStatus("saved");
                setTimeout(() => {
                    setAutosaveStatus((prev) =>
                        prev === "saved" ? "idle" : prev,
                    );
                }, 1800);
            } catch {
                setAutosaveStatus("error");
                toast.error(
                    "Gagal menyimpan jawaban otomatis. Periksa koneksi internet Anda.",
                );
            }
        },
        [rater.ulid],
    );

    const handleSelectOption = (value: number) => {
        if (!currentQuestion) return;

        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.id]: value,
        }));

        persistAnswer(currentQuestion.id, value);
    };

    const handleRetryAutosave = () => {
        if (lastFailedSave.current) {
            persistAnswer(
                lastFailedSave.current.questionId,
                lastFailedSave.current.value,
            );
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                confirmSubmitOpen ||
                navigatorOpen ||
                ["INPUT", "TEXTAREA"].includes(
                    (e.target as HTMLElement)?.tagName,
                )
            ) {
                return;
            }

            if (["1", "2", "3", "4", "5", "6"].includes(e.key)) {
                e.preventDefault();
                handleSelectOption(parseInt(e.key, 10));
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                setCurrentIndex((prev) => Math.max(0, prev - 1));
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                if (isCurrentAnswered) {
                    setCurrentIndex((prev) =>
                        Math.min(totalQuestions - 1, prev + 1),
                    );
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        currentIndex,
        totalQuestions,
        confirmSubmitOpen,
        navigatorOpen,
        currentQuestion,
        isCurrentAnswered,
    ]);

    const handleFinalSubmit = () => {
        if (!isAllAnswered) {
            toast.error(
                "Harap selesaikan seluruh pertanyaan sebelum mengirimkan penilaian.",
            );
            return;
        }

        setIsSubmitting(true);
        router.post(
            `/rater/${rater.ulid}/submit`,
            {},
            {
                preserveScroll: true,
                onError: () => {
                    toast.error(
                        "Gagal mengirimkan penilaian. Pastikan semua soal telah terjawab.",
                    );
                    setIsSubmitting(false);
                    setConfirmSubmitOpen(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
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
            <Head
                title={`Penilaian ${participant.name} (${currentIndex + 1}/${totalQuestions}) - ELQ 360°`}
            />

            <div className="space-y-4 pb-24 sm:pb-12">
                {/* Participant Context Banner */}
                <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                            <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <User className="size-4" />
                            </span>
                            <div>
                                <span className="text-muted-foreground">
                                    Menilai:{" "}
                                </span>
                                <strong className="font-semibold text-foreground">
                                    {participant.name}
                                </strong>
                                {participant.position && (
                                    <span className="text-muted-foreground">
                                        {" "}
                                        ({participant.company} -{" "}
                                        {participant.position})
                                    </span>
                                )}
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className="text-xs font-medium"
                        >
                            Peran Anda: {rater.role_label}
                        </Badge>
                    </div>
                </div>

                {/* Sticky Progress Header */}
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

                {/* Navigation Bar (mobile friendly) */}
                <div className="flex items-center justify-between gap-2 sm:gap-3 pt-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="default"
                        icon={ArrowLeft}
                        disabled={currentIndex === 0 || isSubmitting}
                        onClick={() =>
                            setCurrentIndex((prev) => Math.max(0, prev - 1))
                        }
                    >
                        Sebelumnya
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="default"
                        onClick={() => setNavigatorOpen(true)}
                        className="gap-1.5"
                        title="Buka daftar 39 pertanyaan"
                    >
                        <LayoutGrid className="size-4 text-primary" />
                        <span className="hidden sm:inline">Daftar Soal</span>
                        <span className="sm:hidden text-xs">
                            {answeredCount}/{totalQuestions}
                        </span>
                    </Button>

                    <div className="flex items-center gap-2">
                        {currentIndex < totalQuestions - 1 ? (
                            <Button
                                type="button"
                                variant="default"
                                size="default"
                                iconPlacement="end"
                                icon={ArrowRight}
                                disabled={!isCurrentAnswered || isSubmitting}
                                onClick={() =>
                                    setCurrentIndex((prev) =>
                                        Math.min(totalQuestions - 1, prev + 1),
                                    )
                                }
                            >
                                Selanjutnya
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="default"
                                size="default"
                                icon={Send}
                                className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                                disabled={!isAllAnswered || isSubmitting}
                                onClick={() => setConfirmSubmitOpen(true)}
                            >
                                Kirim Penilaian
                            </Button>
                        )}
                    </div>
                </div>

                {/* Direct submit button if all questions answered and not on last question */}
                {isAllAnswered && currentIndex < totalQuestions - 1 && (
                    <div className="flex justify-end pt-1">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={CheckCircle2}
                            onClick={() => setConfirmSubmitOpen(true)}
                            disabled={isSubmitting}
                            className="text-xs text-emerald-600 dark:text-emerald-400"
                        >
                            Semua soal terjawab · Kirim sekarang
                        </Button>
                    </div>
                )}
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog
                open={confirmSubmitOpen}
                onOpenChange={setConfirmSubmitOpen}
            >
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Kirimkan Penilaian 360°?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Seluruh {totalQuestions} pertanyaan telah Anda jawab
                            untuk <strong>{participant.name}</strong>. Setelah
                            dikirimkan, penilaian ini bersifat final dan tidak
                            dapat diubah kembali.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                        <AlertDialogCancel disabled={isSubmitting}>
                            Periksa Kembali
                        </AlertDialogCancel>
                        <Button
                            type="button"
                            icon={Send}
                            disabled={isSubmitting}
                            onClick={handleFinalSubmit}
                            className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                        >
                            {isSubmitting
                                ? "Mengirimkan..."
                                : "Ya, Kirimkan Penilaian"}
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
                submitLabel="Kirim Penilaian Sekarang"
            />
        </>
    );
}
