import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Eye,
    Inbox,
    Mail,
    RotateCcw,
    Send,
    User as UserIcon,
} from "lucide-react";
import { Head, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { BulkActionBar, type BulkAction } from "@/components/bulk-action-bar";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import Pagination from "@/components/pagination";
import { SearchInput } from "@/components/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    bulkRetry,
    index as emailLogsIndex,
    retry as retryEmailLog,
} from "@/routes/admin/email-logs";
import type { Paginated } from "@/types";

export type EmailLogItem = {
    id: number;
    type: string;
    type_label: string;
    recipient_email: string;
    status: "queued" | "sent" | "failed";
    status_label: string;
    attempts: number;
    message_id: string | null;
    error_message: string | null;
    user: { id: number; name: string; email: string } | null;
    rater: { id: number; role: string; role_label: string } | null;
    queued_at: string | null;
    sent_at: string | null;
    failed_at: string | null;
    created_at: string;
};

export type EmailLogStats = {
    total: number;
    sent: number;
    queued: number;
    failed: number;
};

export type EmailLogFilters = {
    search?: string;
    status?: string;
    type?: string;
};

const dateTime = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
});

const formatDate = (iso: string | null | undefined) =>
    iso ? dateTime.format(new Date(iso)) : "-";

function getStatusBadge(status: string) {
    switch (status) {
        case "sent":
            return (
                <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-medium px-2 py-0.5 inline-flex items-center gap-1"
                >
                    <CheckCircle2 className="size-3" /> Terkirim
                </Badge>
            );
        case "queued":
            return (
                <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[11px] font-medium px-2 py-0.5 inline-flex items-center gap-1"
                >
                    <Clock className="size-3" /> Antre
                </Badge>
            );
        case "failed":
            return (
                <Badge
                    variant="outline"
                    className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 text-[11px] font-medium px-2 py-0.5 inline-flex items-center gap-1"
                >
                    <AlertTriangle className="size-3" /> Gagal
                </Badge>
            );
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

function getTypeBadge(type: string, label: string) {
    switch (type) {
        case "rater_invitation":
            return (
                <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 text-[11px]"
                >
                    {label}
                </Badge>
            );
        case "result_share":
        case "assessment_result":
            return (
                <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 text-[11px]"
                >
                    {label}
                </Badge>
            );
        case "password_reset":
            return (
                <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 text-[11px]"
                >
                    {label}
                </Badge>
            );
        case "email_verification":
            return (
                <Badge
                    variant="secondary"
                    className="bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 text-[11px]"
                >
                    {label}
                </Badge>
            );
        default:
            return <Badge variant="outline">{label}</Badge>;
    }
}

export default function EmailLogsIndex({
    logs,
    stats,
    filters,
    availableStatuses = [],
    availableTypes = [],
}: {
    logs: Paginated<EmailLogItem>;
    stats: EmailLogStats;
    filters: EmailLogFilters;
    availableStatuses: { value: string; label: string }[];
    availableTypes: { value: string; label: string }[];
}) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [status, setStatus] = useState(filters.status ?? "all");
    const [type, setType] = useState(filters.type ?? "all");
    const [loading, setLoading] = useState(false);
    const [retryingId, setRetryingId] = useState<number | null>(null);
    const [bulkRetrying, setBulkRetrying] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<EmailLogItem | null>(
        null,
    );

    // Selection scope for bulk actions
    const scope = `${logs.current_page}|${filters.search ?? ""}|${filters.status ?? ""}|${filters.type ?? ""}`;
    const [picked, setPicked] = useState<{ scope: string; ids: Set<number> }>({
        scope,
        ids: new Set(),
    });
    const selected = picked.scope === scope ? picked.ids : new Set<number>();
    const clearSelection = () => setPicked({ scope, ids: new Set() });

    const failedLogs = logs.data.filter((l) => l.status === "failed");

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setPicked({
                scope,
                ids: new Set(failedLogs.map((l) => l.id)),
            });
        } else {
            clearSelection();
        }
    };

    const toggleSelectRow = (id: number, checked: boolean) => {
        const next = new Set(selected);
        if (checked) {
            next.add(id);
        } else {
            next.delete(id);
        }
        setPicked({ scope, ids: next });
    };

    const isAllSelected =
        failedLogs.length > 0 && failedLogs.every((l) => selected.has(l.id));

    const applyFilters = (newFilters: {
        search?: string;
        status?: string;
        type?: string;
    }) => {
        const nextSearch =
            newFilters.search !== undefined ? newFilters.search : search;
        const nextStatus =
            newFilters.status !== undefined ? newFilters.status : status;
        const nextType = newFilters.type !== undefined ? newFilters.type : type;

        router.get(
            emailLogsIndex().url,
            {
                search: nextSearch || undefined,
                status: nextStatus === "all" ? undefined : nextStatus,
                type: nextType === "all" ? undefined : nextType,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    useEffect(() => {
        if (search === (filters.search ?? "")) return;

        const timer = setTimeout(() => {
            applyFilters({ search });
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const offStart = router.on("start", () => setLoading(true));
        const offFinish = router.on("finish", () => setLoading(false));

        return () => {
            offStart();
            offFinish();
        };
    }, []);

    const resetFilters = () => {
        setSearch("");
        setStatus("all");
        setType("all");
        router.get(
            emailLogsIndex().url,
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const hasActiveFilters =
        Boolean(search) || status !== "all" || type !== "all";

    const handleRetry = (log: EmailLogItem) => {
        setRetryingId(log.id);
        router.post(
            retryEmailLog.url({ emailLog: log.id }),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setRetryingId(null);
                    if (selectedDetail?.id === log.id) {
                        setSelectedDetail(null);
                    }
                },
            },
        );
    };

    const handleBulkRetry = () => {
        if (selected.size === 0) return;
        setBulkRetrying(true);
        router.post(
            bulkRetry.url(),
            { ids: [...selected] },
            {
                preserveScroll: true,
                onSuccess: () => clearSelection(),
                onFinish: () => setBulkRetrying(false),
            },
        );
    };

    const bulkActions: BulkAction[] = [
        {
            label: bulkRetrying ? "Menjadwalkan..." : "Kirim Ulang Terpilih",
            icon: RotateCcw,
            confirm: {
                title: "Kirim ulang email terpilih?",
                description: `Sistem akan menjadwalkan ulang ${selected.size} email yang dipilih ke antrean pengiriman.`,
            },
            onClick: handleBulkRetry,
        },
    ];

    const pageUrl = (page: number) =>
        emailLogsIndex({
            query: {
                search: filters.search || undefined,
                status: filters.status || undefined,
                type: filters.type || undefined,
                page,
            },
        }).url;

    return (
        <PageContainer className={cn(selected.size > 0 && "pb-24")}>
            <Head title="Email Log" />

            <PageHeader
                title="Email Log"
                description="Monitoring status antrean, pengiriman, dan riwayat email sistem ELQ 360°"
            />

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Inbox className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">
                            Total Email
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                            {stats.total.toLocaleString("id-ID")}
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">
                            Terkirim
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                            {stats.sent.toLocaleString("id-ID")}
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Clock className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">
                            Dalam Antrean
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                            {stats.queued.toLocaleString("id-ID")}
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <AlertTriangle className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">
                            Gagal Terkirim
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-rose-700 dark:text-rose-400 mt-0.5">
                            {stats.failed.toLocaleString("id-ID")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
                <div className="flex-1">
                    <SearchInput
                        label="Cari email log"
                        placeholder="Cari email penerima, pesan error, atau ID pesan..."
                        value={search}
                        onValueChange={setSearch}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        value={status}
                        onValueChange={(val) => {
                            setStatus(val);
                            applyFilters({ status: val });
                        }}
                    >
                        <SelectTrigger className="w-[140px] text-xs">
                            <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            {availableStatuses.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={type}
                        onValueChange={(val) => {
                            setType(val);
                            applyFilters({ type: val });
                        }}
                    >
                        <SelectTrigger className="w-[160px] text-xs">
                            <SelectValue placeholder="Semua Jenis Email" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                Semua Jenis Email
                            </SelectItem>
                            {availableTypes.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={RotateCcw}
                            onClick={resetFilters}
                            className="text-xs text-muted-foreground"
                        >
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            {/* Email Logs Table */}
            <div
                className={cn(
                    "rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs transition-opacity",
                    loading && "opacity-60",
                )}
            >
                {logs.data.length === 0 ? (
                    <div className="p-8">
                        <EmptyState
                            icon={Mail}
                            title="Belum ada riwayat email"
                            description={
                                hasActiveFilters
                                    ? "Tidak ada log email yang cocok dengan kriteria pencarian Anda."
                                    : "Log pengiriman email akan otomatis tercatat ketika sistem mengirim undangan atau notifikasi."
                            }
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border/70 bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                                <tr>
                                    <th className="w-10 px-4 py-3 sm:pl-6">
                                        <Checkbox
                                            checked={isAllSelected}
                                            disabled={failedLogs.length === 0}
                                            onCheckedChange={(c) =>
                                                toggleSelectAll(c === true)
                                            }
                                            aria-label="Pilih semua email gagal"
                                        />
                                    </th>
                                    <th className="px-4 py-3">Penerima</th>
                                    <th className="px-4 py-3">Jenis Email</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-center">
                                        Percobaan
                                    </th>
                                    <th className="px-4 py-3">Waktu</th>
                                    <th className="px-4 py-3 text-right sm:pr-6">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {logs.data.map((item) => {
                                    const isSelected = selected.has(item.id);
                                    const isRetrying = retryingId === item.id;

                                    return (
                                        <tr
                                            key={item.id}
                                            className={cn(
                                                "hover:bg-muted/30 transition-colors",
                                                isSelected && "bg-primary/5",
                                            )}
                                        >
                                            <td className="w-10 px-4 py-3 sm:pl-6">
                                                <Checkbox
                                                    checked={isSelected}
                                                    disabled={
                                                        item.status !== "failed"
                                                    }
                                                    onCheckedChange={(c) =>
                                                        toggleSelectRow(
                                                            item.id,
                                                            c === true,
                                                        )
                                                    }
                                                    aria-label={`Pilih log email ${item.id}`}
                                                    title={
                                                        item.status !== "failed"
                                                            ? "Hanya email berstatus gagal yang dapat dipilih untuk kirim ulang"
                                                            : undefined
                                                    }
                                                />
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="space-y-0.5">
                                                    <p className="font-semibold text-foreground text-xs break-all">
                                                        {item.recipient_email}
                                                    </p>
                                                    {item.user && (
                                                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                            <UserIcon className="size-3" />
                                                            <span>
                                                                Peserta:{" "}
                                                                {item.user.name}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {item.rater && (
                                                        <p className="text-[11px] text-purple-700 dark:text-purple-300">
                                                            Penilai:{" "}
                                                            {
                                                                item.rater
                                                                    .role_label
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {getTypeBadge(
                                                    item.type,
                                                    item.type_label,
                                                )}
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {getStatusBadge(item.status)}
                                                {item.status === "failed" &&
                                                    item.error_message && (
                                                        <p
                                                            className="text-[11px] text-rose-600 dark:text-rose-400 truncate max-w-[200px] mt-0.5"
                                                            title={
                                                                item.error_message
                                                            }
                                                        >
                                                            {item.error_message}
                                                        </p>
                                                    )}
                                            </td>

                                            <td className="px-4 py-3 text-center whitespace-nowrap text-xs text-muted-foreground font-mono">
                                                {item.attempts}x
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                                                {item.status === "sent" &&
                                                item.sent_at
                                                    ? formatDate(item.sent_at)
                                                    : item.status ===
                                                            "failed" &&
                                                        item.failed_at
                                                      ? formatDate(
                                                            item.failed_at,
                                                        )
                                                      : formatDate(
                                                            item.queued_at ||
                                                                item.created_at,
                                                        )}
                                            </td>

                                            <td className="px-4 py-3 text-right whitespace-nowrap sm:pr-6">
                                                <div className="flex items-center justify-end gap-1">
                                                    {item.status ===
                                                        "failed" && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2.5 text-xs text-primary hover:text-primary"
                                                            icon={RotateCcw}
                                                            disabled={
                                                                isRetrying
                                                            }
                                                            onClick={() =>
                                                                handleRetry(
                                                                    item,
                                                                )
                                                            }
                                                            title="Kirim ulang email sekarang"
                                                        >
                                                            {isRetrying
                                                                ? "Mengirim..."
                                                                : "Kirim Ulang"}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                                                        icon={Eye}
                                                        onClick={() =>
                                                            setSelectedDetail(
                                                                item,
                                                            )
                                                        }
                                                        title="Lihat detail log"
                                                    ></Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {logs.data.length > 0 && (
                    <div className="p-4 border-t border-border/70">
                        <Pagination paginator={logs} pageUrl={pageUrl} />
                    </div>
                )}
            </div>

            {/* Floating Bulk Action Bar */}
            <BulkActionBar
                selectedCount={selected.size}
                onClear={clearSelection}
                actions={bulkActions}
            />

            {/* Detail Dialog */}
            <Dialog
                open={selectedDetail !== null}
                onOpenChange={(open) => !open && setSelectedDetail(null)}
            >
                <DialogContent className="w-[calc(100%-2.5rem)] max-w-lg p-6 sm:p-7 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <Mail className="size-4 text-primary" /> Detail Log
                            Email #{selectedDetail?.id}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Riwayat pengiriman ke{" "}
                            <strong className="text-foreground">
                                {selectedDetail?.recipient_email}
                            </strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg bg-muted/40 p-2.5 space-y-0.5">
                                <span className="text-muted-foreground text-[10px] uppercase font-semibold">
                                    Status Pengiriman
                                </span>
                                <div>
                                    {selectedDetail &&
                                        getStatusBadge(selectedDetail.status)}
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    Percobaan: {selectedDetail?.attempts}x
                                </p>
                            </div>

                            <div className="rounded-lg bg-muted/40 p-2.5 space-y-0.5">
                                <span className="text-muted-foreground text-[10px] uppercase font-semibold">
                                    Jenis Email
                                </span>
                                <div>
                                    {selectedDetail &&
                                        getTypeBadge(
                                            selectedDetail.type,
                                            selectedDetail.type_label,
                                        )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1.5 border-b border-border/50">
                                <span className="text-muted-foreground">
                                    Email Penerima:
                                </span>
                                <span className="font-semibold text-foreground break-all">
                                    {selectedDetail?.recipient_email}
                                </span>
                            </div>

                            {selectedDetail?.user && (
                                <div className="flex justify-between py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">
                                        Asesi / Peserta:
                                    </span>
                                    <span className="font-medium text-foreground">
                                        {selectedDetail.user.name}
                                    </span>
                                </div>
                            )}

                            {selectedDetail?.rater && (
                                <div className="flex justify-between py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">
                                        Peran Penilai:
                                    </span>
                                    <span className="font-medium text-foreground">
                                        {selectedDetail.rater.role_label}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between py-1.5 border-b border-border/50">
                                <span className="text-muted-foreground">
                                    Waktu Masuk Antrean:
                                </span>
                                <span className="text-foreground">
                                    {formatDate(selectedDetail?.queued_at)}
                                </span>
                            </div>

                            {selectedDetail?.sent_at && (
                                <div className="flex justify-between py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">
                                        Waktu Berhasil Kirim:
                                    </span>
                                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                                        {formatDate(selectedDetail.sent_at)}
                                    </span>
                                </div>
                            )}

                            {selectedDetail?.failed_at && (
                                <div className="flex justify-between py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">
                                        Waktu Kegagalan:
                                    </span>
                                    <span className="text-rose-700 dark:text-rose-300 font-medium">
                                        {formatDate(selectedDetail.failed_at)}
                                    </span>
                                </div>
                            )}

                            {selectedDetail?.message_id && (
                                <div className="flex justify-between py-1.5 border-b border-border/50">
                                    <span className="text-muted-foreground">
                                        Message ID:
                                    </span>
                                    <span className="font-mono text-[11px] text-foreground truncate max-w-[220px]">
                                        {selectedDetail.message_id}
                                    </span>
                                </div>
                            )}
                        </div>

                        {selectedDetail?.error_message && (
                            <div className="space-y-1.5 pt-1">
                                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                                    <AlertTriangle className="size-3.5" /> Pesan
                                    Error Teknis:
                                </span>
                                <pre className="max-h-40 overflow-y-auto rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-[11px] font-mono leading-relaxed text-destructive whitespace-pre-wrap break-all">
                                    {selectedDetail.error_message}
                                </pre>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDetail(null)}
                        >
                            Tutup
                        </Button>

                        {selectedDetail?.status === "failed" && (
                            <Button
                                variant="default"
                                size="sm"
                                icon={RotateCcw}
                                disabled={retryingId === selectedDetail?.id}
                                onClick={() =>
                                    selectedDetail &&
                                    handleRetry(selectedDetail)
                                }
                            >
                                {retryingId === selectedDetail?.id
                                    ? "Mengirim..."
                                    : "Kirim Ulang Sekarang"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}
