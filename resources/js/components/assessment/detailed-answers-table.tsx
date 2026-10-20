import { useEffect, useState, useCallback, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { FileQuestion } from "lucide-react";
import type {
    DimensionScore,
    DetailedAnswersResponse,
} from "@/types/assessment";

function computeMean(values: (number | null | undefined)[]): number | null {
    const valid = values.filter(
        (v): v is number => v !== null && v !== undefined,
    );
    if (valid.length === 0) return null;
    return Number(
        (valid.reduce((acc, v) => acc + v, 0) / valid.length).toFixed(2),
    );
}

export function DetailedAnswersTable({
    participantId,
    dimensions,
}: {
    participantId: number;
    dimensions: DimensionScore[];
}) {
    const [dimensionFilter, setDimensionFilter] = useState<string>("all");
    const [page, setPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [response, setResponse] = useState<DetailedAnswersResponse | null>(
        null,
    );

    const loadData = useCallback(
        async (p: number, dimId: string, signal?: AbortSignal) => {
            setLoading(true);
            setError(false);

            try {
                const params = new URLSearchParams();
                params.set("page", String(p));
                if (dimId !== "all") {
                    params.set("dimension_id", dimId);
                }

                const res = await fetch(
                    `/admin/participants/${participantId}/result/detail?${params.toString()}`,
                    {
                        headers: { Accept: "application/json" },
                        credentials: "same-origin",
                        signal,
                    },
                );

                if (!res.ok) throw new Error("Fetch failed");

                const json = (await res.json()) as DetailedAnswersResponse;
                setResponse(json);
            } catch {
                if (!signal?.aborted) {
                    setError(true);
                }
            } finally {
                if (!signal?.aborted) {
                    setLoading(false);
                }
            }
        },
        [participantId],
    );

    useEffect(() => {
        const controller = new AbortController();
        void loadData(page, dimensionFilter, controller.signal);
        return () => controller.abort();
    }, [page, dimensionFilter, loadData]);

    const handleDimensionChange = (val: string) => {
        setDimensionFilter(val);
        setPage(1);
    };

    const pageAverages = useMemo(() => {
        const items = response?.data ?? [];
        return {
            self: computeMean(items.map((i) => i.self_score)),
            boss: computeMean(items.map((i) => i.boss_score)),
            subordinate: computeMean(items.map((i) => i.subordinate_score)),
            average: computeMean(items.map((i) => i.average)),
        };
    }, [response]);

    const filterSummary = useMemo(() => {
        if (dimensionFilter !== "all") {
            const selectedDim = dimensions.find(
                (d) => String(d.id) === dimensionFilter,
            );
            if (selectedDim) {
                return {
                    label: `Rata-rata Dimensi: ${selectedDim.name} (Average)`,
                    self: selectedDim.scores.self,
                    boss: selectedDim.scores.boss,
                    subordinate: selectedDim.scores.subordinate,
                    average: selectedDim.scores.average,
                };
            }
        }

        return {
            label: "Rata-rata Keseluruhan (Average)",
            self: computeMean(dimensions.map((d) => d.scores.self)),
            boss: computeMean(dimensions.map((d) => d.scores.boss)),
            subordinate: computeMean(
                dimensions.map((d) => d.scores.subordinate),
            ),
            average: computeMean(dimensions.map((d) => d.scores.average)),
        };
    }, [dimensionFilter, dimensions]);

    const renderScore = (
        score: number | null | undefined,
        roleClass: string,
    ) => {
        if (score === null || score === undefined) {
            return <span className="text-muted-foreground">-</span>;
        }
        return (
            <span className={`font-semibold tabular-nums ${roleClass}`}>
                {score.toFixed(2)}
            </span>
        );
    };

    return (
        <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                        Filter Dimensi:
                    </span>
                    <Select
                        value={dimensionFilter}
                        onValueChange={handleDimensionChange}
                    >
                        <SelectTrigger
                            className="w-[200px] h-9 text-xs"
                            aria-label="Filter dimensi"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Dimensi</SelectItem>
                            {dimensions.map((d) => (
                                <SelectItem key={d.id} value={String(d.id)}>
                                    {d.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {response && response.total > 0 && (
                    <span className="text-xs text-muted-foreground">
                        Total {response.total} butir pertanyaan
                    </span>
                )}
            </div>

            {/* Error & Loading & Content */}
            {error ? (
                <ErrorState
                    title="Gagal memuat rincian jawaban"
                    description="Terjadi kendala saat mengambil data butir kuesioner."
                    onRetry={() => loadData(page, dimensionFilter)}
                />
            ) : loading ? (
                <div className="space-y-2 py-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                </div>
            ) : !response || response.data.length === 0 ? (
                <EmptyState
                    icon={FileQuestion}
                    title="Tidak ada butir pertanyaan"
                    description="Belum ada data pertanyaan untuk kriteria filter yang dipilih."
                />
            ) : (
                <div className="space-y-4">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto rounded-card border bg-card">
                        <Table>
                            <TableHeader className="bg-muted/50 [&_th]:text-xs [&_th]:font-semibold [&_th]:text-muted-foreground">
                                <TableRow>
                                    <TableHead className="w-12 text-center">
                                        #
                                    </TableHead>
                                    <TableHead className="min-w-[280px]">
                                        Pertanyaan
                                    </TableHead>
                                    <TableHead className="w-40">
                                        Dimensi &amp; Sub-Dimensi
                                    </TableHead>
                                    <TableHead className="w-24 text-center">
                                        Diri Sendiri
                                    </TableHead>
                                    <TableHead className="w-24 text-center">
                                        Atasan
                                    </TableHead>
                                    <TableHead className="w-24 text-center">
                                        Bawahan
                                    </TableHead>
                                    <TableHead className="w-28 text-center">
                                        Rata-rata
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {response.data.map((item, index) => {
                                    const rowNum = (response.from ?? 1) + index;
                                    return (
                                        <TableRow
                                            key={item.id}
                                            className="hover:bg-accent/40"
                                        >
                                            <TableCell className="text-center text-xs text-muted-foreground font-mono">
                                                {rowNum}
                                            </TableCell>
                                            <TableCell className="text-sm font-medium">
                                                {item.text}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground space-y-1">
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] block w-fit"
                                                >
                                                    {item.dimension_name}
                                                </Badge>
                                                <span className="block text-xs">
                                                    {item.sub_dimension_name}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {renderScore(
                                                    item.self_score,
                                                    "text-indigo-600 dark:text-indigo-400",
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {renderScore(
                                                    item.boss_score,
                                                    "text-emerald-600 dark:text-emerald-400",
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {renderScore(
                                                    item.subordinate_score,
                                                    "text-amber-600 dark:text-amber-400",
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {renderScore(
                                                    item.average,
                                                    "text-sky-600 dark:text-sky-400 font-bold",
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                            <TableFooter>
                                {response.last_page > 1 && (
                                    <TableRow className="bg-muted/30">
                                        <TableCell
                                            colSpan={3}
                                            className="text-xs font-semibold text-muted-foreground"
                                        >
                                            Rata-rata Halaman Ini (Butir{" "}
                                            {response.from ?? 1}–
                                            {response.to ??
                                                response.data.length}
                                            )
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {renderScore(
                                                pageAverages.self,
                                                "text-indigo-600 dark:text-indigo-400",
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {renderScore(
                                                pageAverages.boss,
                                                "text-emerald-600 dark:text-emerald-400",
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {renderScore(
                                                pageAverages.subordinate,
                                                "text-amber-600 dark:text-amber-400",
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {renderScore(
                                                pageAverages.average,
                                                "text-sky-600 dark:text-sky-400 font-bold",
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="bg-muted/60 font-bold">
                                    <TableCell
                                        colSpan={3}
                                        className="font-bold text-foreground"
                                    >
                                        {filterSummary.label}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {renderScore(
                                            filterSummary.self,
                                            "text-indigo-600 dark:text-indigo-400 font-bold",
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {renderScore(
                                            filterSummary.boss,
                                            "text-emerald-600 dark:text-emerald-400 font-bold",
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {renderScore(
                                            filterSummary.subordinate,
                                            "text-amber-600 dark:text-amber-400 font-bold",
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {renderScore(
                                            filterSummary.average,
                                            "text-sky-600 dark:text-sky-400 font-bold",
                                        )}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>

                    {/* Mobile Cards View */}
                    <div className="grid grid-cols-1 gap-3 md:hidden">
                        {response.data.map((item, index) => {
                            const rowNum = (response.from ?? 1) + index;
                            return (
                                <div
                                    key={item.id}
                                    className="rounded-card border bg-card p-4 space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-xs font-mono text-muted-foreground">
                                            #{rowNum}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="text-[10px]"
                                        >
                                            {item.dimension_name}
                                        </Badge>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {item.text}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.sub_dimension_name}
                                    </p>
                                    <div className="grid grid-cols-4 gap-2 pt-2 border-t text-center text-xs">
                                        <div>
                                            <span className="block text-[10px] text-muted-foreground">
                                                Self
                                            </span>
                                            {renderScore(
                                                item.self_score,
                                                "text-indigo-600 dark:text-indigo-400",
                                            )}
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-muted-foreground">
                                                Boss
                                            </span>
                                            {renderScore(
                                                item.boss_score,
                                                "text-emerald-600 dark:text-emerald-400",
                                            )}
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-muted-foreground">
                                                Bawahan
                                            </span>
                                            {renderScore(
                                                item.subordinate_score,
                                                "text-amber-600 dark:text-amber-400",
                                            )}
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-muted-foreground">
                                                Rata-rata
                                            </span>
                                            {renderScore(
                                                item.average,
                                                "text-sky-600 dark:text-sky-400 font-bold",
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Mobile Average Summary Card */}
                        <div className="rounded-card border border-primary/20 bg-muted/50 p-4 space-y-2.5">
                            <p className="text-xs font-bold text-foreground">
                                {filterSummary.label}
                            </p>
                            <div className="grid grid-cols-4 gap-2 pt-1 border-t border-border/60 text-center text-xs">
                                <div>
                                    <span className="block text-[10px] text-muted-foreground">
                                        Self
                                    </span>
                                    {renderScore(
                                        filterSummary.self,
                                        "text-indigo-600 dark:text-indigo-400 font-bold",
                                    )}
                                </div>
                                <div>
                                    <span className="block text-[10px] text-muted-foreground">
                                        Boss
                                    </span>
                                    {renderScore(
                                        filterSummary.boss,
                                        "text-emerald-600 dark:text-emerald-400 font-bold",
                                    )}
                                </div>
                                <div>
                                    <span className="block text-[10px] text-muted-foreground">
                                        Bawahan
                                    </span>
                                    {renderScore(
                                        filterSummary.subordinate,
                                        "text-amber-600 dark:text-amber-400 font-bold",
                                    )}
                                </div>
                                <div>
                                    <span className="block text-[10px] text-muted-foreground">
                                        Average
                                    </span>
                                    {renderScore(
                                        filterSummary.average,
                                        "text-sky-600 dark:text-sky-400 font-bold",
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pagination Bar */}
                    <div className="flex flex-col items-center justify-between gap-3 pt-2 sm:flex-row">
                        <p className="text-xs text-muted-foreground">
                            Menampilkan {response.from ?? 0} sampai{" "}
                            {response.to ?? 0} dari {response.total} pertanyaan
                        </p>
                        {response.last_page > 1 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={response.current_page <= 1}
                                    onClick={() =>
                                        setPage((p) => Math.max(1, p - 1))
                                    }
                                >
                                    Sebelumnya
                                </Button>
                                <span className="text-xs font-medium px-2">
                                    Halaman {response.current_page} dari{" "}
                                    {response.last_page}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                        response.current_page >=
                                        response.last_page
                                    }
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Berikutnya
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
