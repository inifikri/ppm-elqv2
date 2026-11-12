import {
    AlertTriangle,
    ArrowLeft,
    BellRing,
    Briefcase,
    Building2,
    CalendarClock,
    Clock,
    ExternalLink,
    Filter,
    Mail,
    MailCheck,
    RefreshCw,
    Search,
    Send,
    ShieldAlert,
    User,
    X,
} from "lucide-react";
import { Head, Link, router } from "@inertiajs/react";
import { useCallback, useId, useState } from "react";
import { BulkActionBar, type BulkAction } from "@/components/bulk-action-bar";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/page-container";
import Pagination from "@/components/pagination";
import { SearchInput } from "@/components/search-input";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { dashboard } from "@/routes";
import { bulk, index as remindersIndex, remind } from "@/routes/admin/reminders";
import type { Paginated } from "@/types/user-management";

type ReminderRow = {
    id: number;
    ulid: string;
    role: string;
    role_label: string;
    email: string;
    created_at: string;
    created_at_formatted: string;
    days_pending: number;
    is_critical: boolean;
    can_remind: boolean;
    participant: {
        id: number | null;
        name: string;
        email: string | null;
        company: string;
        position: string;
        detail_url: string | null;
    };
};

type Props = {
    reminders: Paginated<ReminderRow>;
    filters: {
        q: string;
        role: string | null;
        min_days: number;
    };
    stats: {
        total_overdue: number;
        critical_overdue: number;
        reminded_today: number;
    };
};

