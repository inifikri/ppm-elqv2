import {
    ArrowLeft,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    ExternalLink,
    FileBarChart2,
    Mail,
    Pencil,
    Phone,
    Plus,
    RotateCcw,
    ShieldAlert,
    Trash2,
    UserCheck,
} from "lucide-react";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInitials } from "@/hooks/use-initials";
import { cn } from "@/lib/utils";
import type { ParticipantDetail, ParticipantRaterItem } from "@/types";

const dateTime = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
});

const formatDate = (iso: string | null | undefined) =>
    iso ? dateTime.format(new Date(iso)) : "-";

export default function ParticipantShow({
    participant,
    raters,
}: {
    participant: ParticipantDetail;
    raters: ParticipantRaterItem[];
    activities?: unknown[];
    companies?: string[];
}) {
    const getInitials = useInitials();

    // Trash actions state
    const [restoreOpen, setRestoreOpen] = useState(false);
    const [forceDeleteOpen, setForceDeleteOpen] = useState(false);

    // Resend invitation state
    const [resendTarget, setResendTarget] =
        useState<ParticipantRaterItem | null>(null);

    // Revoke link state
    const [revokeTarget, setRevokeTarget] =
        useState<ParticipantRaterItem | null>(null);
    const [sendNewInvitation, setSendNewInvitation] = useState(true);

    // Edit rater state
    const [editRaterTarget, setEditRaterTarget] =
        useState<ParticipantRaterItem | null>(null);
    const [editRaterEmail, setEditRaterEmail] = useState("");
    const [editRaterSendInvitation, setEditRaterSendInvitation] =
        useState(true);
    const [raterSaving, setRaterSaving] = useState(false);

    // Add raters state (when empty)
    const [addRatersOpen, setAddRatersOpen] = useState(false);
    const [addBossEmail, setAddBossEmail] = useState("");
    const [addSubordinates, setAddSubordinates] = useState<
        [string, string, string]
    >(["", "", ""]);
    const [addingRaters, setAddingRaters] = useState(false);

    const handleResend = () => {
        if (!resendTarget) return;
        router.post(
            `/admin/participants/${participant.id}/raters/${resendTarget.id}/resend`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setResendTarget(null),
            },
        );
    };

    const handleRevoke = () => {
        if (!revokeTarget) return;
        router.post(
            `/admin/participants/${participant.id}/raters/${revokeTarget.id}/revoke`,
            { send_invitation: sendNewInvitation },
            {
                preserveScroll: true,
                onFinish: () => setRevokeTarget(null),
            },
        );
    };

    const handleUpdateRater = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editRaterTarget) return;

        setRaterSaving(true);
        router.put(
            `/admin/participants/${participant.id}/raters/${editRaterTarget.id}`,
            {
                email: editRaterEmail,
                send_invitation: editRaterSendInvitation,
            },
            {
                preserveScroll: true,
                onSuccess: () => setEditRaterTarget(null),
                onFinish: () => setRaterSaving(false),
            },
        );
    };

    const handleAddRaters = (e: React.FormEvent) => {
        e.preventDefault();
        setAddingRaters(true);
        router.post(
            `/admin/participants/${participant.id}/raters`,
            {
                boss_email: addBossEmail,
                subordinate_emails: addSubordinates,
            },
            {
                preserveScroll: true,
                onSuccess: () => setAddRatersOpen(false),
                onFinish: () => setAddingRaters(false),
            },
        );
    };

    const selfRater = raters.find((r) => r.role === "self");
    const bossRater = raters.find((r) => r.role === "boss");
    const subordinateRaters = raters.filter((r) => r.role === "subordinate");
    const externalRaters = raters.filter((r) => r.role !== "self");

    const totalRaters = raters.length;
    const submittedCount = raters.filter((r) => r.is_submitted).length;
    const selfSubmitted = selfRater?.is_submitted ?? false;
    const bossSubmitted = bossRater?.is_submitted ?? false;
    const subSubmittedCount = subordinateRaters.filter(
        (r) => r.is_submitted,
    ).length;
    const progressPercent =
        totalRaters > 0 ? Math.round((submittedCount / totalRaters) * 100) : 0;

    return (
        <PageContainer>
            <Head title={`Peserta: ${participant.name}`} />

            <div className="mb-2">
                <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    icon={ArrowLeft}
                    className="-ml-2 text-muted-foreground"
                >
                    <Link
                        href={
                            participant.is_trashed
                                ? "/admin/participants?tab=trash"
                                : "/admin/participants"
                        }
                    >
                        {participant.is_trashed
                            ? "Kembali ke Data Sampah"
                            : "Kembali ke Daftar Peserta"}
                    </Link>
                </Button>
            </div>

            <PageHeader
                title={participant.name}
                description="Detail profil peserta dan status penilaian evaluasi kepemimpinan 360°"
                actions={
                    participant.is_trashed ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                icon={RotateCcw}
                                onClick={() => setRestoreOpen(true)}
                            >
                                Pulihkan Peserta
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                icon={Trash2}
                                disabled={!participant.can_delete}
                                onClick={() => setForceDeleteOpen(true)}
                            >
                                Hapus Permanen
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                icon={Pencil}
                            >
                                <Link
                                    href={`/admin/participants/${participant.id}/edit`}
                                >
                                    Edit Peserta
                                </Link>
                            </Button>
                            {participant.has_results && (
                                <Button
                                    asChild
                                    variant="default"
                                    size="sm"
                                    icon={FileBarChart2}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    <Link
                                        href={`/admin/participants/${participant.id}/result`}
                                    >
                                        Lihat Hasil Asesmen
                                    </Link>
                                </Button>
                            )}
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                icon={ExternalLink}
                                className="text-xs text-muted-foreground"
                            >
                                <Link
                                    href={`/admin/users?search=${encodeURIComponent(participant.email)}`}
                                >
                                    Kelola Akun
                                </Link>
                            </Button>
                        </div>
                    )
                }
            />

            <div className="space-y-6 pt-2">
                {/* Trashed Alert Banner */}
                {participant.is_trashed && (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <Trash2 className="size-5 shrink-0" />
                            <div>
                                <p className="font-semibold text-foreground">
                                    Akun Peserta Berada di Data Sampah
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Data peserta ini telah dinonaktifkan. Anda dapat memulihkan kembali ke daftar aktif atau menghapusnya secara permanen.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                icon={RotateCcw}
                                onClick={() => setRestoreOpen(true)}
                            >
                                Pulihkan
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                icon={Trash2}
                                disabled={!participant.can_delete}
                                onClick={() => setForceDeleteOpen(true)}
                            >
                                Hapus Permanen
                            </Button>
                        </div>
                    </div>
                )}
                {/* Profile Overview Card */}
                <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                        <Avatar className="size-16 rounded-2xl border bg-muted text-foreground text-lg shrink-0">
                            <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-lg">
                                {getInitials(participant.name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h2 className="text-xl font-bold tracking-tight text-foreground truncate">
                                    {participant.name}
                                </h2>
                                <StatusBadge
                                    status={activeStatus(participant.is_active)}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                                {participant.company_name && (
                                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                                        <Building2 className="size-3.5 text-muted-foreground" />
                                        {participant.company_name}
                                    </span>
                                )}
                                {participant.position && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Briefcase className="size-3.5 text-muted-foreground" />
                                        {participant.position}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1.5">
                                    <Mail className="size-3.5 text-muted-foreground" />
                                    {participant.email}
                                </span>
                                {participant.phone && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Phone className="size-3.5 text-muted-foreground" />
                                        {participant.phone}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1.5">
                                    <Calendar className="size-3.5 text-muted-foreground" />
                                    Terdaftar:{" "}
                                    {formatDate(participant.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Metrics Summary Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Self Metric */}
                    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                            <span className="font-medium">
                                Penilaian Mandiri
                            </span>
                            {selfSubmitted ? (
                                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <Clock className="size-4 text-amber-500" />
                            )}
                        </div>
                        <div className="flex items-baseline justify-between">
                            <span className="text-xl font-bold text-foreground">
                                {selfSubmitted ? "1 / 1" : "0 / 1"}
                            </span>
                            <span
                                className={cn(
                                    "text-xs font-medium",
                                    selfSubmitted
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-amber-600 dark:text-amber-400",
                                )}
                            >
                                {selfSubmitted ? "Selesai" : "Belum Selesai"}
                            </span>
                        </div>
                    </div>

                    {/* Boss Metric */}
                    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                            <span className="font-medium">Atasan Langsung</span>
                            {bossSubmitted ? (
                                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <Clock className="size-4 text-amber-500" />
                            )}
                        </div>
                        <div className="flex items-baseline justify-between">
                            <span className="text-xl font-bold text-foreground">
                                {bossSubmitted ? "1 / 1" : "0 / 1"}
                            </span>
                            <span
                                className={cn(
                                    "text-xs font-medium",
                                    bossSubmitted
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-amber-600 dark:text-amber-400",
                                )}
                            >
                                {bossSubmitted ? "Selesai" : "Belum Selesai"}
                            </span>
                        </div>
                    </div>

                    {/* Subordinate Metric */}
                    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                            <span className="font-medium">
                                Bawahan Langsung
                            </span>
                            {subSubmittedCount === subordinateRaters.length &&
                            subordinateRaters.length > 0 ? (
                                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <Clock className="size-4 text-amber-500" />
                            )}
                        </div>
                        <div className="flex items-baseline justify-between">
                            <span className="text-xl font-bold text-foreground">
                                {subSubmittedCount} /{" "}
                                {subordinateRaters.length || 3}
                            </span>
                            <span
                                className={cn(
                                    "text-xs font-medium",
                                    subSubmittedCount ===
                                        subordinateRaters.length &&
                                        subordinateRaters.length > 0
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-amber-600 dark:text-amber-400",
                                )}
                            >
                                {subSubmittedCount ===
                                    subordinateRaters.length &&
                                subordinateRaters.length > 0
                                    ? "Lengkap"
                                    : `${(subordinateRaters.length || 3) - subSubmittedCount} Tersisa`}
                            </span>
                        </div>
                    </div>

                    {/* Total Overall Progress Metric */}
                    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                            <span className="font-medium">Total Evaluator</span>
                            <span className="font-semibold text-primary">
                                {progressPercent}%
                            </span>
                        </div>
                        <div className="flex items-baseline justify-between mb-2">
                            <span className="text-xl font-bold text-foreground">
                                {submittedCount} / {totalRaters || 5}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Terkumpul
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-300 rounded-full",
                                    submittedCount === totalRaters &&
                                        totalRaters > 0
                                        ? "bg-emerald-600"
                                        : "bg-primary",
                                )}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* 360° Evaluators Panel */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                                Panel Penilai (Evaluator)
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Status partisipasi penilaian oleh peserta
                                mandiri, atasan, dan 3 bawahan
                            </p>
                        </div>
                    </div>

                    {externalRaters.length === 0 && !selfRater ? (
                        <div className="rounded-2xl border border-dashed p-8 text-center space-y-3 bg-muted/20">
                            <p className="text-muted-foreground text-sm">
                                Peserta belum mendaftarkan penilai atasan dan
                                bawahan.
                            </p>
                            <Button
                                size="sm"
                                icon={Plus}
                                onClick={() => setAddRatersOpen(true)}
                            >
                                Daftarkan Penilai
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {/* 1. Self Evaluation Card */}
                            {selfRater && (
                                <div
                                    className={cn(
                                        "rounded-2xl border p-5 space-y-4 transition-all shadow-xs flex flex-col justify-between",
                                        selfRater.is_submitted
                                            ? "bg-emerald-50/30 border-emerald-200/80 dark:bg-emerald-950/15 dark:border-emerald-800/60"
                                            : "bg-card border-border/70",
                                    )}
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <Badge
                                                variant="secondary"
                                                className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 text-xs font-semibold"
                                            >
                                                Penilaian Mandiri (Self)
                                            </Badge>
                                            <Badge
                                                variant={
                                                    selfRater.is_submitted
                                                        ? "default"
                                                        : "outline"
                                                }
                                                className={cn(
                                                    "text-[10px] px-2 py-0.5",
                                                    selfRater.is_submitted
                                                        ? "bg-emerald-600 text-white"
                                                        : "text-amber-600 border-amber-300 dark:text-amber-400",
                                                )}
                                            >
                                                {selfRater.is_submitted
                                                    ? "Sudah Selesai"
                                                    : "Belum Selesai"}
                                            </Badge>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-foreground truncate">
                                                {participant.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {participant.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground">
                                        {selfRater.is_submitted ? (
                                            <p className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
                                                <UserCheck className="size-3.5" />
                                                Selesai pada:{" "}
                                                {formatDate(
                                                    selfRater.submitted_at,
                                                )}
                                            </p>
                                        ) : (
                                            <p className="flex items-center gap-1.5">
                                                <Clock className="size-3.5 text-amber-500" />
                                                Belum menyelesaikan kuesioner
                                                mandiri
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 2. External Raters Cards (Atasan & Bawahan) */}
                            {externalRaters.map((rater) => (
                                <div
                                    key={rater.id}
                                    className={cn(
                                        "rounded-2xl border p-5 space-y-4 transition-all shadow-xs flex flex-col justify-between",
                                        rater.is_submitted
                                            ? "bg-emerald-50/30 border-emerald-200/80 dark:bg-emerald-950/15 dark:border-emerald-800/60"
                                            : "bg-card border-border/70",
                                    )}
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "text-xs font-semibold",
                                                    rater.role === "boss"
                                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                                                        : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
                                                )}
                                            >
                                                {rater.role_label}
                                            </Badge>

                                            <div className="flex items-center gap-1.5">
                                                <Badge
                                                    variant={
                                                        rater.is_submitted
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    className={cn(
                                                        "text-[10px] px-2 py-0.5",
                                                        rater.is_submitted
                                                            ? "bg-emerald-600 text-white"
                                                            : "text-amber-600 border-amber-300 dark:text-amber-400",
                                                    )}
                                                >
                                                    {rater.is_submitted
                                                        ? "Sudah Submit"
                                                        : "Belum Submit"}
                                                </Badge>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7 text-muted-foreground hover:text-foreground"
                                                    title="Ubah email penilai"
                                                    onClick={() => {
                                                        setEditRaterTarget(
                                                            rater,
                                                        );
                                                        setEditRaterEmail(
                                                            rater.email || "",
                                                        );
                                                        setEditRaterSendInvitation(
                                                            !rater.is_submitted,
                                                        );
                                                    }}
                                                >
                                                    <Pencil className="size-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-foreground break-all">
                                                {rater.email || "-"}
                                            </p>
                                            <div className="text-xs text-muted-foreground space-y-0.5">
                                                {rater.is_submitted ? (
                                                    <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                                                        Diisi pada:{" "}
                                                        {formatDate(
                                                            rater.submitted_at,
                                                        )}
                                                    </p>
                                                ) : (
                                                    <p>
                                                        Status Undangan:{" "}
                                                        <span className="font-medium text-foreground">
                                                            {rater.invitation_status ===
                                                            "sent"
                                                                ? "Terkirim"
                                                                : rater.invitation_status ===
                                                                    "failed"
                                                                  ? "Gagal Kirim"
                                                                  : "Dalam Antrean"}
                                                        </span>
                                                        {rater.invitation_sent_at && (
                                                            <>
                                                                {" "}
                                                                (
                                                                {formatDate(
                                                                    rater.invitation_sent_at,
                                                                )}
                                                                )
                                                            </>
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {!rater.is_submitted ? (
                                        <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                icon={Mail}
                                                className="flex-1 text-xs h-8"
                                                onClick={() =>
                                                    setResendTarget(rater)
                                                }
                                            >
                                                Kirim Ulang
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={RotateCcw}
                                                className="flex-1 text-xs h-8 text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    setRevokeTarget(rater)
                                                }
                                            >
                                                Cabut Link
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="pt-2 border-t border-border/50 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
                                            <CheckCircle2 className="size-3.5" />
                                            Penilaian telah diserahkan
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Dialog Resend Invitation */}
            <AlertDialog
                open={resendTarget !== null}
                onOpenChange={(open) => !open && setResendTarget(null)}
            >
                <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-md p-6 sm:p-7 rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Kirim Ulang Undangan Penilai?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Undangan evaluasi 360° akan dikirimkan kembali ke
                            alamat email{" "}
                            <strong className="text-foreground">
                                {resendTarget?.email}
                            </strong>{" "}
                            ({resendTarget?.role_label}).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResend}>
                            Kirim Sekarang
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog Revoke Link */}
            <AlertDialog
                open={revokeTarget !== null}
                onOpenChange={(open) => !open && setRevokeTarget(null)}
            >
                <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-md p-6 sm:p-7 rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <ShieldAlert className="size-5" /> Cabut Tautan
                            Penilai?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <p>
                                Tautan lama untuk penilai{" "}
                                <strong className="text-foreground">
                                    {revokeTarget?.email}
                                </strong>{" "}
                                akan segera dimatikan. Jika penilai mencoba
                                membuka tautan lama, halaman akan menampilkan
                                &quot;Tautan tidak tersedia&quot;.
                            </p>
                            <div className="flex items-center gap-2 pt-2">
                                <Checkbox
                                    id="send_new"
                                    checked={sendNewInvitation}
                                    onCheckedChange={(c) =>
                                        setSendNewInvitation(c === true)
                                    }
                                />
                                <Label
                                    htmlFor="send_new"
                                    className="text-xs text-foreground cursor-pointer"
                                >
                                    Kirim tautan baru sekarang ke email penilai
                                </Label>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRevoke}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Cabut Tautan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog Edit Rater */}
            <Dialog
                open={editRaterTarget !== null}
                onOpenChange={(open) => !open && setEditRaterTarget(null)}
            >
                <DialogContent className="w-[calc(100%-2.5rem)] max-w-md p-6 sm:p-7 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Ubah Data Penilai ({editRaterTarget?.role_label})
                        </DialogTitle>
                        <DialogDescription>
                            Perbarui alamat email penilai. Undangan kuesioner
                            dapat dikirim ulang ke alamat baru.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={handleUpdateRater}
                        className="space-y-4 mt-2"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="rater_email">Email Penilai</Label>
                            <Input
                                id="rater_email"
                                type="email"
                                value={editRaterEmail}
                                onChange={(e) =>
                                    setEditRaterEmail(e.target.value)
                                }
                                placeholder="penilai@perusahaan.com"
                                required
                            />
                        </div>

                        {!editRaterTarget?.is_submitted && (
                            <div className="flex items-center gap-2 pt-1">
                                <Checkbox
                                    id="rater_send_invitation"
                                    checked={editRaterSendInvitation}
                                    onCheckedChange={(c) =>
                                        setEditRaterSendInvitation(c === true)
                                    }
                                />
                                <Label
                                    htmlFor="rater_send_invitation"
                                    className="text-xs text-foreground cursor-pointer"
                                >
                                    Kirim ulang undangan kuesioner ke email baru
                                </Label>
                            </div>
                        )}

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditRaterTarget(null)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={raterSaving}>
                                {raterSaving
                                    ? "Menyimpan..."
                                    : "Simpan Perubahan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog Add Raters (Fallback when empty) */}
            <Dialog open={addRatersOpen} onOpenChange={setAddRatersOpen}>
                <DialogContent className="w-[calc(100%-2.5rem)] max-w-lg p-6 sm:p-7 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Daftarkan Penilai 360°</DialogTitle>
                        <DialogDescription>
                            Daftarkan 1 penilai atasan dan 3 penilai bawahan
                            untuk peserta ini. Undangan akan otomatis
                            dikirimkan.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddRaters} className="space-y-4 mt-2">
                        <div className="space-y-2">
                            <Label htmlFor="add_boss_email">
                                Email Atasan Langsung
                            </Label>
                            <Input
                                id="add_boss_email"
                                type="email"
                                value={addBossEmail}
                                onChange={(e) =>
                                    setAddBossEmail(e.target.value)
                                }
                                placeholder="atasan@perusahaan.com"
                                required
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            <Label>Email 3 Bawahan Langsung</Label>
                            {[0, 1, 2].map((idx) => (
                                <Input
                                    key={idx}
                                    type="email"
                                    value={addSubordinates[idx]}
                                    onChange={(e) => {
                                        const next: [string, string, string] = [
                                            ...addSubordinates,
                                        ];
                                        next[idx] = e.target.value;
                                        setAddSubordinates(next);
                                    }}
                                    placeholder={`Bawahan ${idx + 1}@perusahaan.com`}
                                    required
                                />
                            ))}
                        </div>

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAddRatersOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={addingRaters}>
                                {addingRaters
                                    ? "Menyimpan..."
                                    : "Daftarkan Penilai"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog Pulihkan Peserta */}
            <AlertDialog
                open={restoreOpen}
                onOpenChange={setRestoreOpen}
            >
                <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-md p-6 sm:p-7 rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Pulihkan peserta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Akun peserta <strong className="text-foreground">{participant.name}</strong> akan dipulihkan dari data sampah ke daftar peserta aktif.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                router.post(
                                    `/admin/users/${participant.id}/restore`,
                                    {},
                                    {
                                        preserveScroll: true,
                                        onSuccess: () =>
                                            router.visit("/admin/participants"),
                                    },
                                );
                            }}
                        >
                            Pulihkan Sekarang
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog Hapus Permanen */}
            <AlertDialog
                open={forceDeleteOpen}
                onOpenChange={setForceDeleteOpen}
            >
                <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-lg p-6 sm:p-7 rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <ShieldAlert className="size-5 shrink-0" />
                            Hapus Permanen Peserta?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2">
                            <p className="font-semibold text-foreground">
                                Anda akan menghapus akun <span className="underline">{participant.name} ({participant.email})</span> secara permanen dari basis data.
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
                                router.delete(
                                    `/admin/users/${participant.id}/force-delete`,
                                    {
                                        onSuccess: () =>
                                            router.visit(
                                                "/admin/participants?tab=trash",
                                            ),
                                    },
                                );
                            }}
                        >
                            Hapus Permanen Sekarang
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageContainer>
    );
}

ParticipantShow.layout = {
    breadcrumbs: [
        { title: "Peserta", href: "/admin/participants" },
        { title: "Detail" },
    ],
};
