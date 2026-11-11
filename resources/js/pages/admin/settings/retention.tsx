import { Head, Link, router, useForm } from "@inertiajs/react";
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    Check,
    Clock,
    Database,
    HardDrive,
    History,
    Mail,
    RefreshCw,
    Save,
    Settings,
    ShieldAlert,
    Trash2,
} from "lucide-react";
import { useState } from "react";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
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
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { purge, update } from "@/routes/admin/settings/retention";

export interface LogStats {
    total: number;
    oldest_at: string | null;
    purge_enabled: boolean;
    retention_days: number | null;
    eligible_count: number;
}

export interface LastPurgeInfo {
    at: string;
    causer_name: string;
    description: string;
    properties: {
        target?: string;
        activity_purged?: number;
        email_purged?: number;
        forced?: boolean;
    };
}

export interface RetentionPageProps {
    stats: {
        activity_log: LogStats;
        email_logs: LogStats;
        last_purge: LastPurgeInfo | null;
    };
}

const PRESET_DAYS = [30, 60, 90, 180, 365];

const dateTime = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
});

const formatDate = (iso: string | null | undefined) =>
    iso ? dateTime.format(new Date(iso)) : "-";

export default function LogRetentionPage({ stats }: RetentionPageProps) {
    const { data, setData, put, processing, errors } = useForm({
        activity_log_purge_enabled: stats.activity_log.purge_enabled,
        activity_log_retention_days: stats.activity_log.retention_days ?? 90,
        email_log_purge_enabled: stats.email_logs.purge_enabled,
        email_log_retention_days: stats.email_logs.retention_days ?? 90,
    });

    // Dialog Konfirmasi Purge Manual
    const [purgeDialogOpen, setPurgeDialogOpen] = useState(false);
    const [purgeTarget, setPurgeTarget] = useState<
        "all" | "activity" | "email"
    >("activity");
    const [purging, setPurging] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(update.url(), {
            preserveScroll: true,
        });
    };

    const handleConfirmPurge = () => {
        setPurging(true);
        router.post(
            purge.url(),
            { target: purgeTarget },
            {
                preserveScroll: true,
                onFinish: () => {
                    setPurging(false);
                    setPurgeDialogOpen(false);
                },
            },
        );
    };

    const openPurgeDialog = (target: "all" | "activity" | "email") => {
        setPurgeTarget(target);
        setPurgeDialogOpen(true);
    };

    const getPurgeTargetLabel = (target: "all" | "activity" | "email") => {
        switch (target) {
            case "activity":
                return "Log Aktivitas (Audit Log)";
            case "email":
                return "Log Pengiriman Email";
            default:
                return "Seluruh Log (Aktivitas & Email)";
        }
    };

    const getPurgeEligibleCount = (target: "all" | "activity" | "email") => {
        switch (target) {
            case "activity":
                return stats.activity_log.eligible_count;
            case "email":
                return stats.email_logs.eligible_count;
            default:
                return (
                    stats.activity_log.eligible_count +
                    stats.email_logs.eligible_count
                );
        }
    };

    return (
        <PageContainer>
            <Head title="Pengaturan Retensi Log" />

            <div className="mb-2">
                <Button asChild variant="ghost" size="sm" icon={ArrowLeft}>
                    <Link href="/admin/activity-logs">
                        Kembali ke Log Aktivitas
                    </Link>
                </Button>
            </div>

            <PageHeader
                title="Retensi & Pembersihan Log"
                description="Kelola masa simpan log audit dan pembersihan otomatis (auto-purge) basis data sistem ELQ 360°"
            />

            {/* 1. Stat Cards Ringkasan */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Total Log Aktivitas
                        </CardTitle>
                        <History className="size-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.activity_log.total.toLocaleString("id-ID")}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Terlama: {formatDate(stats.activity_log.oldest_at)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Aktivitas Siap Dihapus
                        </CardTitle>
                        <Trash2 className="size-4 text-amber-600 dark:text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {stats.activity_log.eligible_count.toLocaleString(
                                "id-ID",
                            )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {stats.activity_log.retention_days
                                ? `> ${stats.activity_log.retention_days} hari masa simpan`
                                : "Belum ditentukan"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Total Log Email
                        </CardTitle>
                        <Mail className="size-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.email_logs.total.toLocaleString("id-ID")}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Terlama: {formatDate(stats.email_logs.oldest_at)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Email Siap Dihapus
                        </CardTitle>
                        <Trash2 className="size-4 text-amber-600 dark:text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {stats.email_logs.eligible_count.toLocaleString(
                                "id-ID",
                            )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {stats.email_logs.retention_days
                                ? `> ${stats.email_logs.retention_days} hari masa simpan`
                                : "Belum ditentukan"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 2. Form Pengaturan Retensi */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Log Aktivitas Card */}
                    <Card className="flex flex-col justify-between">
                        <div>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <History className="size-5 text-primary" />
                                        <CardTitle className="text-base">
                                            Log Aktivitas (Audit Log)
                                        </CardTitle>
                                    </div>
                                    <Badge
                                        variant={
                                            data.activity_log_purge_enabled
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {data.activity_log_purge_enabled
                                            ? "Auto-Purge Aktif"
                                            : "Nonaktif"}
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs leading-relaxed">
                                    Masa simpan rekam jejak aktivitas admin,
                                    perubahan data pengguna, asesmen, dan
                                    autentikasi sistem.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                                    <div className="space-y-0.5">
                                        <label
                                            htmlFor="activity_purge_toggle"
                                            className="text-sm font-medium cursor-pointer"
                                        >
                                            Aktifkan Pembersihan Otomatis
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            Jalankan pembersihan via cron daily
                                            pukul 02:00 WIB
                                        </p>
                                    </div>
                                    <Switch
                                        id="activity_purge_toggle"
                                        checked={
                                            data.activity_log_purge_enabled
                                        }
                                        onCheckedChange={(val) =>
                                            setData(
                                                "activity_log_purge_enabled",
                                                val,
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="activity_retention_days"
                                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                    >
                                        Masa Simpan (Hari)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="activity_retention_days"
                                            type="number"
                                            min={1}
                                            max={3650}
                                            value={
                                                data.activity_log_retention_days ??
                                                ""
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    "activity_log_retention_days",
                                                    e.target.value === ""
                                                        ? null
                                                        : parseInt(
                                                              e.target.value,
                                                              10,
                                                          ),
                                                )
                                            }
                                            placeholder="Contoh: 90"
                                            className="max-w-[140px]"
                                            disabled={
                                                !data.activity_log_purge_enabled
                                            }
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            hari
                                        </span>
                                    </div>
                                    {errors.activity_log_retention_days && (
                                        <p className="text-xs text-destructive">
                                            {errors.activity_log_retention_days}
                                        </p>
                                    )}

                                    {/* Preset Buttons */}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {PRESET_DAYS.map((days) => (
                                            <Button
                                                key={days}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-xs px-2.5"
                                                disabled={
                                                    !data.activity_log_purge_enabled
                                                }
                                                onClick={() =>
                                                    setData(
                                                        "activity_log_retention_days",
                                                        days,
                                                    )
                                                }
                                            >
                                                {days} Hari
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </div>

                        <CardFooter className="border-t bg-muted/10 pt-3 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Siap dihapus:{" "}
                                <strong>
                                    {stats.activity_log.eligible_count}
                                </strong>{" "}
                                baris
                            </span>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                icon={Trash2}
                                onClick={() => openPurgeDialog("activity")}
                                disabled={stats.activity_log.eligible_count === 0}
                            >
                                Purge Sekarang
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Log Email Card */}
                    <Card className="flex flex-col justify-between">
                        <div>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Mail className="size-5 text-primary" />
                                        <CardTitle className="text-base">
                                            Log Pengiriman Email
                                        </CardTitle>
                                    </div>
                                    <Badge
                                        variant={
                                            data.email_log_purge_enabled
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {data.email_log_purge_enabled
                                            ? "Auto-Purge Aktif"
                                            : "Nonaktif"}
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs leading-relaxed">
                                    Masa simpan status pengiriman undangan penilai,
                                    verifikasi akun, reset password, dan share hasil
                                    asesmen.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                                    <div className="space-y-0.5">
                                        <label
                                            htmlFor="email_purge_toggle"
                                            className="text-sm font-medium cursor-pointer"
                                        >
                                            Aktifkan Pembersihan Otomatis
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            Jalankan pembersihan via cron daily
                                            pukul 02:00 WIB
                                        </p>
                                    </div>
                                    <Switch
                                        id="email_purge_toggle"
                                        checked={data.email_log_purge_enabled}
                                        onCheckedChange={(val) =>
                                            setData("email_log_purge_enabled", val)
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="email_retention_days"
                                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                    >
                                        Masa Simpan (Hari)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="email_retention_days"
                                            type="number"
                                            min={1}
                                            max={3650}
                                            value={
                                                data.email_log_retention_days ?? ""
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    "email_log_retention_days",
                                                    e.target.value === ""
                                                        ? null
                                                        : parseInt(
                                                              e.target.value,
                                                              10,
                                                          ),
                                                )
                                            }
                                            placeholder="Contoh: 90"
                                            className="max-w-[140px]"
                                            disabled={
                                                !data.email_log_purge_enabled
                                            }
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            hari
                                        </span>
                                    </div>
                                    {errors.email_log_retention_days && (
                                        <p className="text-xs text-destructive">
                                            {errors.email_log_retention_days}
                                        </p>
                                    )}

                                    {/* Preset Buttons */}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {PRESET_DAYS.map((days) => (
                                            <Button
                                                key={days}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-xs px-2.5"
                                                disabled={
                                                    !data.email_log_purge_enabled
                                                }
                                                onClick={() =>
                                                    setData(
                                                        "email_log_retention_days",
                                                        days,
                                                    )
                                                }
                                            >
                                                {days} Hari
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </div>

                        <CardFooter className="border-t bg-muted/10 pt-3 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Siap dihapus:{" "}
                                <strong>{stats.email_logs.eligible_count}</strong>{" "}
                                baris
                            </span>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                icon={Trash2}
                                onClick={() => openPurgeDialog("email")}
                                disabled={stats.email_logs.eligible_count === 0}
                            >
                                Purge Sekarang
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Tombol Simpan Pengaturan */}
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        icon={Save}
                        loading={processing}
                        disabled={processing}
                    >
                        Simpan Pengaturan Retensi
                    </Button>
                </div>
            </form>

            {/* 3. Card Riwayat Pembersihan Terakhir */}
            <Card className="mt-6">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Clock className="size-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-semibold">
                            Riwayat Pembersihan Log Terakhir
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {stats.last_purge ? (
                        <div className="rounded-lg border p-4 bg-muted/20 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-foreground">
                                    {stats.last_purge.description}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {formatDate(stats.last_purge.at)}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>
                                    Inisiator:{" "}
                                    <strong className="text-foreground">
                                        {stats.last_purge.causer_name}
                                    </strong>
                                </span>
                                {stats.last_purge.properties?.activity_purged !==
                                    undefined && (
                                    <span>
                                        Log Aktivitas Dihapus:{" "}
                                        <strong className="text-foreground">
                                            {
                                                stats.last_purge.properties
                                                    .activity_purged
                                            }
                                        </strong>
                                    </span>
                                )}
                                {stats.last_purge.properties?.email_purged !==
                                    undefined && (
                                    <span>
                                        Log Email Dihapus:{" "}
                                        <strong className="text-foreground">
                                            {
                                                stats.last_purge.properties
                                                    .email_purged
                                            }
                                        </strong>
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground italic">
                            Belum ada riwayat pembersihan log yang tercatat dalam
                            sistem.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Dialog Konfirmasi Purge Manual */}
            <AlertDialog
                open={purgeDialogOpen}
                onOpenChange={setPurgeDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <ShieldAlert className="size-5" />
                            Konfirmasi Pembersihan Log Permanen
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2">
                            <p>
                                Anda akan menghapus data pada{" "}
                                <strong className="text-foreground">
                                    {getPurgeTargetLabel(purgeTarget)}
                                </strong>{" "}
                                yang telah melewati batas masa retensi.
                            </p>
                            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                                <strong>Perhatian:</strong> Sebanyak{" "}
                                <strong>
                                    {getPurgeEligibleCount(purgeTarget)} baris
                                </strong>{" "}
                                data log akan dihapus secara <strong>PERMANEN</strong>{" "}
                                dari basis data dan tidak dapat dipulihkan
                                kembali.
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={purging}>
                            Batal
                        </AlertDialogCancel>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmPurge}
                            loading={purging}
                            disabled={purging}
                            icon={Trash2}
                        >
                            Ya, Hapus Permanen Sekarang
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageContainer>
    );
}
