import { Eye, FileBarChart2, Pencil, Trash2, UserCheck, UserX } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { BulkActionBar, type BulkAction } from '@/components/bulk-action-bar';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { StatusBadge, activeStatus } from '@/components/status-badge';
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
import { UserDetailDrawer } from './user-detail-drawer';

export default function UsersTable({ users }: { users: ManagedUser[] }) {
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [target, setTarget] = useState<ManagedUser | null>(null);
    const [detailId, setDetailId] = useState<number | null>(null);

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
    const runBulk = (action: 'activate' | 'deactivate' | 'delete') =>
        router.post(
            bulk().url,
            { action, ids: [...selected] },
            { preserveScroll: true, onSuccess: clear },
        );

    const bulkActions: BulkAction[] = [
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
                description: `${selected.size} pengguna terpilih akan dihapus. Akun yang dilindungi akan dilewati.`,
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
                                                ? new Set(
                                                      users.map((u) => u.id),
                                                  )
                                                : new Set(),
                                        )
                                    }
                                />
                            </TableHead>
                            <TableHead scope="col">Nama</TableHead>
                            <TableHead scope="col">Email</TableHead>
                            <TableHead scope="col">Role</TableHead>
                            <TableHead
                                scope="col"
                                className="hidden md:table-cell"
                            >
                                Perusahaan / Jabatan
                            </TableHead>
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
                                    colSpan={7}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    Tidak ada pengguna yang cocok.
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
                                    <button
                                        type="button"
                                        className="rounded-control text-left outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                                        onClick={() => setDetailId(user.id)}
                                    >
                                        {user.name}
                                    </button>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">
                                        {user.role === 'admin'
                                            ? 'Admin'
                                            : 'Peserta'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="hidden text-muted-foreground md:table-cell">
                                    {user.company
                                        ? `${user.company} / ${user.position}`
                                        : '-'}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge
                                        status={activeStatus(user.is_active)}
                                    />
                                </TableCell>
                                <TableCell className="text-right">
                                    {user.role === 'participant' && (
                                        <Button
                                            asChild
                                            variant="ghost"
                                            size="icon"
                                            title="Hasil Assessment"
                                        >
                                            <Link
                                                href={`/admin/participants/${user.id}/result`}
                                                aria-label={`Lihat hasil assessment ${user.name}`}
                                            >
                                                <FileBarChart2 />
                                            </Link>
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Lihat detail ${user.name}`}
                                        title="Lihat detail"
                                        onClick={() => setDetailId(user.id)}
                                    >
                                        <Eye />
                                    </Button>
                                    <Button asChild variant="ghost" size="icon">
                                        <Link
                                            href={edit(user.id)}
                                            aria-label={`Ubah ${user.name}`}
                                        >
                                            <Pencil />
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Hapus ${user.name}`}
                                        disabled={!user.can_delete}
                                        onClick={() => setTarget(user)}
                                    >
                                        <Trash2 />
                                    </Button>
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
            <UserDetailDrawer
                userId={detailId}
                onClose={() => setDetailId(null)}
            />
            <ConfirmDeleteDialog
                title="Hapus pengguna?"
                open={target !== null}
                onOpenChange={(open) => !open && setTarget(null)}
                description={`${target?.name ?? ''} akan dihapus. Tindakan ini dapat dipulihkan oleh pengelola data.`}
                onConfirm={() =>
                    target &&
                    router.delete(destroy(target.id).url, {
                        preserveScroll: true,
                    })
                }
            />
        </div>
    );
}
