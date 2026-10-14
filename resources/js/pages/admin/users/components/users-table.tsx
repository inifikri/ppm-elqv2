import {
    Eye,
    Pencil,
    RotateCcw,
    ShieldAlert,
    Trash2,
    UserCheck,
    UserX,
} from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { BulkActionBar, type BulkAction } from '@/components/bulk-action-bar';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { StatusBadge, activeStatus } from '@/components/status-badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { bulk, destroy, edit } from '@/routes/admin/users';
import type { ManagedUser } from '@/types';

export default function UsersTable({
    users,
    tab = 'all',
}: {
    users: ManagedUser[];
    tab?: string;
}) {
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [target, setTarget] = useState<ManagedUser | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<ManagedUser | null>(null);
    const [forceDeleteTarget, setForceDeleteTarget] = useState<ManagedUser | null>(null);

    const isTrash = tab === 'trash';
    const allSelected = users.length > 0 && selected.size === users.length;

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

    const runBulk = (action: 'activate' | 'deactivate' | 'delete' | 'restore' | 'force_delete') =>
        router.post(
            bulk().url,
            { action, ids: [...selected] },
            { preserveScroll: true, onSuccess: clear },
        );

    const bulkActions: BulkAction[] = isTrash
        ? [
              {
                  label: 'Pulihkan',
                  icon: RotateCcw,
                  onClick: () => runBulk('restore'),
                  confirm: {
                      title: 'Pulihkan pengguna?',
                      description: `${selected.size} pengguna terpilih akan dipulihkan dari data sampah.`,
                  },
              },
              {
                  label: 'Hapus Permanen',
                  icon: Trash2,
                  destructive: true,
                  onClick: () => runBulk('force_delete'),
                  confirm: {
                      title: 'Hapus permanen pengguna terpilih?',
                      description: `${selected.size} pengguna terpilih beserta seluruh data terkait (profil, penilai, jawaban kuesioner, log email, log aktivitas) akan DIHAPUS PERMANEN dari database. Tindakan ini TIDAK DAPAT DIBATALKAN.`,
                  },
              },
          ]
        : [
              {
                  label: 'Aktifkan',
                  icon: UserCheck,
                  onClick: () => runBulk('activate'),
              },
              {
                  label: 'Nonaktifkan',
                  icon: UserX,
                  onClick: () => runBulk('deactivate'),
              },
              {
                  label: 'Hapus',
                  icon: Trash2,
                  destructive: true,
                  onClick: () => runBulk('delete'),
                  confirm: {
                      title: 'Hapus pengguna?',
                      description: `${selected.size} pengguna terpilih akan dipindahkan ke data sampah. Akun yang dilindungi akan dilewati.`,
                  },
              },
          ];

    return (
        <div className="space-y-3">
            <div className="overflow-x-auto rounded-card border bg-card">
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
                                              ? 'indeterminate'
                                              : false
                                    }
                                    onCheckedChange={(c) =>
                                        setSelected(
                                            c === true
                                                ? new Set(users.map((u) => u.id))
                                                : new Set(),
                                        )
                                    }
                                />
                            </TableHead>
                            <TableHead scope="col">Nama</TableHead>
                            <TableHead scope="col">Email</TableHead>
                            <TableHead scope="col">Role</TableHead>
                            <TableHead scope="col">Status</TableHead>
                            <TableHead scope="col" className="text-right">
                                Aksi
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    {isTrash
                                        ? 'Data sampah kosong.'
                                        : 'Tidak ada pengguna yang cocok.'}
                                </TableCell>
                            </TableRow>
                        )}
                        {users.map((user) => (
                            <TableRow
                                key={user.id}
                                className="hover:bg-accent/40"
                            >
                                <TableCell>
                                    <Checkbox
                                        aria-label={`Pilih ${user.name}`}
                                        checked={selected.has(user.id)}
                                        onCheckedChange={(c) =>
                                            toggle(user.id, c === true)
                                        }
                                    />
                                </TableCell>
                                <TableCell className="font-medium">
                                    <Link
                                        href={`/admin/users/${user.id}`}
                                        className="text-foreground hover:underline"
                                    >
                                        {user.name}
                                    </Link>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">
                                        {user.role === 'admin'
                                            ? 'Admin'
                                            : 'Peserta'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge
                                        status={activeStatus(user.is_active)}
                                    />
                                </TableCell>
                                <TableCell className="text-right space-x-1">
                                    {isTrash ? (
                                        <>
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Lihat detail ${user.name}`}
                                                title="Lihat detail"
                                            >
                                                <Link href={`/admin/users/${user.id}`}>
                                                    <Eye className="size-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Pulihkan ${user.name}`}
                                                title="Pulihkan data"
                                                onClick={() => setRestoreTarget(user)}
                                            >
                                                <RotateCcw className="size-4 text-primary" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Hapus permanen ${user.name}`}
                                                title="Hapus permanen"
                                                disabled={!user.can_delete}
                                                onClick={() => setForceDeleteTarget(user)}
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
                                                aria-label={`Lihat detail ${user.name}`}
                                                title="Lihat detail"
                                            >
                                                <Link href={`/admin/users/${user.id}`}>
                                                    <Eye className="size-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="icon"
                                                title="Ubah pengguna"
                                            >
                                                <Link
                                                    href={edit(user.id)}
                                                    aria-label={`Ubah ${user.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Hapus ${user.name}`}
                                                title="Hapus pengguna"
                                                disabled={!user.can_delete}
                                                onClick={() => setTarget(user)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <BulkActionBar
                selectedCount={selected.size}
                actions={bulkActions}
                onClear={clear}
            />

            <ConfirmDeleteDialog
                title="Hapus pengguna?"
                open={target !== null}
                onOpenChange={(open) => !open && setTarget(null)}
                description={`${target?.name ?? ''} akan dipindahkan ke data sampah. Tindakan ini dapat dipulihkan.`}
                onConfirm={() =>
                    target &&
                    router.delete(destroy(target.id).url, {
                        preserveScroll: true,
                    })
                }
            />

            {/* Restore Dialog */}
            <AlertDialog
                open={restoreTarget !== null}
                onOpenChange={(open) => !open && setRestoreTarget(null)}
            >
                <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-md p-6 sm:p-7 rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Pulihkan pengguna?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Akun <strong className="text-foreground">{restoreTarget?.name}</strong> akan
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
                                        { preserveScroll: true },
                                    );
                                }
                            }}
                        >
                            Pulihkan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Force Delete Dialog */}
            <AlertDialog
                open={forceDeleteTarget !== null}
                onOpenChange={(open) => !open && setForceDeleteTarget(null)}
            >
                <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-lg p-6 sm:p-7 rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <ShieldAlert className="size-5 shrink-0" />
                            Hapus Permanen Pengguna?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2">
                            <p className="font-semibold text-foreground">
                                Anda akan menghapus akun <span className="underline">{forceDeleteTarget?.name} ({forceDeleteTarget?.email})</span> secara permanen dari basis data.
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
        </div>
    );
}
