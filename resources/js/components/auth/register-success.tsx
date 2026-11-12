import { AlertTriangle, Check, MailCheck, Pencil, Send, X } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { xhr } from '@/lib/xhr';
import { login } from '@/routes';
import { update } from '@/routes/profile';
import { send } from '@/routes/verification';

const COOLDOWN = 60;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterSuccessProps {
    email: string;
    mailSent?: boolean;
}

export function RegisterSuccess({ email, mailSent = true }: RegisterSuccessProps) {
    const [currentEmail, setCurrentEmail] = useState(email);
    const [isEditing, setIsEditing] = useState(false);
    const [newEmail, setNewEmail] = useState(email);
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState('');

    const [seconds, setSeconds] = useState(mailSent ? COOLDOWN : 0);
    const [busy, setBusy] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const heading = useRef<HTMLHeadingElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => heading.current?.focus(), []);

    useEffect(() => {
        if (isEditing) {
            editInputRef.current?.focus();
            editInputRef.current?.select();
        }
    }, [isEditing]);

    useEffect(() => {
        if (seconds <= 0) {
            return;
        }

        const id = setTimeout(() => setSeconds((s) => s - 1), 1000);

        return () => clearTimeout(id);
    }, [seconds]);

    const resend = async () => {
        setBusy(true);
        setError('');
        const [status] = await xhr(send.url(), { method: 'POST' }).catch(
            () => [0] as const,
        );
        setBusy(false);

        if (status === 429) {
            setError('Terlalu banyak permintaan. Coba lagi sebentar lagi.');
        } else if (status >= 200 && status < 300) {
            setSent(true);
        } else {
            setError(
                'Gagal mengirim ulang. Periksa koneksi Anda lalu coba lagi.',
            );
        }

        setSeconds(COOLDOWN);
    };

    const handleSaveEmail = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = newEmail.trim().toLowerCase();

        if (!trimmed) {
            setEditError('Alamat email wajib diisi.');
            return;
        }

        if (!EMAIL_FORMAT.test(trimmed)) {
            setEditError('Format email tidak valid.');
            return;
        }

        if (trimmed === currentEmail.toLowerCase()) {
            setIsEditing(false);
            setEditError('');
            return;
        }

        setSaving(true);
        setEditError('');

        const [status, data] = await xhr<{
            errors?: { email?: string[] };
            message?: string;
        }>(update.url(), {
            method: 'PATCH',
            body: { email: trimmed },
        }).catch(() => [0, {}] as const);

        setSaving(false);

        if (status >= 200 && status < 300) {
            setCurrentEmail(trimmed);
            setIsEditing(false);
            setSent(true);
            setSeconds(COOLDOWN);
            void xhr(send.url(), { method: 'POST' }).catch(() => null);
        } else if (status === 422 && data.errors?.email?.[0]) {
            setEditError(data.errors.email[0]);
        } else if (status === 429) {
            setEditError('Terlalu banyak permintaan. Silakan tunggu.');
        } else {
            setEditError('Gagal memperbarui email. Periksa koneksi Anda.');
        }
    };

    return (
        <div className="grid gap-5 text-center">
            <MailCheck
                className="mx-auto size-10 text-primary"
                aria-hidden="true"
            />
            <div className="grid gap-2">
                <h2
                    ref={heading}
                    tabIndex={-1}
                    className="text-lg font-semibold outline-none"
                >
                    Cek email Anda
                </h2>

                <p className="text-sm text-muted-foreground">
                    Kami mengirim tautan verifikasi ke{' '}
                    <strong className="font-semibold text-foreground break-all">
                        {currentEmail}
                    </strong>
                    . Buka email tersebut lalu klik tautannya untuk mengaktifkan
                    akun.
                </p>

                {!isEditing ? (
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                setNewEmail(currentEmail);
                                setEditError('');
                                setIsEditing(true);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                        >
                            <Pencil className="size-3" />
                            Salah email? Ubah alamat email
                        </button>
                    </div>
                ) : (
                    <form
                        onSubmit={handleSaveEmail}
                        className="mt-2 space-y-2 rounded-lg border bg-muted/30 p-3 text-left"
                    >
                        <label
                            htmlFor="edit-email-input"
                            className="text-xs font-medium text-foreground block"
                        >
                            Ubah ke alamat email baru:
                        </label>
                        <div className="flex items-center gap-1.5">
                            <Input
                                ref={editInputRef}
                                id="edit-email-input"
                                type="email"
                                value={newEmail}
                                onChange={(e) => {
                                    setNewEmail(e.target.value);
                                    if (editError) setEditError('');
                                }}
                                disabled={saving}
                                required
                                className="h-9 text-xs"
                                placeholder="nama@perusahaan.com"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                disabled={saving}
                                loading={saving}
                                icon={Check}
                                className="h-9 shrink-0 px-3 text-xs"
                            >
                                Simpan
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={saving}
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditError('');
                                }}
                                className="h-9 shrink-0 px-2 text-xs"
                                title="Batal"
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                        <InputError message={editError} />
                    </form>
                )}
            </div>

            {!mailSent && !sent && (
                <div
                    role="alert"
                    className="flex items-start gap-3 rounded-control border border-amber-300 bg-amber-50 p-3.5 text-left text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                >
                    <AlertTriangle
                        className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
                        aria-hidden="true"
                    />
                    <div className="space-y-1">
                        <p className="font-semibold text-amber-950 dark:text-amber-100">
                            Pendaftaran Akun Berhasil
                        </p>
                        <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-300">
                            Akun Anda telah tersimpan di sistem. Namun, pengiriman email verifikasi tertunda karena server email sedang mengalami kendala. Silakan gunakan tombol <strong>Kirim ulang email</strong> di bawah beberapa saat lagi.
                        </p>
                    </div>
                </div>
            )}

            {sent && (
                <div
                    role="status"
                    className="rounded-control bg-success-subtle p-3 text-sm font-medium text-success-subtle-foreground"
                >
                    Tautan verifikasi baru telah dikirim ke {currentEmail}.
                </div>
            )}
            <InputError message={error} />

            <Button
                type="button"
                variant="secondary"
                className="w-full pointer-coarse:h-touch"
                icon={Send}
                loading={busy}
                disabled={busy || seconds > 0 || isEditing}
                onClick={resend}
            >
                {seconds > 0
                    ? `Kirim ulang email (${seconds} dtk)`
                    : 'Kirim ulang email'}
            </Button>

            <p className="text-sm text-muted-foreground">
                Sudah verifikasi? <TextLink href={login()}>Masuk</TextLink>
            </p>
        </div>
    );
}
