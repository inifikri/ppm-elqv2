import { useState, useMemo } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
    Check,
    Send,
    ArrowRight,
    LayoutGrid,
    ListTree,
    HelpCircle,
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

export type QuestionNavigatorProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    questions: AssessmentQuestionItem[];
    answers: Record<string, number>;
    currentIndex: number;
    onSelectQuestion: (index: number) => void;
    onSubmitClick: () => void;
    submitLabel?: string;
};

export function QuestionNavigator({
    open,
    onOpenChange,
    questions,
    answers,
    currentIndex,
    onSelectQuestion,
    onSubmitClick,
    submitLabel = 'Kirim Penilaian Sekarang',
}: QuestionNavigatorProps) {
    const isMobile = useIsMobile();
    const [desktopTab, setDesktopTab] = useState<'grid' | 'list'>('grid');
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const total = questions.length;
    const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
    const isAllAnswered = answeredCount === total && total > 0;
    const progressPercent = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
    const firstUnansweredIndex = questions.findIndex((q) => answers[q.id] === undefined);

    const handleJump = (index: number) => {
        onSelectQuestion(index);
        onOpenChange(false);
    };

    // Kelompokkan per dimensi untuk tampilan desktop terstruktur
    const dimensionGroups = useMemo(() => {
        const map = new Map<
            string,
            {
                dimensionName: string;
                items: { question: AssessmentQuestionItem; index: number }[];
            }
        >();

        questions.forEach((q, idx) => {
            const dimName = q.dimension_name || 'Umum';
            if (!map.has(dimName)) {
                map.set(dimName, { dimensionName: dimName, items: [] });
            }
            map.get(dimName)!.items.push({ question: q, index: idx });
        });

        return Array.from(map.values());
    }, [questions]);

    // Active previewed question in desktop mode (hovered or current)
    const activePreviewQuestion =
        hoveredIndex !== null
            ? questions[hoveredIndex]
            : questions[currentIndex] ?? null;
    const activePreviewIndex =
        hoveredIndex !== null ? hoveredIndex : currentIndex;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side={isMobile ? 'bottom' : 'right'}
                className={cn(
                    'flex flex-col p-4 sm:p-6',
                    isMobile
                        ? 'max-h-[85dvh] rounded-t-2xl'
                        : 'w-full sm:max-w-xl md:max-w-2xl h-full border-l'
                )}
            >
                <div className="flex-1 flex flex-col min-h-0 w-full">
                    {/* Header: Responsif Mobile vs Desktop */}
                    <SheetHeader className="text-left pb-3 space-y-2 border-b">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <SheetTitle className="text-base sm:text-lg font-bold tracking-tight">
                                    {isMobile ? 'Daftar Pertanyaan' : 'Navigasi & Ringkasan Soal'}
                                </SheetTitle>
                                <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                                    {isMobile
                                        ? 'Pilih nomor soal untuk langsung menuju ke pertanyaan.'
                                        : 'Tinjau progres dan lompat langsung ke pertanyaan manapun.'}
                                </SheetDescription>
                            </div>
                            <div className="text-right shrink-0">
                                <Badge
                                    variant="secondary"
                                    className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2.5 py-1"
                                >
                                    {answeredCount} / {total} Terjawab ({progressPercent}%)
                                </Badge>
                            </div>
                        </div>

                        {/* Progress Bar Mini */}
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-primary h-full rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        {/* Switcher Mode Khusus Desktop */}
                        {!isMobile && (
                            <div className="pt-1 flex items-center justify-between">
                                <Tabs
                                    value={desktopTab}
                                    onValueChange={(v) => setDesktopTab(v as 'grid' | 'list')}
                                    className="w-full"
                                >
                                    <TabsList className="grid grid-cols-2 w-full h-9">
                                        <TabsTrigger value="grid" className="gap-1.5 text-xs">
                                            <LayoutGrid className="size-3.5" />
                                            <span>Matriks Nomor (1-{total})</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="list" className="gap-1.5 text-xs">
                                            <ListTree className="size-3.5" />
                                            <span>Daftar per Dimensi</span>
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        )}
                    </SheetHeader>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-3 py-2 text-xs text-muted-foreground border-b">
                        <div className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-full bg-primary" />
                            <span>Terisi</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-full border border-border bg-card" />
                            <span>Belum terisi</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-full border-2 border-primary bg-primary/20" />
                            <span>Posisi saat ini</span>
                        </div>
                    </div>

                    {/* BODY KONTEN */}
                    {isMobile ? (
                        /* Tampilan Mobile: Quick-nav Grid 6 Kolom */
                        <div className="flex-1 overflow-y-auto py-3 pr-1">
                            <div className="grid grid-cols-6 gap-2">
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
                                                'relative flex h-11 w-full items-center justify-center rounded-lg border text-xs font-semibold outline-none transition-colors',
                                                'focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0',
                                                isCurrent
                                                    ? isAnswered
                                                        ? 'border-primary bg-primary text-primary-foreground font-bold shadow-xs'
                                                        : 'border-primary bg-primary/15 text-primary font-bold shadow-xs'
                                                    : isAnswered
                                                      ? 'border-transparent bg-primary/90 text-primary-foreground'
                                                      : 'border-border/80 bg-card text-muted-foreground hover:border-primary hover:bg-muted/50'
                                            )}
                                        >
                                            <span>{idx + 1}</span>
                                            {isAnswered && (
                                                <span className="absolute top-1 right-1 text-primary">
                                                    <Check className="size-2.5 stroke-[3]" />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* Tampilan Desktop: Dua Mode (Grid Preview vs Daftar per Dimensi) */
                        <div className="flex-1 overflow-y-auto py-3 pr-1 min-h-0">
                            {desktopTab === 'grid' ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-8 md:grid-cols-10 gap-2">
                                        {questions.map((q, idx) => {
                                            const isAnswered = answers[q.id] !== undefined;
                                            const isCurrent = idx === currentIndex;
                                            const scoreValue = answers[q.id];

                                            return (
                                                <button
                                                    key={q.id}
                                                    type="button"
                                                    onClick={() => handleJump(idx)}
                                                    onMouseEnter={() => setHoveredIndex(idx)}
                                                    onMouseLeave={() => setHoveredIndex(null)}
                                                    aria-label={`Nomor ${idx + 1}, ${isAnswered ? 'sudah dijawab' : 'belum dijawab'}`}
                                                    className={cn(
                                                        'group relative flex h-12 w-full flex-col items-center justify-center rounded-lg border text-xs transition-all',
                                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                                        isCurrent && 'ring-2 ring-primary ring-offset-2',
                                                        isAnswered
                                                            ? 'border-primary/40 bg-primary/10 text-primary font-bold shadow-xs'
                                                            : 'border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/40'
                                                    )}
                                                >
                                                    <span className="text-xs">{idx + 1}</span>
                                                    {isAnswered ? (
                                                        <span className="text-[10px] text-primary/80 font-mono">
                                                            [{scoreValue}]
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground/40 font-mono">
                                                            -
                                                        </span>
                                                    )}
                                                    {isAnswered && (
                                                        <span className="absolute top-1 right-1 text-primary">
                                                            <Check className="size-2.5 stroke-[3]" />
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Preview Kartu Soal saat hover di desktop */}
                                    {activePreviewQuestion && (
                                        <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-1.5 transition-all">
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px] font-semibold bg-background"
                                                    >
                                                        Soal #{activePreviewIndex + 1}
                                                    </Badge>
                                                    {activePreviewQuestion.dimension_name && (
                                                        <span className="text-[11px] font-medium text-primary">
                                                            {activePreviewQuestion.dimension_name}
                                                        </span>
                                                    )}
                                                </div>
                                                {answers[activePreviewQuestion.id] !== undefined ? (
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-primary/15 text-primary text-[10px]"
                                                    >
                                                        Skor {answers[activePreviewQuestion.id]} (
                                                        {SCORE_LABELS[answers[activePreviewQuestion.id]]}
                                                        )
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px] text-muted-foreground"
                                                    >
                                                        Belum dijawab
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-foreground leading-relaxed line-clamp-2 font-medium">
                                                {activePreviewQuestion.text}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Mode Daftar Terstruktur per Dimensi */
                                <div className="space-y-4">
                                    {dimensionGroups.map((group) => {
                                        const groupAnswered = group.items.filter(
                                            (it) => answers[it.question.id] !== undefined
                                        ).length;
                                        const groupTotal = group.items.length;
                                        const isGroupComplete =
                                            groupAnswered === groupTotal && groupTotal > 0;

                                        return (
                                            <div
                                                key={group.dimensionName}
                                                className="rounded-xl border border-border/80 bg-card overflow-hidden"
                                            >
                                                <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/40 border-b text-xs font-semibold">
                                                    <span className="text-foreground">
                                                        {group.dimensionName}
                                                    </span>
                                                    <Badge
                                                        variant={isGroupComplete ? 'secondary' : 'outline'}
                                                        className={cn(
                                                            'text-[10px]',
                                                            isGroupComplete
                                                                ? 'bg-primary/10 text-primary border-primary/20'
                                                                : 'text-muted-foreground'
                                                        )}
                                                    >
                                                        {groupAnswered} / {groupTotal} selesai
                                                    </Badge>
                                                </div>

                                                <div className="divide-y divide-border/60">
                                                    {group.items.map(({ question: q, index: idx }) => {
                                                        const isAnswered =
                                                            answers[q.id] !== undefined;
                                                        const score = answers[q.id];
                                                        const isCurrent = idx === currentIndex;

                                                        return (
                                                            <button
                                                                key={q.id}
                                                                type="button"
                                                                onClick={() => handleJump(idx)}
                                                                className={cn(
                                                                    'w-full flex items-start justify-between gap-3 p-3 text-left transition-colors text-xs',
                                                                    isCurrent &&
                                                                        'bg-primary/5 font-semibold',
                                                                    !isCurrent &&
                                                                        'hover:bg-muted/40'
                                                                )}
                                                            >
                                                                <div className="flex items-start gap-2.5 min-w-0">
                                                                    <span
                                                                        className={cn(
                                                                            'flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                                                                            isAnswered
                                                                                ? 'bg-primary text-primary-foreground'
                                                                                : 'bg-muted text-muted-foreground'
                                                                        )}
                                                                    >
                                                                        {idx + 1}
                                                                    </span>
                                                                    <div className="min-w-0">
                                                                        <p className="line-clamp-2 text-foreground leading-snug">
                                                                            {q.text}
                                                                        </p>
                                                                        {q.sub_dimension_name && (
                                                                            <span className="text-[10px] text-muted-foreground">
                                                                                {q.sub_dimension_name}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="shrink-0 text-right">
                                                                    {isAnswered ? (
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold"
                                                                        >
                                                                            Skor {score}
                                                                        </Badge>
                                                                    ) : (
                                                                        <span className="text-[10px] text-muted-foreground">
                                                                            Kosong
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-3 border-t space-y-2 mt-auto">
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
                                isAllAnswered
                                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                                    : 'opacity-60 cursor-not-allowed'
                            )}
                        >
                            <Send className="size-4" />
                            {isAllAnswered
                                ? submitLabel
                                : `Lengkapi Semua Soal (${total - answeredCount} tersisa)`}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
