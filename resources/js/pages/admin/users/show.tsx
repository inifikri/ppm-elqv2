import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    History,
    KeyRound,
    Pencil,
    RotateCcw,
    ShieldAlert,
    Trash2,
    UserCheck,
    Users,
    XCircle,
} from "lucide-react";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import ConfirmDeleteDialog from "@/components/confirm-delete-dialog";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import Pagination from "@/components/pagination";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { destroy, edit, index } from "@/routes/admin/users";
import type { Paginated, UserActivity, UserDetail } from "@/types";

const dateTime = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
});

const formatDate = (iso: string | null | undefined) =>
    iso ? dateTime.format(new Date(iso)) : "-";

export default function UserShow({
    user,
    activities,
}: {
    user: UserDetail;
    activities: Paginated<UserActivity>;
}) {
    const getInitials = useInitials();
    const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
    const [deleteTrashOpen, setDeleteTrashOpen] = useState(false);
    const [restoreOpen, setRestoreOpen] = useState(false);
    const [forceDeleteOpen, setForceDeleteOpen] = useState(false);

    const isParticipant = user.role === "participant";
    const isTrashed = !!user.is_trashed;

    const backUrl = isTrashed ? `${index().url}?tab=trash` : index().url;

    const pageUrl = (page: number) => `/admin/users/${user.id}?page=${page}`;

    return (
        <PageContainer>
            <Head title={`Pengguna: ${user.name}`} />

            <div className="mb-2">
                <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    icon={ArrowLeft}
                    className="-ml-2 text-muted-foreground"
                >
                    <Link href={backUrl}>
                        {isTrashed
                            ? "Kembali ke Data Sampah"
                            : "Kembali ke Daftar Pengguna"}
                    </Link>
                </Button>
            </div>

            <PageHeader
                title={user.name}
                description={user.email}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        {isTrashed ? (
                            <>
                                <Button
                                    variant="outline"
                                    icon={RotateCcw}
                                    onClick={() => setRestoreOpen(true)}
                                >
                                    Pulihkan Pengguna
                                </Button>
                                <Button
                                    variant="destructive"
                                    icon={Trash2}
                                    disabled={!user.can_delete}
                                    onClick={() => setForceDeleteOpen(true)}
                                >
                                    Hapus Permanen
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    icon={KeyRound}
                                    onClick={() => setResetPasswordOpen(true)}
                                >
                                    Reset Password
                                </Button>
                                <Button asChild variant="outline" icon={Pencil}>
                                    <Link href={edit(user.id)}>Ubah Data</Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    icon={Trash2}
                                    className="text-destructive hover:text-destructive"
                                    disabled={!user.can_delete}
                                    onClick={() => setDeleteTrashOpen(true)}
                                >
                                    Pindahkan ke Sampah
                                </Button>
                            </>
                        )}
                    </div>
                }
            />

            {/* Warning banner if in trash */}
            {isTrashed && (
                <div className="rounded-card border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-3">
                    <AlertTriangle className="size-5 shrink-0" />
                    <div>
                        <p className="font-semibold">
                            Akun ini berada di Data Sampah (Dihapus Lunak)
                        </p>
                        <p className="text-xs text-destructive/90 mt-0.5">
                            Akun tidak dapat masuk ke sistem. Anda dapat
                            memulihkannya kembali atau menghapusnya secara
                            permanen.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* User Info Overview */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="rounded-card border bg-card p-5 space-y-4 shadow-xs">
                        <div className="flex items-center gap-4">
                            <Avatar className="size-16">
                                <AvatarImage
                                    src={user.avatar ?? undefined}
                                    alt={user.name}
                                />
                                <AvatarFallback className="bg-muted text-foreground text-lg">
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <h2 className="font-bold text-lg text-foreground truncate">
                                    {user.name}
                                </h2>
                                <p className="text-xs text-muted-foreground truncate">
                                    {user.email}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                    <Badge variant="secondary">
                                        {user.role === "admin"
                                            ? "Administrator"
                                            : "Peserta"}
                                    </Badge>
                                    <StatusBadge
                                        status={activeStatus(user.is_active)}
                                    />
                                </div>
                            </div>
                        </div>

                        <dl className="space-y-3 text-sm border-t pt-4">
                            <div>
                                <dt className="text-xs text-muted-foreground">
                                    Telepon
                                </dt>
                                <dd className="font-medium text-foreground mt-0.5">
                                    {user.phone || "-"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">
                                    Status Verifikasi Email
                                </dt>
                                <dd className="flex items-center gap-1.5 font-medium mt-0.5 text-xs">
                                    {user.email_verified_at ? (
                                        <>
                                            <CheckCircle2 className="size-4 text-emerald-600" />
                                            <span>
                                                Terverifikasi (
                                                {formatDate(
                                                    user.email_verified_at,
                                                )}
                                                )
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="size-4 text-amber-600" />
                                            <span>Belum Terverifikasi</span>
                                        </>
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">
                                    Login Terakhir
                                </dt>
                                <dd className="font-medium text-foreground mt-0.5">
                                    {formatDate(user.last_login_at)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">
                                    Terdaftar Pada
                                </dt>
                                <dd className="font-medium text-foreground mt-0.5">
                                    {formatDate(user.created_at)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted-foreground">
                                    Terakhir Diperbarui
                                </dt>
                                <dd className="font-medium text-foreground mt-0.5">
                                    {formatDate(user.updated_at)}
                                </dd>
                            </div>
                            {user.deleted_at && (
                                <div>
                                    <dt className="text-xs text-destructive">
                                        Dihapus Pada (Data Sampah)
                                    </dt>
                                    <dd className="font-medium text-destructive mt-0.5">
                                        {formatDate(user.deleted_at)}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Participant Profile Callout */}
                    {isParticipant && (
                        <div className="rounded-card border bg-card p-5 space-y-3 shadow-xs border-primary/20 bg-primary/5">
                            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                                <Users className="size-4" />
                                <span>Profil Peserta Assessment</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Pengguna ini terdaftar sebagai subjek penilaian
                                kepemimpinan 360°.
                            </p>
                            <div className="space-y-1.5 text-xs text-foreground bg-card p-3 rounded-control border">
                                <p>
                                    <strong className="text-muted-foreground">
                                        Perusahaan:
                                    </strong>{" "}
                                    {user.company || "-"}
                                </p>
                                <p>
                                    <strong className="text-muted-foreground">
                                        Jabatan:
                                    </strong>{" "}
                                    {user.position || "-"}
                                </p>
                            </div>
                            <Button
                                asChild
                                size="sm"
                                className="w-full text-xs"
                            >
                                <Link href={`/admin/participants/${user.id}`}>
                                    Buka Detail & Evaluator Peserta &rarr;
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Activity Log Table */}
                <div className="space-y-4 lg:col-span-2">
                    {/* <div className="rounded-card border bg-card p-5 shadow-xs space-y-4"> */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                                <History className="size-4 text-primary" />{" "}
                                Riwayat Log Aktivitas
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Catatan audit aktivitas yang melibatkan akun ini
                                sebagai subjek maupun pelaku
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-control border">
                        <Table>
                            <TableHeader className="bg-muted [&_th]:h-10 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wider [&_th]:text-muted-foreground [&_th]:uppercase">
                                <TableRow>
                                    <TableHead scope="col" className="w-40">
                                        Waktu
                                    </TableHead>
                                    <TableHead scope="col">Aktivitas</TableHead>
                                    <TableHead scope="col" className="w-36">
                                        Pelaku
                                    </TableHead>
                                    <TableHead
                                        scope="col"
                                        className="w-28 text-right"
                                    >
                                        Modul
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="bg-white dark:bg-card">
                                {activities.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="py-8 text-center text-muted-foreground text-sm"
                                        >
                                            Belum ada aktivitas tercatat untuk
                                            akun ini.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    activities.data.map((act) => (
                                        <TableRow
                                            key={act.id}
                                            className="text-xs hover:bg-accent/40"
                                        >
                                            <TableCell className="text-muted-foreground font-mono">
                                                {formatDate(act.created_at)}
                                            </TableCell>
                                            <TableCell className="font-medium text-foreground">
                                                {act.description}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {act.causer_name}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] uppercase font-mono"
                                                >
                                                    {act.log_name || "default"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <Pagination paginator={activities} pageUrl={pageUrl} />
                    {/* </div> */}
                </div>
            </div>

            {/* Reset Password Dialog */}
            <AlertDialog
                open={resetPasswordOpen}
                onOpenChange={setResetPasswordOpen}
            >
                <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-md p-6 sm:p-7 rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Kirim tautan reset password?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Tautan reset password sekali pakai akan dikirimkan
                            ke email{" "}
                            <strong className="text-foreground">
                                {user.email}
                            </strong>
                            . Admin tidak melihat maupun menentukan password
                            pengguna secara langsung.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                router.post(
                                    `/admin/users/${user.id}/reset-password`,
                                    {},
                                    { preserveScroll: true },
                                );
                            }}
                        >
                            Kirim Tautan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Move to Trash Dialog */}
            <ConfirmDeleteDialog
                title="Pindahkan pengguna ke sampah?"
                open={deleteTrashOpen}
                onOpenChange={setDeleteTrashOpen}
                description={`${user.name} akan dinonaktifkan dan dipindahkan ke data sampah. Anda masih dapat memulihkannya nanti.`}
                onConfirm={() =>
                    router.delete(destroy(user.id).url, {
                        onSuccess: () => router.visit(index().url),
                    })
                }
            />

            {/* Restore Dialog */}
            <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
                <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-md p-6 sm:p-7 rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Pulihkan pengguna?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Akun{" "}
                            <strong className="text-foreground">
                                {user.name}
                            </strong>{" "}
                            akan dipulihkan dari data sampah ke daftar pengguna
                            aktif.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                router.post(
                                    `/admin/users/${user.id}/restore`,
                                    {},
                                    { preserveScroll: true },
                                );
                            }}
                        >
                            Pulihkan Sekarang
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Force Delete (Hapus Permanen) Dialog */}
            <AlertDialog
                open={forceDeleteOpen}
                onOpenChange={setForceDeleteOpen}
            >
                <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-lg p-6 sm:p-7 rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <ShieldAlert className="size-5 shrink-0" />
                            Hapus Permanen Pengguna?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2">
                            <p className="font-semibold text-foreground">
                                Anda akan menghapus akun{" "}
                                <span className="underline">
                                    {user.name} ({user.email})
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
                                * Catatan audit log aktivitas tetap disimpan permanen untuk keperluan rekam jejak kepatuhan sistem.
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
                                    `/admin/users/${user.id}/force-delete`,
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

UserShow.layout = {
    breadcrumbs: [
        { title: "Pengguna", href: index() },
        { title: "Detail", href: "#" },
    ],
};
