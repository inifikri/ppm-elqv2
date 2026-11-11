import {
    AlertCircle,
    AlertTriangle,
    ArrowUpRight,
    BellRing,
    Briefcase,
    Building2,
    CalendarClock,
    CircleCheck,
    Clock,
    ExternalLink,
    Mail,
    UserX,
} from "lucide-react";
import { Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { index as remindersIndex } from "@/routes/admin/reminders";
import type { DashboardData } from "@/types";

type AttentionItem = DashboardData["attention"][number];

type FlattenedAttentionRow = {
    key: string;
    category: string;
    tone: AttentionItem["tone"];
    id: number | string;
    participant_name: string;
    company: string;
    position: string;
    detail_url: string | null;
    rater_role?: string;
    rater_email?: string;
    days_pending?: number;
    recipient_email?: string;
    error_message?: string;
};

export function AttentionList({
    items,
}: {
    items: DashboardData["attention"];
}) {
    const [selectedTab, setSelectedTab] = useState<string>("all");

    const totalIssues = items.reduce((sum, item) => sum + item.count, 0);

    const staleItem = items.find((i) => i.key === "stale_raters");
    const notStartedItem = items.find((i) => i.key === "not_started");
    const failedEmailsItem = items.find((i) => i.key === "failed_emails");

    const staleCount = staleItem?.count ?? 0;
    const notStartedCount = notStartedItem?.count ?? 0;
    const failedEmailsCount = failedEmailsItem?.count ?? 0;

    // Ratakan data ke baris tabel
    const allRows: FlattenedAttentionRow[] = useMemo(() => {
        const rows: FlattenedAttentionRow[] = [];

        items.forEach((cat) => {
            if (!cat.details) return;

            cat.details.forEach((d) => {
                rows.push({
                    key: cat.key,
                    category: cat.label,
                    tone: cat.tone,
                    id: `${cat.key}-${d.id}`,
                    participant_name: d.participant_name,
                    company: d.company,
                    position: d.position,
                    detail_url: d.detail_url ?? null,
                    rater_role: d.rater_role,
                    rater_email: d.rater_email,
                    days_pending: d.days_pending,
                    recipient_email: d.recipient_email,
                    error_message: d.error_message,
                });
            });
        });

        return rows;
    }, [items]);

    const filteredRows = useMemo(() => {
        if (selectedTab === "all") return allRows;
        return allRows.filter((row) => row.key === selectedTab);
    }, [allRows, selectedTab]);

    return (
        <Card className="shadow-none border border-border/70 overflow-hidden flex flex-col">
            <CardHeader className="pb-4 border-b border-border/60 bg-muted/15">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                                <span className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <AlertTriangle className="size-4.5" />
                                </span>
                                Perlu Perhatian
                            </CardTitle>
                            {totalIssues > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="bg-amber-600 hover:bg-amber-600 text-white text-xs px-2 py-0.5"
                                >
                                    {totalIssues} Tindakan
                                </Badge>
                            )}
                        </div>
                        <CardDescription className="text-xs text-muted-foreground">
                            Seluruh kendala asesmen yang memerlukan tindak lanjut
                            admin (penilai tertunda &gt; 2 hari, peserta tanpa
                            penilai, atau kegagalan email).
                        </CardDescription>
                    </div>
                </div>

                {/* Filter Pills Modern */}
                <div className="flex flex-wrap items-center gap-2 pt-3">
                    <button
                        type="button"
                        onClick={() => setSelectedTab("all")}
                        className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
                            selectedTab === "all"
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <span>Semua</span>
                        <span
                            className={cn(
                                "text-[10px] px-1.5 py-0.2 rounded-full",
                                selectedTab === "all"
                                    ? "bg-primary-foreground/20 text-primary-foreground"
                                    : "bg-background/80 text-foreground"
                            )}
                        >
                            {totalIssues}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedTab("stale_raters")}
                        className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
                            selectedTab === "stale_raters"
                                ? "bg-amber-600 text-white shadow-xs"
                                : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <CalendarClock className="size-3" />
                        <span>Penilai Tertunda (&gt;2 Hari)</span>
                        <span
                            className={cn(
                                "text-[10px] px-1.5 py-0.2 rounded-full",
                                selectedTab === "stale_raters"
                                    ? "bg-white/20 text-white"
                                    : "bg-background/80 text-foreground"
                            )}
                        >
                            {staleCount}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedTab("not_started")}
                        className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
                            selectedTab === "not_started"
                                ? "bg-sky-600 text-white shadow-xs"
                                : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <UserX className="size-3" />
                        <span>Belum Daftarkan Penilai</span>
                        <span
                            className={cn(
                                "text-[10px] px-1.5 py-0.2 rounded-full",
                                selectedTab === "not_started"
                                    ? "bg-white/20 text-white"
                                    : "bg-background/80 text-foreground"
                            )}
                        >
                            {notStartedCount}
                        </span>
                    </button>

                    {failedEmailsCount > 0 && (
                        <button
                            type="button"
                            onClick={() => setSelectedTab("failed_emails")}
                            className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
                                selectedTab === "failed_emails"
                                    ? "bg-destructive text-destructive-foreground shadow-xs"
                                    : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <AlertCircle className="size-3" />
                            <span>Email Gagal</span>
                            <span
                                className={cn(
                                    "text-[10px] px-1.5 py-0.2 rounded-full",
                                    selectedTab === "failed_emails"
                                        ? "bg-white/20 text-white"
                                        : "bg-background/80 text-foreground"
                                )}
                            >
                                {failedEmailsCount}
                            </span>
                        </button>
                    )}
                </div>
            </CardHeader>

            {/* Kontainer Tabel yang Bisa di-Scroll Vertikal */}
            <CardContent className="p-0 flex-1">
                {filteredRows.length === 0 ? (
                    <div className="py-12">
                        <EmptyState
                            icon={CircleCheck}
                            title="Semua dalam kondisi baik"
                            description={
                                selectedTab === "all"
                                    ? "Tidak ada kendala pada asesmen peserta saat ini."
                                    : "Tidak ada data pada kategori perhatian ini."
                            }
                        />
                    </div>
                ) : (
                    <div className="max-h-[440px] overflow-y-auto overflow-x-auto relative divide-y divide-border/60">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-xs shadow-2xs">
                                <TableRow className="hover:bg-transparent border-b border-border/70 text-xs">
                                    <TableHead className="w-[260px] pl-5 font-semibold text-foreground bg-muted/95">
                                        Peserta & Perusahaan
                                    </TableHead>
                                    <TableHead className="w-[180px] font-semibold text-foreground bg-muted/95">
                                        Kategori Isu
                                    </TableHead>
                                    <TableHead className="min-w-[240px] font-semibold text-foreground bg-muted/95">
                                        Rincian & Target
                                    </TableHead>
                                    <TableHead className="w-[160px] font-semibold text-foreground bg-muted/95">
                                        Durasi / Status
                                    </TableHead>
                                    <TableHead className="w-[140px] pr-5 text-right font-semibold text-foreground bg-muted/95">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className="hover:bg-muted/30 transition-colors text-xs"
                                    >
                                        {/* Peserta & Perusahaan */}
                                        <TableCell className="pl-5 py-3 align-top">
                                            <div className="space-y-0.5">
                                                {row.detail_url ? (
                                                    <Link
                                                        href={row.detail_url}
                                                        className="font-bold text-foreground hover:text-primary hover:underline inline-flex items-center gap-1 text-sm leading-snug"
                                                    >
                                                        <span>
                                                            {
                                                                row.participant_name
                                                            }
                                                        </span>
                                                        <ExternalLink className="size-3 text-muted-foreground opacity-60 hover:opacity-100" />
                                                    </Link>
                                                ) : (
                                                    <span className="font-bold text-foreground text-sm leading-snug">
                                                        {row.participant_name}
                                                    </span>
                                                )}
                                                <div className="flex flex-col text-[11px] text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1 truncate font-medium">
                                                        <Building2 className="size-3 shrink-0 text-muted-foreground/80" />
                                                        <span className="truncate">
                                                            {row.company}
                                                        </span>
                                                    </span>
                                                    {row.position &&
                                                        row.position !==
                                                            "-" && (
                                                            <span className="inline-flex items-center gap-1 truncate text-muted-foreground/80">
                                                                <Briefcase className="size-3 shrink-0" />
                                                                <span className="truncate">
                                                                    {
                                                                        row.position
                                                                    }
                                                                </span>
                                                            </span>
                                                        )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Kategori Isu */}
                                        <TableCell className="py-3 align-top">
                                            {row.key === "stale_raters" && (
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800 text-[11px] gap-1 px-2 py-0.5"
                                                >
                                                    <CalendarClock className="size-3" />
                                                    <span>
                                                        Penilai Tertunda
                                                    </span>
                                                </Badge>
                                            )}
                                            {row.key === "not_started" && (
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-sky-100 text-sky-900 border border-sky-300 dark:bg-sky-950/80 dark:text-sky-200 dark:border-sky-800 text-[11px] gap-1 px-2 py-0.5"
                                                >
                                                    <UserX className="size-3" />
                                                    <span>
                                                        Belum Daftarkan
                                                    </span>
                                                </Badge>
                                            )}
                                            {row.key === "failed_emails" && (
                                                <Badge
                                                    variant="destructive"
                                                    className="text-[11px] gap-1 px-2 py-0.5"
                                                >
                                                    <AlertCircle className="size-3" />
                                                    <span>Email Gagal</span>
                                                </Badge>
                                            )}
                                        </TableCell>

                                        {/* Rincian & Target */}
                                        <TableCell className="py-3 align-top">
                                            {row.key === "stale_raters" && (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {row.rater_role && (
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "text-[10px] px-1.5 py-0 font-medium",
                                                                    row.rater_role
                                                                        .toLowerCase()
                                                                        .includes(
                                                                            "atasan"
                                                                        )
                                                                        ? "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200"
                                                                        : "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200"
                                                                )}
                                                            >
                                                                {row.rater_role}
                                                            </Badge>
                                                        )}
                                                        <span className="font-mono text-[11px] text-foreground font-medium">
                                                            {row.rater_email}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Tautan asesmen belum
                                                        diselesaikan
                                                    </p>
                                                </div>
                                            )}

                                            {row.key === "not_started" && (
                                                <p className="text-muted-foreground text-xs leading-relaxed">
                                                    Formasi wajib (1 atasan + 3
                                                    bawahan) belum didaftarkan
                                                    oleh peserta.
                                                </p>
                                            )}

                                            {row.key === "failed_emails" && (
                                                <div className="space-y-0.5">
                                                    <div className="font-mono text-[11px] text-foreground">
                                                        Tujuan:{" "}
                                                        {row.recipient_email}
                                                    </div>
                                                    {row.error_message && (
                                                        <p className="text-[11px] text-destructive font-mono truncate max-w-sm">
                                                            {row.error_message}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* Durasi / Status */}
                                        <TableCell className="py-3 align-top">
                                            {row.key === "stale_raters" && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                                    <Clock className="size-3" />
                                                    Menunggu {row.days_pending}{" "}
                                                    hari
                                                </span>
                                            )}
                                            {row.key === "not_started" && (
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    Menunggu registrasi
                                                </span>
                                            )}
                                            {row.key === "failed_emails" && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-xs bg-destructive/10 text-destructive border border-destructive/20">
                                                    Pengiriman gagal
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Aksi */}
                                        <TableCell className="pr-5 py-3 align-top text-right">
                                            {row.key === "stale_raters" ? (
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs gap-1 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
                                                >
                                                    <Link
                                                        href={remindersIndex()}
                                                    >
                                                        <BellRing className="size-3" />
                                                        <span>Ingatkan</span>
                                                    </Link>
                                                </Button>
                                            ) : row.detail_url ? (
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs gap-1 hover:bg-muted transition-colors cursor-pointer"
                                                >
                                                    <Link href={row.detail_url}>
                                                        <span>Detail</span>
                                                        <ArrowUpRight className="size-3" />
                                                    </Link>
                                                </Button>
                                            ) : null}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Footer Card Ringkas */}
                {totalIssues > 0 && (
                    <div className="px-5 py-3 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                        <div>
                            Menampilkan seluruh {filteredRows.length} data
                            tindakan yang memerlukan perhatian
                            {selectedTab !== "all" && ` (${selectedTab})`}.
                        </div>
                        <div className="text-[11px] text-muted-foreground/80 italic">
                            Gulir ke bawah untuk melihat data lainnya
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