export default function RemindersIndex({ reminders, filters, stats }: Props) {
    const [q, setQ] = useState(filters.q || "");
    const [selectedRole, setSelectedRole] = useState(filters.role || "all");
    const [minDays, setMinDays] = useState(String(filters.min_days || 2));
    const [loading, setLoading] = useState(false);

    // Seleksi Checkbox
    const [selected, setSelected] = useState<Set<number>>(new Set());

    // State Dialog Bulk Action
    const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
    const [bulkProcessing, setBulkProcessing] = useState(false);

    // State Dialog Single Action
    const [singleTarget, setSingleTarget] = useState<ReminderRow | null>(null);
    const [singleProcessing, setSingleProcessing] = useState(false);

    const roleFilterId = useId();
    const daysFilterId = useId();

    const applyFilters = useCallback(
        (newFilters: { q?: string; role?: string; min_days?: string }) => {
            setLoading(true);
            const query: Record<string, string> = {};

            const nextQ = newFilters.q !== undefined ? newFilters.q : q;
            const nextRole =
                newFilters.role !== undefined ? newFilters.role : selectedRole;
            const nextDays =
                newFilters.min_days !== undefined ? newFilters.min_days : minDays;

            if (nextQ.trim()) query.q = nextQ.trim();
            if (nextRole && nextRole !== "all") query.role = nextRole;
            if (nextDays && nextDays !== "2") query.min_days = nextDays;

            router.get(remindersIndex({ query }), {}, {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setLoading(false),
            });
        },
        [q, selectedRole, minDays]
    );

    const onSearchChange = (value: string) => {
        setQ(value);
        applyFilters({ q: value });
    };

    const onRoleChange = (val: string) => {
        setSelectedRole(val);
        applyFilters({ role: val });
    };

    const onDaysChange = (val: string) => {
        setMinDays(val);
        applyFilters({ min_days: val });
    };

    const pageUrl = (page: number) => {
        const query: Record<string, string | number> = { page };
        if (q.trim()) query.q = q.trim();
        if (selectedRole && selectedRole !== "all") query.role = selectedRole;
        if (minDays && minDays !== "2") query.min_days = minDays;
        return remindersIndex({ query });
    };

    // Checkbox toggles
    const allSelected =
        reminders.data.length > 0 &&
        reminders.data.every((r) => selected.has(r.id));

    const toggleSelectAll = (checked: boolean | "indeterminate") => {
        if (checked === true) {
            setSelected(new Set(reminders.data.map((r) => r.id)));
        } else {
            setSelected(new Set());
        }
    };

    const toggleRow = (id: number) => {
        const next = new Set(selected);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelected(next);
    };

    // Eksekusi Bulk Send Reminder
    const handleExecuteBulk = () => {
        if (selected.size === 0 || bulkProcessing) return;

        setBulkProcessing(true);
        router.post(
            bulk.url(),
            { rater_ids: Array.from(selected) },
            {
                preserveScroll: true,
                onFinish: () => {
                    setBulkProcessing(false);
                    setBulkConfirmOpen(false);
                    setSelected(new Set());
                },
            }
        );
    };

    // Eksekusi Single Reminder
    const handleExecuteSingle = () => {
        if (!singleTarget || singleProcessing) return;

        setSingleProcessing(true);
        router.post(
            remind.url({ rater: singleTarget.ulid }),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setSingleProcessing(false);
                    setSingleTarget(null);
                },
            }
        );
    };

    const bulkActions: BulkAction[] = [
        {
            label: `Kirim Pengingat Masal (${selected.size})`,
            icon: Send,
            onClick: () => setBulkConfirmOpen(true),
        },
    ];

    // Daftar penilai yang terpilih untuk dialog preview
    const selectedRows = reminders.data.filter((r) => selected.has(r.id));

    return (
        <>
            <Head title="Pengingat Penilai Asesmen" />
            <PageContainer>
                {/* Header Halaman */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-border/60">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <BellRing className="size-5" />
                            </span>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                Pengingat Penilai Asesmen
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Kelola penilai yang belum menyelesaikan penilaian
                            lebih dari 2 hari. Kirimkan email pengingat secara
                            individual atau masal.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1.5"
                        >
                            <Link href="/admin/participants">
                                <ArrowLeft className="size-3.5" />
                                <span>Kembali ke Peserta</span>
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.reload({ only: ["reminders", "stats"] })}
                            className="text-xs gap-1.5"
                            title="Segarkan data"
                        >
                            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
                            <span>Segarkan</span>
                        </Button>
                    </div>
                </div>

                {/* KPI Mini Cards */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                    <Card className="shadow-none border border-amber-200/80 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                                    Total Menunggu &gt; 2 Hari
                                </p>
                                <p className="text-2xl font-bold text-amber-950 dark:text-amber-100">
                                    {stats.total_overdue}
                                </p>
                                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                                    Penilai belum menyelesaikan asesmen
                                </p>
                            </div>
                            <div className="size-11 rounded-full bg-amber-200/60 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300">
                                <CalendarClock className="size-5.5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-none border border-destructive/20 bg-destructive-subtle/30">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-destructive">
                                    Menunggu Kritis &gt; 7 Hari
                                </p>
                                <p className="text-2xl font-bold text-foreground">
                                    {stats.critical_overdue}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    Memerlukan atensi prioritas admin
                                </p>
                            </div>
                            <div className="size-11 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                                <ShieldAlert className="size-5.5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-none border border-success/30 bg-success-subtle/30">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-success-foreground">
                                    Pengingat Hari Ini
                                </p>
                                <p className="text-2xl font-bold text-foreground">
                                    {stats.reminded_today}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    Email reminder terkirim hari ini
                                </p>
                            </div>
                            <div className="size-11 rounded-full bg-success/15 flex items-center justify-center text-success">
                                <MailCheck className="size-5.5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter & Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <div className="flex-1 max-w-md">
                        <SearchInput
                            value={q}
                            onValueChange={onSearchChange}
                            label="Cari penilai, peserta, atau perusahaan"
                            placeholder="Cari email penilai, nama peserta, perusahaan..."
                            className="w-full text-xs"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-1.5">
                            <Label
                                htmlFor={roleFilterId}
                                className="text-xs font-medium text-muted-foreground whitespace-nowrap"
                            >
                                Peran:
                            </Label>
                            <Select
                                value={selectedRole}
                                onValueChange={onRoleChange}
                            >
                                <SelectTrigger
                                    id={roleFilterId}
                                    className="h-9 text-xs w-[130px]"
                                >
                                    <SelectValue placeholder="Semua Peran" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Peran</SelectItem>
                                    <SelectItem value="boss">Atasan</SelectItem>
                                    <SelectItem value="subordinate">Bawahan/Rekan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Label
                                htmlFor={daysFilterId}
                                className="text-xs font-medium text-muted-foreground whitespace-nowrap"
                            >
                                Minimal:
                            </Label>
                            <Select
                                value={minDays}
                                onValueChange={onDaysChange}
                            >
                                <SelectTrigger
                                    id={daysFilterId}
                                    className="h-9 text-xs w-[130px]"
                                >
                                    <SelectValue placeholder="2 Hari" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2">&gt; 2 Hari</SelectItem>
                                    <SelectItem value="3">&gt; 3 Hari</SelectItem>
                                    <SelectItem value="5">&gt; 5 Hari</SelectItem>
                                    <SelectItem value="7">&gt; 7 Hari (Kritis)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Banner Status Seleksi Terpilih (Inline Bar) */}
                {selected.size > 0 && (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                                {selected.size}
                            </span>
                            <span>
                                {selected.size} penilai dipilih untuk dikirimi
                                pengingat.
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelected(new Set())}
                                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            >
                                Batal Pilihan
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setBulkConfirmOpen(true)}
                                className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-xs"
                            >
                                <Send className="size-3.5" />
                                <span>Kirim Pengingat Masal ({selected.size})</span>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Tabel Modern */}
                <div className="overflow-x-auto rounded-card border bg-card shadow-none">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60 text-xs">
                                <TableHead className="w-12 pl-4">
                                    <Checkbox
                                        checked={
                                            allSelected
                                                ? true
                                                : selected.size > 0
                                                ? "indeterminate"
                                                : false
                                        }
                                        onCheckedChange={toggleSelectAll}
                                        aria-label="Pilih semua di halaman ini"
                                    />
                                </TableHead>
                                <TableHead className="min-w-[220px] font-semibold text-foreground">
                                    Penilai (Target)
                                </TableHead>
                                <TableHead className="min-w-[240px] font-semibold text-foreground">
                                    Peserta Asesi Terkait
                                </TableHead>
                                <TableHead className="w-[180px] font-semibold text-foreground">
                                    Waktu Terdaftar
                                </TableHead>
                                <TableHead className="w-[160px] font-semibold text-foreground">
                                    Status Menunggu
                                </TableHead>
                                <TableHead className="w-[130px] pr-5 text-right font-semibold text-foreground">
                                    Aksi
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reminders.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-48 text-center py-8"
                                    >
                                        <EmptyState
                                            icon={MailCheck}
                                            title="Tidak ada penilai tertunda"
                                            description="Tidak ditemukan penilai yang belum mengisi asesmen sesuai filter yang dipilih."
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reminders.data.map((row) => {
                                    const isRowSelected = selected.has(row.id);

                                    return (
                                        <TableRow
                                            key={row.id}
                                            className={cn(
                                                "hover:bg-muted/30 transition-colors text-xs",
                                                isRowSelected &&
                                                    "bg-primary/5 hover:bg-primary/10"
                                            )}
                                        >
                                            {/* Checkbox */}
                                            <TableCell className="pl-4 py-3 align-top">
                                                <Checkbox
                                                    checked={isRowSelected}
                                                    onCheckedChange={() =>
                                                        toggleRow(row.id)
                                                    }
                                                    aria-label={`Pilih penilai ${row.email}`}
                                                />
                                            </TableCell>

                                            {/* Penilai */}
                                            <TableCell className="py-3 align-top">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-[10px] px-1.5 py-0 font-medium",
                                                                row.role === "boss" ||
                                                                row.role === "atasan"
                                                                    ? "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200"
                                                                    : "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200"
                                                            )}
                                                        >
                                                            {row.role_label}
                                                        </Badge>
                                                        <span className="font-mono text-xs font-semibold text-foreground">
                                                            {row.email}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                        <Mail className="size-3 text-muted-foreground/70" />
                                                        <span>
                                                            Tautan asesmen belum
                                                            diselesaikan
                                                        </span>
                                                    </p>
                                                </div>
                                            </TableCell>

                                            {/* Peserta Asesi */}
                                            <TableCell className="py-3 align-top">
                                                <div className="space-y-0.5">
                                                    {row.participant
                                                        .detail_url ? (
                                                        <Link
                                                            href={
                                                                row.participant
                                                                    .detail_url
                                                            }
                                                            className="font-bold text-foreground hover:text-primary hover:underline inline-flex items-center gap-1 text-sm leading-snug"
                                                        >
                                                            <span>
                                                                {
                                                                    row.participant
                                                                        .name
                                                                }
                                                            </span>
                                                            <ExternalLink className="size-3 text-muted-foreground opacity-60 hover:opacity-100" />
                                                        </Link>
                                                    ) : (
                                                        <span className="font-bold text-foreground text-sm leading-snug">
                                                            {
                                                                row.participant
                                                                    .name
                                                            }
                                                        </span>
                                                    )}
                                                    <div className="flex flex-col text-[11px] text-muted-foreground">
                                                        <span className="inline-flex items-center gap-1 truncate font-medium">
                                                            <Building2 className="size-3 shrink-0 text-muted-foreground/80" />
                                                            <span className="truncate">
                                                                {
                                                                    row
                                                                        .participant
                                                                        .company
                                                                }
                                                            </span>
                                                        </span>
                                                        {row.participant
                                                            .position &&
                                                            row.participant
                                                                .position !==
                                                                "-" && (
                                                                <span className="inline-flex items-center gap-1 truncate text-muted-foreground/80">
                                                                    <Briefcase className="size-3 shrink-0" />
                                                                    <span className="truncate">
                                                                        {
                                                                            row
                                                                                .participant
                                                                                .position
                                                                        }
                                                                    </span>
                                                                </span>
                                                            )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Waktu Terdaftar */}
                                            <TableCell className="py-3 align-top">
                                                <div className="space-y-0.5 text-xs text-muted-foreground">
                                                    <p className="font-medium text-foreground">
                                                        {
                                                            row.created_at_formatted
                                                        }
                                                    </p>
                                                    <p className="text-[11px]">
                                                        {row.days_pending} hari
                                                        yang lalu
                                                    </p>
                                                </div>
                                            </TableCell>

                                            {/* Status Menunggu */}
                                            <TableCell className="py-3 align-top">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold text-xs border",
                                                        row.is_critical
                                                            ? "bg-destructive/10 text-destructive border-destructive/30"
                                                            : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                                    )}
                                                >
                                                    <Clock className="size-3.5" />
                                                    <span>
                                                        Menunggu{" "}
                                                        {row.days_pending} hari
                                                    </span>
                                                </span>
                                            </TableCell>

                                            {/* Aksi Tunggal */}
                                            <TableCell className="pr-5 py-3 align-top text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setSingleTarget(row)
                                                    }
                                                    disabled={!row.can_remind}
                                                    className="h-8 text-xs gap-1 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
                                                    title={
                                                        row.can_remind
                                                            ? "Kirim email pengingat sekarang"
                                                            : "Baru saja diingatkan (< 1 menit)"
                                                    }
                                                >
                                                    <BellRing className="size-3" />
                                                    <span>Ingatkan</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {reminders.total > 0 && (
                    <div className="pt-2">
                        <Pagination
                            paginator={reminders}
                            pageUrl={pageUrl}
                        />
                    </div>
                )}

                {/* Floating Bulk Action Bar */}
                <BulkActionBar
                    selectedCount={selected.size}
                    actions={bulkActions}
                    onClear={() => setSelected(new Set())}
                />

                {/* Dialog Konfirmasi Bulk Action */}
                <AlertDialog
                    open={bulkConfirmOpen}
                    onOpenChange={setBulkConfirmOpen}
                >
                    <AlertDialogContent className="sm:max-w-lg">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                                <Send className="size-5 text-primary" />
                                <span>Konfirmasi Kirim Pengingat Masal</span>
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                                Anda akan mengirimkan email pengingat resmi PPM
                                Manajemen kepada{" "}
                                <strong className="text-foreground">
                                    {selected.size} penilai
                                </strong>{" "}
                                terpilih yang belum menyelesaikan penilaian
                                asesmen lebih dari 2 hari.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="space-y-3 py-2 text-xs">
                            <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-2 max-h-48 overflow-y-auto">
                                <p className="font-semibold text-foreground text-[11px]">
                                    Daftar Penilai Terpilih ({selected.size}):
                                </p>
                                <div className="space-y-1.5 font-mono text-[11px]">
                                    {selectedRows.map((r) => (
                                        <div
                                            key={r.id}
                                            className="flex items-center justify-between gap-2 border-b border-border/30 pb-1"
                                        >
                                            <span className="text-foreground truncate">
                                                {r.email} ({r.role_label})
                                            </span>
                                            <span className="text-muted-foreground shrink-0 text-[10px]">
                                                Asesi: {r.participant.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] space-y-1">
                                <p className="font-semibold text-primary">
                                    Format Pesan Baku PPM Manajemen:
                                </p>
                                <p className="text-muted-foreground italic leading-relaxed">
                                    &ldquo;Mengingat batas waktu pelaksanaan
                                    asesmen kepemimpinan ELQ 360°, kami mohon
                                    kesediaan Bapak/Ibu untuk meluangkan waktu
                                    sejenak guna menyelesaikan kuesioner
                                    evaluasi...&rdquo;
                                </p>
                            </div>
                        </div>

                        <AlertDialogFooter>
                            <AlertDialogCancel
                                disabled={bulkProcessing}
                                className="text-xs"
                            >
                                Batal
                            </AlertDialogCancel>
                            <Button
                                onClick={handleExecuteBulk}
                                loading={bulkProcessing}
                                disabled={bulkProcessing}
                                className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                            >
                                <Send className="size-3.5" />
                                <span>
                                    {bulkProcessing
                                        ? "Mengirim..."
                                        : `Ya, Kirim ke ${selected.size} Penilai`}
                                </span>
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Dialog Konfirmasi Single Action */}
                <AlertDialog
                    open={singleTarget !== null}
                    onOpenChange={(open) => !open && setSingleTarget(null)}
                >
                    <AlertDialogContent className="sm:max-w-md">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                                <BellRing className="size-5 text-primary" />
                                <span>Kirim Pengingat Penilai</span>
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                                Kirimkan email pengingat evaluasi kepemimpinan
                                kepada penilai berikut:
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        {singleTarget && (
                            <div className="space-y-3 py-2 text-xs">
                                <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-1.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">
                                            Penilai:
                                        </span>
                                        <span className="font-mono font-semibold text-foreground">
                                            {singleTarget.email}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">
                                            Peranan:
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] px-2 py-0"
                                        >
                                            {singleTarget.role_label}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">
                                            Peserta Asesi:
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {singleTarget.participant.name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">
                                            Waktu Menunggu:
                                        </span>
                                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                                            {singleTarget.days_pending} hari
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] space-y-1">
                                    <p className="font-semibold text-primary">
                                        Format Pesan Pengingat:
                                    </p>
                                    <p className="text-muted-foreground italic leading-relaxed">
                                        Email formal PPM Manajemen berisi tautan
                                        resmi yang mengarahkan penilai langsung
                                        ke instrumen kuesioner tanpa perlu login.
                                    </p>
                                </div>
                            </div>
                        )}

                        <AlertDialogFooter>
                            <AlertDialogCancel
                                disabled={singleProcessing}
                                className="text-xs"
                            >
                                Batal
                            </AlertDialogCancel>
                            <Button
                                onClick={handleExecuteSingle}
                                loading={singleProcessing}
                                disabled={singleProcessing}
                                className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                            >
                                <Send className="size-3.5" />
                                <span>
                                    {singleProcessing
                                        ? "Mengirim..."
                                        : "Kirim Pengingat"}
                                </span>
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </PageContainer>
        </>
    );
}

RemindersIndex.layout = {
    breadcrumbs: [
        {
            title: "Dashboard",
            href: dashboard(),
        },
        {
            title: "Pengingat Penilai",
            href: remindersIndex(),
        },
    ],
};
