import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Eye,
    FileBarChart2,
    Mail,
    Plus,
    RotateCcw,
    Send,
    ShieldAlert,
    Trash2,
    Users,
} from "lucide-react";
import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { BulkActionBar, type BulkAction } from "@/components/bulk-action-bar";
import ConfirmDeleteDialog from "@/components/confirm-delete-dialog";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import Pagination from "@/components/pagination";
import { SearchInput } from "@/components/search-input";
import { StatusBadge, activeStatus } from "@/components/status-badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Paginated, ParticipantListItem } from "@/types";

type Filters = {
    search: string;
    company: string;
    progress: string;
    status: string;
    tab?: string;
    sort?: string;
    direction?: string;
};

export default function ParticipantsIndex({
    participants,
    filters,
    companies,
    trash_count = 0,
}: {
    participants: Paginated<ParticipantListItem>;
    filters: Filters;
    companies: string[];
    trash_count?: number;
}) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [company, setCompany] = useState(filters.company || "all");
    const [progress, setProgress] = useState(filters.progress || "all");
    const [status, setStatus] = useState(filters.status || "all");
    const [tab, setTab] = useState(filters.tab || "all");
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [target, setTarget] = useState<ParticipantListItem | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<ParticipantListItem | null>(null);
    const [forceDeleteTarget, setForceDeleteTarget] = useState<ParticipantListItem | null>(null);

    const isTrash = tab === "trash";

    const applyFilters = (newFilters: Partial<Filters>) => {
        router.get(
            "/admin/participants",
            {
                search:
                    (newFilters.search !== undefined
                        ? newFilters.search
                        : search) || undefined,
                company:
                    (newFilters.company !== undefined
                        ? newFilters.company
                        : company) === "all"
                        ? undefined
                        : (newFilters.company ?? company),
                progress:
                    (newFilters.progress !== undefined
                        ? newFilters.progress
                        : progress) === "all"
                        ? undefined
                        : (newFilters.progress ?? progress),
                status:
                    (newFilters.status !== undefined
                        ? newFilters.status
                        : status) === "all"
                        ? undefined
                        : (newFilters.status ?? status),
                tab:
                    (newFilters.tab !== undefined
                        ? newFilters.tab
                        : tab) === "all"
                        ? undefined
                        : (newFilters.tab ?? tab),
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ["participants", "filters", "trash_count"],
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

    const allSelected =
        participants.data.length > 0 &&
        selected.size === participants.data.length;

    const toggle = (id: number, checked: boolean) =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (checked) {
                next.add(id);
            } else {
                next.delete(id);
            }

            return next;
        });

    const clear = () => setSelected(new Set());

    const runBulk = (action: "resend_invitations" | "send_pdf") =>
        router.post(
            "/admin/participants/bulk",
            { action, ids: [...selected] },
            { preserveScroll: true, onSuccess: clear },
        );

    const bulkActions: BulkAction[] = isTrash
        ? [
              {
                  label: "Pulihkan",
                  icon: RotateCcw,
                  onClick: () =>
                      router.post(
                          "/admin/users/bulk",
                          { action: "restore", ids: [...selected] },
                          { preserveScroll: true, onSuccess: clear },
                      ),
                  confirm: {
                      title: "Pulihkan peserta?",
                      description: `${selected.size} peserta terpilih akan dipulihkan dari data sampah.`,
                  },
              },
              {
                  label: "Hapus Permanen",
                  icon: Trash2,
                  destructive: true,
                  onClick: () =>
                      router.post(
                          "/admin/users/bulk",
                          { action: "force_delete", ids: [...selected] },
                          { preserveScroll: true, onSuccess: clear },
                      ),
                  confirm: {
                      title: "Hapus permanen peserta terpilih?",
                      description: `${selected.size} peserta terpilih beserta data terkait akan DIHAPUS PERMANEN. Log aktivitas tetap tersimpan. Tindakan ini TIDAK DAPAT DIBATALKAN.`,
                  },
              },
          ]
        : [
              {
                  label: "Kirim Ulang Undangan",
                  icon: Mail,
                  onClick: () => runBulk("resend_invitations"),
                  confirm: {
                      title: "Kirim ulang undangan penilai?",
                      description: `Undangan email akan dikirim ulang ke penilai yang belum submit pada ${selected.size} peserta terpilih.`,
                  },
              },
              {
                  label: "Kirim PDF Hasil",
                  icon: Send,
                  onClick: () => runBulk("send_pdf"),
                  confirm: {
                      title: "Kirim laporan PDF ke peserta?",
                      description: `Laporan hasil assessment PDF akan dikirimkan ke email ${selected.size} peserta terpilih yang sudah memiliki data hasil.`,
                  },
              },
              {
                  label: "Hapus",
                  icon: Trash2,
                  destructive: true,
                  onClick: () =>
                      router.post(
                          "/admin/users/bulk",
                          { action: "delete", ids: [...selected] },
                          { preserveScroll: true, onSuccess: clear },
                      ),
                  confirm: {
                      title: "Hapus peserta terpilih?",
                      description: `${selected.size} peserta terpilih akan dipindahkan ke data sampah. Tindakan ini dapat dipulihkan.`,
                  },
              },
          ];

    const exportUrl = () => {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (company !== "all") params.set("company", company);
        if (progress !== "all") params.set("progress", progress);
        if (status !== "all") params.set("status", status);
        if (tab !== "all") params.set("tab", tab);
        return `/admin/participants/export?${params.toString()}`;
    };

    const pageUrl = (page: number) => {
        const params = new URLSearchParams();
        if (filters.search) params.set("search", filters.search);
        if (filters.company) params.set("company", filters.company);
        if (filters.progress) params.set("progress", filters.progress);
        if (filters.status) params.set("status", filters.status);
        if (filters.tab) params.set("tab", filters.tab);
        params.set("page", String(page));
        return `/admin/participants?${params.toString()}`;
    };

    return (
        <PageContainer>
            <Head title="Peserta Assessment" />
            <PageHeader
                title="Peserta"
                description="Kelola peserta, pantau progres evaluasi 360°, dan kelola penilai"
                actions={
                    <Button asChild icon={Plus}>
                        <Link href="/admin/participants/create">Tambah</Link>
                    </Button>
                }
            />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Tabs
                    value={tab}
                    onValueChange={(val) => {
                        setTab(val);
                        applyFilters({ tab: val });
                    }}
                >
                    <TabsList>
                        <TabsTrigger value="all" className="gap-2">
                            <Users className="size-4" /> Semua Peserta
                        </TabsTrigger>
                        <TabsTrigger value="trash" className="gap-2">
                            <Trash2 className="size-4" /> Data Sampah
                            {trash_count > 0 && (
                                <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                                    {trash_count}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Filter Toolbar */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SearchInput
                    label="Cari peserta"
                    placeholder="Cari nama, email, jabatan..."
                    value={search}
                    onValueChange={setSearch}
                    className="w-full"
                />
                <Select
                    value={company}
                    onValueChange={(val) => {
                        setCompany(val);
                        applyFilters({ company: val });
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Semua Perusahaan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Perusahaan</SelectItem>
                        {companies.map((c) => (
                            <SelectItem key={c} value={c}>
                                {c}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={progress}
                    onValueChange={(val) => {
                        setProgress(val);
                        applyFilters({ progress: val });
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Semua Progres" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Progres</SelectItem>
                        <SelectItem value="not_started">Belum Mulai</SelectItem>
                        <SelectItem value="in_progress">
                            Sedang Berjalan
                        </SelectItem>
                        <SelectItem value="completed">Selesai</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={status}
                    onValueChange={(val) => {
                        setStatus(val);
                        applyFilters({ status: val });
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Nonaktif</SelectItem>
                        <SelectItem value="unverified">Belum Terverifikasi</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div
                className={cn(
                    "space-y-4 pb-20 transition-opacity",
                    loading && "opacity-60",
                )}
            >
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto rounded-card border bg-card">
                    <Table>
                        <TableHeader className="bg-muted/50 [&_th]:h-11 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wider [&_th]:text-muted-foreground [&_th]:uppercase">
                            <TableRow>
                                <TableHead scope="col" className="w-10">
                                    <Checkbox
                                        aria-label="Pilih semua di halaman ini"
                                        checked={
                                            allSelected
                                                ? true
                                                : selected.size > 0
                                                  ? "indeterminate"
                                                  : false
                                        }
                                        onCheckedChange={(c) =>
                                            setSelected(
                                                c === true
                                                    ? new Set(
                                                          participants.data.map(
                                                              (p) => p.id,
                                                          ),
                                                      )
                                                    : new Set(),
                                            )
                                        }
                                    />
                                </TableHead>
                                <TableHead scope="col">Peserta</TableHead>
                                <TableHead scope="col">
                                    Perusahaan / Jabatan
                                </TableHead>
                                <TableHead scope="col">
                                    Progres Penilai
                                </TableHead>
                                <TableHead scope="col">Status Akun</TableHead>
                                <TableHead scope="col" className="text-right">
                                    Aksi
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="bg-white dark:bg-card">
                            {participants.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="py-10 text-center text-muted-foreground"
                                    >
                                        Tidak ada peserta yang cocok.
                                    </TableCell>
                                </TableRow>
                            )}
                            {participants.data.map((p) => (
                                <TableRow
                                    key={p.id}
                                    className="hover:bg-accent/40"
                                >
                                    <TableCell>
                                        <Checkbox
                                            aria-label={`Pilih ${p.name}`}
                                            checked={selected.has(p.id)}
                                            onCheckedChange={(c) =>
                                                toggle(p.id, c === true)
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/admin/participants/${p.id}`}
                                            className="font-medium text-foreground hover:underline"
                                        >
                                            {p.name}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">
                                            {p.email}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium">
                                            {p.company}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {p.position}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                            <Badge
                                                variant={
                                                    p.progress.self
                                                        ? "default"
                                                        : "outline"
                                                }
                                                className={cn(
                                                    "text-[10px] px-1.5 py-0.5",
                                                    p.progress.self
                                                        ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                                                        : "text-muted-foreground",
                                                )}
                                            >
                                                {p.progress.self ? (
                                                    <CheckCircle2 className="size-3 mr-1 inline" />
                                                ) : (
                                                    <Clock className="size-3 mr-1 inline" />
                                                )}
                                                Self
                                            </Badge>
                                            <Badge
                                                variant={
                                                    p.progress.boss
                                                        ? "default"
                                                        : "outline"
                                                }
                                                className={cn(
                                                    "text-[10px] px-1.5 py-0.5",
                                                    p.progress.boss
                                                        ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                                                        : "text-muted-foreground",
                                                )}
                                            >
                                                {p.progress.boss ? (
                                                    <CheckCircle2 className="size-3 mr-1 inline" />
                                                ) : (
                                                    <Clock className="size-3 mr-1 inline" />
                                                )}
                                                Atasan
                                            </Badge>
                                            <Badge
                                                variant={
                                                    p.progress.subordinate
                                                        .submitted ===
                                                        p.progress.subordinate.total &&
                                                    p.progress.subordinate.total > 0
                                                        ? "default"
                                                        : "outline"
                                                }
                                                className={cn(
                                                    "text-[10px] px-1.5 py-0.5",
                                                    p.progress.subordinate.total === 0
                                                        ? "bg-muted/60 text-muted-foreground border-dashed border-border"
                                                        : p.progress.subordinate.submitted ===
                                                            p.progress.subordinate.total &&
                                                          p.progress.subordinate.total > 0
                                                        ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                                                        : "text-muted-foreground",
                                                )}
                                            >
                                                Bawahan{" "}
                                                {
                                                    p.progress.subordinate
                                                        .submitted
                                                }
                                                /{p.progress.subordinate.total}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/admin/users?search=${encodeURIComponent(p.email)}`}
                                            title="Buka pengaturan akun di modul Pengguna"
                                            className="inline-block hover:opacity-80"
                                        >
                                            {p.email_verified === false ? (
                                                <Badge variant="warning">
                                                    <AlertCircle aria-hidden="true" className="size-3 mr-1 inline" />
                                                    Belum Terverifikasi
                                                </Badge>
                                            ) : (
                                                <StatusBadge
                                                    status={activeStatus(
                                                        p.is_active,
                                                    )}
                                                />
                                            )}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        {isTrash ? (
                                            <>
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`Lihat detail ${p.name}`}
                                                    title="Lihat detail"
                                                >
                                                    <Link href={`/admin/participants/${p.id}`}>
                                                        <Eye className="size-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`Pulihkan ${p.name}`}
                                                    title="Pulihkan peserta"
                                                    onClick={() => setRestoreTarget(p)}
                                                >
                                                    <RotateCcw className="size-4 text-primary" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`Hapus permanen ${p.name}`}
                                                    title="Hapus permanen"
                                                    onClick={() => setForceDeleteTarget(p)}
                                                >
                                                    <Trash2 className="size-4 text-destructive" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Detail Peserta"
                                                >
                                                    <Link
                                                        href={`/admin/participants/${p.id}`}
                                                        aria-label={`Detail ${p.name}`}
                                                    >
                                                        <Eye className="size-4" />
                                                    </Link>
                                                </Button>
                                                {p.progress.has_started && (
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Hasil Assessment"
                                                    >
                                                        <Link
                                                            href={`/admin/participants/${p.id}/result`}
                                                            aria-label={`Hasil assessment ${p.name}`}
                                                        >
                                                            <FileBarChart2 className="size-4 text-primary" />
                                                        </Link>
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`Hapus ${p.name}`}
                                                    title="Hapus peserta"
                                                    onClick={() => setTarget(p)}
                                                >
                                                    <Trash2 className="size-4 text-destructive" />
                                                </Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card View */}
                <div className="grid gap-3 md:hidden">
                    {participants.data.length === 0 ? (
                        <div className="rounded-card border bg-card p-6 text-center text-muted-foreground">
                            Tidak ada peserta yang cocok.
                        </div>
                    ) : (
                        participants.data.map((p) => (
                            <div
                                key={p.id}
                                className="rounded-card border bg-card p-4 space-y-3 shadow-xs"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            aria-label={`Pilih ${p.name}`}
                                            checked={selected.has(p.id)}
                                            onCheckedChange={(c) =>
                                                toggle(p.id, c === true)
                                            }
                                        />
                                        <div>
                                            <Link
                                                href={`/admin/participants/${p.id}`}
                                                className="font-semibold text-foreground hover:underline text-base"
                                            >
                                                {p.name}
                                            </Link>
                                            <p className="text-xs text-muted-foreground">
                                                {p.email}
                                            </p>
                                        </div>
                                    </div>
                                    {p.email_verified === false ? (
                                        <Badge variant="warning">
                                            <AlertCircle aria-hidden="true" className="size-3 mr-1 inline" />
                                            Belum Terverifikasi
                                        </Badge>
                                    ) : (
                                        <StatusBadge
                                            status={activeStatus(p.is_active)}
                                        />
                                    )}
                                </div>

                                <div className="text-xs text-muted-foreground space-y-0.5">
                                    <p>
                                        <strong className="text-foreground">
                                            Perusahaan:
                                        </strong>{" "}
                                        {p.company}
                                    </p>
                                    <p>
                                        <strong className="text-foreground">
                                            Jabatan:
                                        </strong>{" "}
                                        {p.position}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    <Badge
                                        variant={
                                            p.progress.self
                                                ? "default"
                                                : "outline"
                                        }
                                        className={cn(
                                            "text-[10px] px-1.5 py-0.5",
                                            p.progress.self
                                                ? "bg-emerald-600 text-white"
                                                : "text-muted-foreground",
                                        )}
                                    >
                                        Self:{" "}
                                        {p.progress.self ? "Selesai" : "Belum"}
                                    </Badge>
                                    <Badge
                                        variant={
                                            p.progress.boss
                                                ? "default"
                                                : "outline"
                                        }
                                        className={cn(
                                            "text-[10px] px-1.5 py-0.5",
                                            p.progress.boss
                                                ? "bg-emerald-600 text-white"
                                                : "text-muted-foreground",
                                        )}
                                    >
                                        Atasan:{" "}
                                        {p.progress.boss ? "Selesai" : "Belum"}
                                    </Badge>
                                    <Badge
                                        variant={
                                            p.progress.subordinate.submitted ===
                                                p.progress.subordinate.total &&
                                            p.progress.subordinate.total > 0
                                                ? "default"
                                                : "outline"
                                        }
                                        className={cn(
                                            "text-[10px] px-1.5 py-0.5",
                                            p.progress.subordinate.total === 0
                                                ? "bg-muted/60 text-muted-foreground border-dashed border-border"
                                                : p.progress.subordinate.submitted ===
                                                    p.progress.subordinate.total &&
                                                  p.progress.subordinate.total > 0
                                                ? "bg-emerald-600 text-white"
                                                : "text-muted-foreground",
                                        )}
                                    >
                                        Bawahan:{" "}
                                        {p.progress.subordinate.submitted}/
                                        {p.progress.subordinate.total}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-end gap-2 border-t pt-3">
                                    {isTrash ? (
                                        <>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/admin/participants/${p.id}`}>
                                                    Detail
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setRestoreTarget(p)}
                                            >
                                                <RotateCcw className="size-4 mr-1.5" />
                                                Pulihkan
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => setForceDeleteTarget(p)}
                                            >
                                                <Trash2 className="size-4 mr-1.5" />
                                                Hapus Permanen
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button asChild variant="outline" size="sm">
                                                <Link
                                                    href={`/admin/participants/${p.id}`}
                                                >
                                                    Detail
                                                </Link>
                                            </Button>
                                            <Button asChild variant="outline" size="sm">
                                                <Link
                                                    href={`/admin/participants/${p.id}/edit`}
                                                >
                                                    Edit
                                                </Link>
                                            </Button>
                                            {p.progress.has_started && (
                                                <Button asChild size="sm">
                                                    <Link
                                                        href={`/admin/participants/${p.id}/result`}
                                                    >
                                                        Hasil
                                                    </Link>
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => setTarget(p)}
                                            >
                                                <Trash2 className="size-4 mr-1" />
                                                Hapus
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <BulkActionBar
                    selectedCount={selected.size}
                    actions={bulkActions}
                    onClear={clear}
                />

                <Pagination paginator={participants} pageUrl={pageUrl} />
            </div>

            <ConfirmDeleteDialog
                title="Hapus peserta?"
                open={target !== null}
                onOpenChange={(open) => !open && setTarget(null)}
                description={`${target?.name ?? ""} akan dipindahkan ke data sampah. Tindakan ini dapat dipulihkan.`}
                onConfirm={() =>
                    target &&
                    router.delete(`/admin/participants/${target.id}`, {
                        preserveScroll: true,
                    })
                }
            />

            {/* Force Delete Dialog */}
            <AlertDialog
                open={forceDeleteTarget !== null}
                onOpenChange={(open) => !open && setForceDeleteTarget(null)}
            >
                <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-lg p-6 sm:p-7 rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <ShieldAlert className="size-5 shrink-0" />
                            Hapus Permanen Peserta?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2">
                            <p className="font-semibold text-foreground">
                                Anda akan menghapus akun peserta{" "}
                                <span className="underline">
                                    {forceDeleteTarget?.name} ({forceDeleteTarget?.email})
                                </span>{" "}
                                secara permanen dari basis data.
                            </p>
                            <div className="rounded-control bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive space-y-1.5">
                                <p className="font-semibold">Perhatian: Data berikut akan ikut terhapus permanen:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li>Kredensial login & data profil pengguna</li>
                                    <li>Profil peserta (informasi perusahaan & jabatan)</li>
                                    <li>Seluruh data penilai (atasan & bawahan) terkait</li>
                                    <li>Seluruh jawaban kuesioner assessment terkait</li>
                                    <li>Riwayat pencatatan log email</li>
                                </ul>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                * Catatan audit log aktivitas tetap disimpan permanen untuk keperluan rekam jejak kepatuhan sistem.
                            </p>
                            <p className="text-xs text-muted-foreground font-semibold">
                                PERINGATAN: Tindakan ini TIDAK DAPAT DIBATALKAN atau dipulihkan kembali.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (forceDeleteTarget) {
                                    router.delete(`/admin/users/${forceDeleteTarget.id}/force-delete`, {
                                        preserveScroll: true,
                                        onFinish: () => setForceDeleteTarget(null),
                                    });
                                }
                            }}
                        >
                            Hapus Permanen Sekarang
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Restore Dialog */}
            <AlertDialog
                open={restoreTarget !== null}
                onOpenChange={(open) => !open && setRestoreTarget(null)}
            >
                <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-md p-6 sm:p-7 rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Pulihkan peserta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Akun peserta <strong className="text-foreground">{restoreTarget?.name}</strong> akan
                            dipulihkan kembali dari data sampah.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (restoreTarget) {
                                    router.post(
                                        `/admin/users/${restoreTarget.id}/restore`,
                                        {},
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => setRestoreTarget(null),
                                        },
                                    );
                                }
                            }}
                        >
                            Pulihkan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageContainer>
    );
}

ParticipantsIndex.layout = {
    breadcrumbs: [{ title: "Peserta", href: "/admin/participants" }],
};
