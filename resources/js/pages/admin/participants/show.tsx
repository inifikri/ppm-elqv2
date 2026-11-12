import {
    AlertTriangle,
    ArrowLeft,
    Bell,
    Briefcase,
    Building2,
    Calendar,
    CalendarClock,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Copy,
    ExternalLink,
    FileBarChart2,
    Mail,
    Pencil,
    Phone,
    Plus,
    RotateCcw,
    Send,
    ShieldAlert,
    Trash2,
    UserCheck,
    Users,
} from "lucide-react";
import { toast } from "sonner";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import {
    remind as remindRater,
    resend as resendRater,
    revoke as revokeRater,
    store as storeRaters,
    update as updateRater,
} from "@/routes/admin/participants/raters";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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

    // Reminder state
    const [reminderTarget, setReminderTarget] =
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
    const [editRaterError, setEditRaterError] = useState<string | null>(null);

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
            resendRater.url({
                participant: participant.id,
                rater: resendTarget,
            }),
            {},
            {
                preserveScroll: true,
                onFinish: () => setResendTarget(null),
            },
        );
    };

    const handleRemind = () => {
        if (!reminderTarget) return;
        router.post(
            remindRater.url({
                participant: participant.id,
                rater: reminderTarget,
            }),
            {},
            {
                preserveScroll: true,
                onFinish: () => setReminderTarget(null),
            },
        );
    };

    const handleRevoke = () => {
        if (!revokeTarget) return;
        router.post(
            revokeRater.url({
                participant: participant.id,
                rater: revokeTarget,
            }),
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
        setEditRaterError(null);
        router.put(
            updateRater.url({
                participant: participant.id,
                rater: editRaterTarget,
            }),
            {
                email: editRaterEmail,
                send_invitation: editRaterSendInvitation,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditRaterTarget(null);
                    setEditRaterError(null);
                },
                onError: (errors) => {
                    const msg =
                        errors.email ||
                        errors.message ||
                        Object.values(errors)[0] ||
                        "Gagal memperbarui data penilai.";
                    setEditRaterError(String(msg));
                },
                onFinish: () => setRaterSaving(false),
            },
        );
    };

    const handleAddRaters = (e: React.FormEvent) => {
        e.preventDefault();
        setAddingRaters(true);
        router.post(
            storeRaters.url({
                participant: participant.id,
            }),
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

    const [copiedUlid, setCopiedUlid] = useState<string | null>(null);

    const handleCopyLink = (rater: ParticipantRaterItem) => {
        const url = `${window.location.origin}/rater/${rater.ulid}`;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard
                .writeText(url)
                .then(() => {
                    setCopiedUlid(rater.ulid);
                    toast.success(
                        `Tautan penilai (${rater.role_label}) berhasil disalin.`,
                    );
                    setTimeout(() => setCopiedUlid(null), 2500);
                })
                .catch(() => {
                    toast.error("Gagal menyalin tautan.");
                });
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = url;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand("copy");
                setCopiedUlid(rater.ulid);
                toast.success(
                    `Tautan penilai (${rater.role_label}) berhasil disalin.`,
                );
                setTimeout(() => setCopiedUlid(null), 2500);
            } catch {
                toast.error("Gagal menyalin tautan.");
            } finally {
                document.body.removeChild(textArea);
            }
        }
    };

    const selfRater = raters.find((r) => r.role === "self");
    const bossRater = raters.find((r) => r.role === "boss");
    const subordinateRaters = raters.filter((r) => r.role === "subordinate");
    const externalRaters = raters.filter((r) => r.role !== "self");

    const totalRaters = raters.length;
    const submittedCount = raters.filter((r) => r.is_submitted).length;
    const pendingCount = totalRaters - submittedCount;
    const overdueRaters = externalRaters.filter(
        (r) => !r.is_submitted && r.is_overdue,
    );
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

            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
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

                {/* Tombol Navigasi Antar-Peserta (Previous & Next) */}
                <div className="flex items-center gap-1.5">
                    {participant.prev_participant ? (
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            icon={ChevronLeft}
                            title={`Peserta sebelumnya: ${participant.prev_participant.name}`}
                        >
                            <Link
                                href={`/admin/participants/${participant.prev_participant.id}`}
                            >
                                Sebelumnya
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            icon={ChevronLeft}
                            disabled
                            title="Tidak ada peserta sebelumnya"
                        >
                            Sebelumnya
                        </Button>
                    )}

                    {participant.next_participant ? (
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            iconRight={ChevronRight}
                            title={`Peserta berikutnya: ${participant.next_participant.name}`}
                        >
                            <Link
                                href={`/admin/participants/${participant.next_participant.id}`}
                            >
                                Berikutnya
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            iconRight={ChevronRight}
                            disabled
                            title="Tidak ada peserta berikutnya"
                        >
                            Berikutnya
                        </Button>
                    )}
                </div>
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
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-3">
                        <Trash2 className="size-5 shrink-0" />
                        <div>
                            <p className="font-semibold text-foreground">
                                Akun Peserta Berada di Data Sampah
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Data peserta ini telah dinonaktifkan. Anda dapat
                                memulihkan kembali ke daftar aktif atau
                                menghapusnya secara permanen.
                            </p>
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

                {/* Banner Notifikasi Sistem: Penilai Melewati Batas 2 Hari */}
                {overdueRaters.length > 0 && (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div>
                                <p className="font-semibold text-foreground">
                                    Notifikasi Sistem: {overdueRaters.length}{" "}
                                    Penilai Melewati Batas Waktu 2 Hari
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Terdapat penilai yang belum menyelesaikan
                                    kuesioner asesmen dalam waktu lebih dari 2
                                    hari sejak didaftarkan:{" "}
                                    <span className="font-medium text-foreground">
                                        {overdueRaters
                                            .map(
                                                (r) =>
                                                    `${r.role_label} (${r.email})`,
                                            )
                                            .join(", ")}
                                    </span>
                                    . Anda dapat menggunakan tombol{" "}
                                    <strong>Kirim Pengingat</strong> pada tabel
                                    di bawah untuk mengirimkan pesan pengingat
                                    resmi.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 360° Evaluators Panel: Tabel Modern */}
                <div className="space-y-3">
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
                        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/40 [&_th]:h-11 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wider [&_th]:text-muted-foreground [&_th]:uppercase">
                                        <TableRow>
                                            <TableHead
                                                scope="col"
                                                className="min-w-[170px]"
                                            >
                                                Peran Penilai
                                            </TableHead>
                                            <TableHead
                                                scope="col"
                                                className="min-w-[220px]"
                                            >
                                                Identitas / Email
                                            </TableHead>
                                            <TableHead
                                                scope="col"
                                                className="min-w-[130px]"
                                            >
                                                Status Asesmen
                                            </TableHead>
                                            <TableHead
                                                scope="col"
                                                className="min-w-[210px]"
                                            >
                                                Durasi Menunggu
                                            </TableHead>
                                            <TableHead
                                                scope="col"
                                                className="min-w-[160px]"
                                            >
                                                Status Undangan
                                            </TableHead>
                                            <TableHead
                                                scope="col"
                                                className="text-right min-w-[240px]"
                                            >
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="bg-white dark:bg-card">
                                        {/* 1. Self Evaluation Row */}
                                        {selfRater && (
                                            <TableRow className="hover:bg-accent/40">
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground text-xs font-semibold"
                                                    >
                                                        Penilaian Mandiri (Self)
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-foreground text-sm">
                                                        {participant.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {participant.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            selfRater.is_submitted
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        className={cn(
                                                            "text-[10px] px-2 py-0.5",
                                                            selfRater.is_submitted
                                                                ? "bg-primary text-primary-foreground"
                                                                : "text-amber-600 border-amber-300 dark:text-amber-400",
                                                        )}
                                                    >
                                                        {selfRater.is_submitted
                                                            ? "Sudah Selesai"
                                                            : "Belum Selesai"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {selfRater.is_submitted ? (
                                                        <div className="text-xs text-primary flex items-center gap-1.5 font-medium">
                                                            <UserCheck className="size-3.5" />
                                                            Selesai pada:{" "}
                                                            {formatDate(
                                                                selfRater.submitted_at,
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                            <Clock className="size-3.5 text-amber-500" />
                                                            Menunggu pengisian
                                                            peserta
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs text-muted-foreground">
                                                        Mengisi mandiri di akun
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="text-xs text-muted-foreground italic">
                                                        -
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {/* 2. External Raters Rows (Atasan & Bawahan) */}
                                        {externalRaters.map((rater) => (
                                            <TableRow
                                                key={rater.id}
                                                className="hover:bg-accent/40"
                                            >
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            "text-xs font-semibold",
                                                            rater.role ===
                                                                "boss"
                                                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                                                                : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
                                                        )}
                                                    >
                                                        {rater.role_label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-foreground text-sm break-all">
                                                        {rater.email || "-"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            rater.is_submitted
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        className={cn(
                                                            "text-[10px] px-2 py-0.5",
                                                            rater.is_submitted
                                                                ? "bg-primary text-primary-foreground"
                                                                : "text-amber-600 border-amber-300 dark:text-amber-400",
                                                        )}
                                                    >
                                                        {rater.is_submitted
                                                            ? "Sudah Submit"
                                                            : "Belum Submit"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {rater.is_submitted ? (
                                                        <div className="text-xs text-primary flex items-center gap-1.5 font-medium">
                                                            <CheckCircle2 className="size-3.5" />
                                                            Diserahkan:{" "}
                                                            {formatDate(
                                                                rater.submitted_at,
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            {rater.is_overdue ? (
                                                                <Badge
                                                                    variant="destructive"
                                                                    className="bg-amber-600 hover:bg-amber-600 text-white gap-1 text-[11px] font-medium w-fit"
                                                                >
                                                                    <AlertTriangle className="size-3" />
                                                                    Menunggu{" "}
                                                                    {
                                                                        rater.days_pending
                                                                    }{" "}
                                                                    hari
                                                                    (Melewati 2
                                                                    hari)
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-muted-foreground gap-1 text-[11px] w-fit"
                                                                >
                                                                    <Clock className="size-3 text-sky-500" />
                                                                    Menunggu{" "}
                                                                    {rater.days_pending ===
                                                                    0
                                                                        ? "Hari ini (< 24 jam)"
                                                                        : `${rater.days_pending} hari`}
                                                                </Badge>
                                                            )}
                                                            {rater.created_at && (
                                                                <div className="text-[11px] text-muted-foreground/75">
                                                                    Daftar:{" "}
                                                                    {formatDate(
                                                                        rater.created_at,
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs text-muted-foreground space-y-0.5">
                                                        <div className="font-medium text-foreground">
                                                            {rater.invitation_status ===
                                                            "sent"
                                                                ? "Terkirim"
                                                                : rater.invitation_status ===
                                                                    "failed"
                                                                  ? "Gagal Kirim"
                                                                  : "Dalam Antrean"}
                                                        </div>
                                                        {rater.invitation_sent_at && (
                                                            <div className="text-[11px]">
                                                                {formatDate(
                                                                    rater.invitation_sent_at,
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {rater.is_submitted ? (
                                                        <span className="text-xs text-primary font-medium inline-flex items-center gap-1">
                                                            <CheckCircle2 className="size-3.5" />
                                                            Selesai
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                icon={Send}
                                                                className="h-8 text-xs font-medium"
                                                                onClick={() =>
                                                                    setReminderTarget(
                                                                        rater,
                                                                    )
                                                                }
                                                            >
                                                                Kirim Pengingat
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 text-muted-foreground hover:text-foreground"
                                                                title="Salin tautan penilai"
                                                                onClick={() =>
                                                                    handleCopyLink(
                                                                        rater,
                                                                    )
                                                                }
                                                            >
                                                                {copiedUlid ===
                                                                rater.ulid ? (
                                                                    <Check className="size-3.5 text-emerald-600" />
                                                                ) : (
                                                                    <Copy className="size-3.5" />
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 text-muted-foreground hover:text-foreground"
                                                                title="Ubah email penilai"
                                                                onClick={() => {
                                                                    setEditRaterTarget(
                                                                        rater,
                                                                    );
                                                                    setEditRaterEmail(
                                                                        rater.email ||
                                                                            "",
                                                                    );
                                                                    setEditRaterSendInvitation(
                                                                        !rater.is_submitted,
                                                                    );
                                                                    setEditRaterError(
                                                                        null,
                                                                    );
                                                                }}
                                                            >
                                                                <Pencil className="size-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 text-destructive hover:text-destructive"
                                                                title="Cabut tautan penilai"
                                                                onClick={() =>
                                                                    setRevokeTarget(
                                                                        rater,
                                                                    )
                                                                }
                                                            >
                                                                <RotateCcw className="size-3.5" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Dialog Konfirmasi Kirim Pengingat */}
            <AlertDialog
                open={reminderTarget !== null}
                onOpenChange={(open) => !open && setReminderTarget(null)}
            >
                <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-lg p-6 sm:p-7 rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                            <Send className="size-5 text-primary" />
                            Kirim Email Pengingat Asesmen?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <p>
                                Sistem akan mengirimkan pesan email pengingat
                                resmi dengan format profesional dan sopan ke
                                alamat email penilai:
                            </p>
                            <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 text-xs space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Peran Penilai:
                                    </span>
                                    <strong className="text-foreground">
                                        {reminderTarget?.role_label}
                                    </strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Alamat Email:
                                    </span>
                                    <span className="font-mono font-medium text-foreground">
                                        {reminderTarget?.email}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Peserta Dinilai:
                                    </span>
                                    <span className="text-foreground font-medium">
                                        {participant.name}
                                    </span>
                                </div>
                                {reminderTarget?.days_pending !== null &&
                                    reminderTarget?.days_pending !==
                                        undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Durasi Menunggu:
                                            </span>
                                            <span
                                                className={cn(
                                                    "font-semibold",
                                                    reminderTarget.is_overdue
                                                        ? "text-amber-600 dark:text-amber-400"
                                                        : "text-foreground",
                                                )}
                                            >
                                                {reminderTarget.days_pending}{" "}
                                                hari
                                                {reminderTarget.is_overdue &&
                                                    " (Melewati batas 2 hari)"}
                                            </span>
                                        </div>
                                    )}
                            </div>
                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] text-muted-foreground leading-relaxed">
                                <strong className="text-primary block mb-1">
                                    Format Pesan Pengingat (Bahasa Baku &
                                    Sopan):
                                </strong>
                                &ldquo;Yth. Bapak/Ibu Penilai, kami menyampaikan
                                pengingat terkait pelaksanaan evaluasi
                                kepemimpinan 360° untuk rekan kerja Anda (
                                {participant.name}). Mohon kesediaannya
                                meluangkan waktu sejenak (10–15 menit) guna
                                menyelesaikan kuesioner melalui tautan aman yang
                                kami sertakan.&rdquo;
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemind}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            Kirim Pengingat Sekarang
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
                onOpenChange={(open) => {
                    if (!open) {
                        setEditRaterTarget(null);
                        setEditRaterError(null);
                    }
                }}
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
                                onChange={(e) => {
                                    setEditRaterEmail(e.target.value);
                                    if (editRaterError) setEditRaterError(null);
                                }}
                                placeholder="penilai@perusahaan.com"
                                className={cn(
                                    editRaterError &&
                                        "border-destructive focus-visible:ring-destructive",
                                )}
                                required
                            />
                            {editRaterError && (
                                <p className="text-xs text-destructive font-medium">
                                    {editRaterError}
                                </p>
                            )}
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
                                onClick={() => {
                                    setEditRaterTarget(null);
                                    setEditRaterError(null);
                                }}
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
                            <Label>Email 3 Bawahan/Rekan Langsung</Label>
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
                                    placeholder={`Bawahan/Rekan ${idx + 1}@perusahaan.com`}
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
            <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
                <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-md p-6 sm:p-7 rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Pulihkan peserta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Akun peserta{" "}
                            <strong className="text-foreground">
                                {participant.name}
                            </strong>{" "}
                            akan dipulihkan dari data sampah ke daftar peserta
                            aktif.
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
                                Anda akan menghapus akun{" "}
                                <span className="underline">
                                    {participant.name} ({participant.email})
                                </span>{" "}
                                secara permanen dari basis data.
                            </p>
                            <div className="rounded-control bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive space-y-1.5">
                                <p className="font-semibold">
                                    Perhatian: Data berikut akan ikut terhapus
                                    permanen:
                                </p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li>
                                        Kredensial login & data profil pengguna
                                    </li>
                                    <li>
                                        Profil peserta (informasi perusahaan &
                                        jabatan)
                                    </li>
                                    <li>
                                        Seluruh data penilai (atasan & bawahan)
                                        terkait
                                    </li>
                                    <li>
                                        Seluruh jawaban kuesioner assessment
                                        terkait
                                    </li>
                                    <li>Riwayat pencatatan log email</li>
                                </ul>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                * Catatan audit log aktivitas tetap disimpan
                                permanen untuk keperluan rekam jejak kepatuhan
                                sistem.
                            </p>
                            <p className="text-xs text-muted-foreground font-semibold">
                                PERINGATAN: Tindakan ini TIDAK DAPAT DIBATALKAN
                                atau dipulihkan kembali.
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
