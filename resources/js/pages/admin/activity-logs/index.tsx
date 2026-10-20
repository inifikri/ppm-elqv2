import {
    Eye,
    Filter,
    History,
    RotateCcw,
    Shield,
    User as UserIcon,
} from "lucide-react";
import { Head, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import Pagination from "@/components/pagination";
import { SearchInput } from "@/components/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { index as activityLogsIndex } from "@/routes/admin/activity-logs";
import type { Paginated } from "@/types";

export type ActivityLogItem = {
    id: number;
    log_name: string;
    description: string;
    event: string | null;
    causer_name: string;
    causer_email: string | null;
    subject_type: string | null;
    subject_id: string | number | null;
    properties: Record<string, unknown>;
    created_at: string;
};

export type ActivityLogFilters = {
    search?: string;
    log_name?: string;
    event?: string;
};

const dateTime = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
});

const formatDate = (iso: string | null | undefined) =>
    iso ? dateTime.format(new Date(iso)) : "-";

function getLogBadgeStyle(logName: string) {
    switch (logName) {
        case "auth":
            return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200";
        case "assessment":
            return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200";
        case "evaluators":
        case "raters":
            return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200";
        case "users":
        case "participants":
            return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200";
        case "master":
            return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200";
        default:
            return "bg-muted text-muted-foreground border-border";
    }
}

