import { Link } from '@inertiajs/react';
import { Pencil, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Drawer } from '@/components/drawer';
import { ErrorState } from '@/components/error-state';
import { StatusBadge, activeStatus } from '@/components/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInitials } from '@/hooks/use-initials';
import { detail, edit } from '@/routes/admin/users';
import type { UserDetail } from '@/types';

const dateTime = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

const formatDate = (iso: string | null) =>
    iso ? dateTime.format(new Date(iso)) : '-';

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="space-y-2">
            <h3 className="text-caption font-semibold tracking-wider text-muted-foreground uppercase">
                {title}
            </h3>
            <dl className="space-y-2 text-sm">{children}</dl>
        </section>
    );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right break-words">{value || '-'}</dd>
        </div>
    );
}

const roleLabel = (role: UserDetail['role']) =>
    role === 'admin' ? 'Administrator' : 'Peserta';

/** Loads detail from the server only when opened for a given user id. */
export function UserDetailDrawer({
    userId,
    onClose,
}: {
    userId: number | null;
    onClose: () => void;
}) {
    const getInitials = useInitials();
    const [user, setUser] = useState<UserDetail | null>(null);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);

    const load = useCallback(async (id: number, signal: AbortSignal) => {
        setUser(null);
        setFailed(false);

        try {
            const res = await fetch(detail(id).url, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
                signal,
            });

            if (!res.ok) {
                throw new Error(String(res.status));
            }

            setUser((await res.json()).data);
        } catch {
            if (!signal.aborted) {
                setFailed(true);
            }
        }
    }, []);

    useEffect(() => {
        if (userId === null) {
            return;
        }

        const controller = new AbortController();
        void load(userId, controller.signal);

        return () => controller.abort();
    }, [userId, attempt, load]);

    return (
        <Drawer
            open={userId !== null}
            onOpenChange={(open) => !open && onClose()}
            title="Detail pengguna"
            footer={
                <>
                    <Button variant="outline" icon={X} onClick={onClose}>
                        Tutup
                    </Button>
                    {userId !== null && (
                        <Button asChild icon={Pencil}>
                            <Link href={edit(userId)}>Edit</Link>
                        </Button>
                    )}
                </>
            }
        >
            {failed ? (
                <ErrorState
                    title="Gagal memuat detail"
                    description="Detail pengguna tidak dapat dimuat."
                    onRetry={() => setAttempt((n) => n + 1)}
                />
            ) : !user ? (
                <div
                    className="space-y-4"
                    role="status"
                    aria-label="Memuat detail pengguna"
                >
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                    </div>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Avatar className="size-12">
                            <AvatarImage
                                src={user.avatar ?? undefined}
                                alt=""
                            />
                            <AvatarFallback className="bg-muted text-foreground">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 space-y-1">
                            <p className="truncate text-sm font-semibold">
                                {user.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {user.email}
                            </p>
                            <div className="flex gap-1.5">
                                <Badge variant="secondary">
                                    {roleLabel(user.role)}
                                </Badge>
                                <StatusBadge
                                    status={activeStatus(user.is_active)}
                                />
                            </div>
                        </div>
                    </div>
                    <Section title="Informasi akun">
                        <Row
                            label="Email"
                            value={
                                user.email_verified_at
                                    ? 'Terverifikasi'
                                    : 'Belum terverifikasi'
                            }
                        />
                        <Row
                            label="Login terakhir"
                            value={formatDate(user.last_login_at)}
                        />
                        <Row
                            label="Dibuat pada"
                            value={formatDate(user.created_at)}
                        />
                    </Section>
                    <Section title="Profil">
                        <Row label="Perusahaan" value={user.company} />
                        <Row label="Jabatan" value={user.position} />
                        <Row label="Telepon" value={user.phone} />
                    </Section>
                    <Section title="Hak akses">
                        <Row label="Role" value={roleLabel(user.role)} />
                    </Section>
                </div>
            )}
        </Drawer>
    );
}