export default function ActivityLogsIndex({
    activities,
    filters,
    availableLogNames = [],
    availableEvents = [],
}: {
    activities: Paginated<ActivityLogItem>;
    filters: ActivityLogFilters;
    availableLogNames: string[];
    availableEvents: string[];
}) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [logName, setLogName] = useState(filters.log_name ?? "all");
    const [event, setEvent] = useState(filters.event ?? "all");
    const [loading, setLoading] = useState(false);
    const [selectedActivity, setSelectedActivity] =
        useState<ActivityLogItem | null>(null);

    const applyFilters = (newFilters: {
        search?: string;
        log_name?: string;
        event?: string;
    }) => {
        const nextSearch =
            newFilters.search !== undefined ? newFilters.search : search;
        const nextLogName =
            newFilters.log_name !== undefined ? newFilters.log_name : logName;
        const nextEvent =
            newFilters.event !== undefined ? newFilters.event : event;

        router.get(
            activityLogsIndex().url,
            {
                search: nextSearch || undefined,
                log_name: nextLogName === "all" ? undefined : nextLogName,
                event: nextEvent === "all" ? undefined : nextEvent,
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
        setLogName("all");
        setEvent("all");
        router.get(
            activityLogsIndex().url,
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const hasActiveFilters =
        Boolean(search) || logName !== "all" || event !== "all";

    const pageUrl = (page: number) =>
        activityLogsIndex({
            query: {
                search: filters.search || undefined,
                log_name: filters.log_name || undefined,
                event: filters.event || undefined,
                page,
            },
        }).url;

    return (
        <PageContainer>
            <Head title="Activity Log" />

            <PageHeader
                title="Activity Log"
                description="Rekam jejak audit aktivitas pengguna dan operasional sistem ELQ 360°"
            />

            {/* Filter Toolbar */}
            <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
                <div className="flex-1">
                    <SearchInput
                        label="Cari aktivitas"
                        placeholder="Cari deskripsi, pelaku, atau modul..."
                        value={search}
                        onValueChange={setSearch}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        value={logName}
                        onValueChange={(val) => {
                            setLogName(val);
                            applyFilters({ log_name: val });
                        }}
                    >
                        <SelectTrigger className="w-[150px] text-xs">
                            <SelectValue placeholder="Semua Modul" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Modul</SelectItem>
                            {availableLogNames.map((name) => (
                                <SelectItem key={name} value={name}>
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {availableEvents.length > 0 && (
                        <Select
                            value={event}
                            onValueChange={(val) => {
                                setEvent(val);
                                applyFilters({ event: val });
                            }}
                        >
                            <SelectTrigger className="w-[140px] text-xs">
                                <SelectValue placeholder="Semua Aksi" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Aksi</SelectItem>
                                {availableEvents.map((evt) => (
                                    <SelectItem key={evt} value={evt}>
                                        {evt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

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

            {/* Activities Table */}
            <div
                className={cn(
                    "rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs transition-opacity",
                    loading && "opacity-60",
                )}
            >
                {activities.data.length === 0 ? (
                    <div className="p-8">
                        <EmptyState
                            icon={History}
                            title="Belum ada catatan aktivitas"
                            description={
                                hasActiveFilters
                                    ? "Tidak ada data aktivitas yang sesuai dengan filter pencarian."
                                    : "Aktivitas audit sistem akan tercatat secara otomatis di sini."
                            }
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border/70 bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 sm:px-6">Waktu</th>
                                    <th className="px-4 py-3">Modul</th>
                                    <th className="px-4 py-3">Pelaku</th>
                                    <th className="px-4 py-3">
                                        Deskripsi Aktivitas
                                    </th>
                                    <th className="px-4 py-3">Objek</th>
                                    <th className="px-4 py-3 text-right sm:px-6">
                                        Detail
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {activities.data.map((item) => {
                                    const hasProperties =
                                        item.properties &&
                                        Object.keys(item.properties).length > 0;

                                    return (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap sm:px-6">
                                                {formatDate(item.created_at)}
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[11px] font-medium px-2 py-0.5",
                                                        getLogBadgeStyle(
                                                            item.log_name,
                                                        ),
                                                    )}
                                                >
                                                    {item.log_name}
                                                </Badge>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    {item.causer_name ===
                                                    "Sistem" ? (
                                                        <Shield className="size-3.5 text-muted-foreground" />
                                                    ) : (
                                                        <UserIcon className="size-3.5 text-primary" />
                                                    )}
                                                    <span className="font-medium text-foreground text-xs">
                                                        {item.causer_name}
                                                    </span>
                                                </div>
                                                {item.causer_email && (
                                                    <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                                                        {item.causer_email}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 max-w-md">
                                                <div className="space-y-0.5">
                                                    {item.event && (
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1.5">
                                                            [{item.event}]
                                                        </span>
                                                    )}
                                                    <span className="text-foreground text-xs leading-relaxed">
                                                        {item.description}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                                {item.subject_type ? (
                                                    <span className="font-mono text-[11px] bg-muted/60 px-1.5 py-0.5 rounded">
                                                        {item.subject_type}
                                                        {item.subject_id
                                                            ? ` #${item.subject_id}`
                                                            : ""}
                                                    </span>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-right whitespace-nowrap sm:px-6">
                                                {hasProperties ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                                        icon={Eye}
                                                        onClick={() =>
                                                            setSelectedActivity(
                                                                item,
                                                            )
                                                        }
                                                    >
                                                        Lihat
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/50">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {activities.data.length > 0 && (
                    <div className="p-4 border-t border-border/70">
                        <Pagination paginator={activities} pageUrl={pageUrl} />
                    </div>
                )}
            </div>

            {/* Properties Detail Dialog */}
            <Dialog
                open={selectedActivity !== null}
                onOpenChange={(open) => !open && setSelectedActivity(null)}
            >
                <DialogContent className="w-[calc(100%-2.5rem)] max-w-lg p-6 sm:p-7 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <History className="size-4 text-primary" /> Detail
                            Aktivitas #{selectedActivity?.id}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {selectedActivity?.description} &bull;{" "}
                            {formatDate(selectedActivity?.created_at)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 mt-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg bg-muted/40 p-2.5 space-y-0.5">
                                <span className="text-muted-foreground text-[10px] uppercase font-semibold">
                                    Pelaku
                                </span>
                                <p className="font-medium text-foreground">
                                    {selectedActivity?.causer_name}
                                </p>
                                {selectedActivity?.causer_email && (
                                    <p className="text-muted-foreground text-[11px]">
                                        {selectedActivity.causer_email}
                                    </p>
                                )}
                            </div>
                            <div className="rounded-lg bg-muted/40 p-2.5 space-y-0.5">
                                <span className="text-muted-foreground text-[10px] uppercase font-semibold">
                                    Modul & Aksi
                                </span>
                                <p className="font-medium text-foreground">
                                    {selectedActivity?.log_name}
                                </p>
                                {selectedActivity?.event && (
                                    <p className="text-muted-foreground text-[11px] uppercase font-semibold">
                                        [{selectedActivity.event}]
                                    </p>
                                )}
                            </div>
                        </div>

                        {selectedActivity?.subject_type && (
                            <div className="text-xs text-muted-foreground">
                                Objek Target:{" "}
                                <strong className="text-foreground">
                                    {selectedActivity.subject_type}
                                </strong>{" "}
                                (ID: {selectedActivity.subject_id ?? "-"})
                            </div>
                        )}

                        <div className="space-y-1.5 pt-1">
                            <span className="text-xs font-semibold text-foreground">
                                Data Properti:
                            </span>
                            <pre className="max-h-60 overflow-y-auto rounded-xl bg-muted/70 p-3 text-[11px] font-mono leading-relaxed text-foreground whitespace-pre-wrap break-all">
                                {JSON.stringify(
                                    selectedActivity?.properties,
                                    null,
                                    2,
                                )}
                            </pre>
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedActivity(null)}
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}
