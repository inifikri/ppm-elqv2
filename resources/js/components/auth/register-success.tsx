import { MailCheck, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { xhr } from '@/lib/xhr';
import { login } from '@/routes';
import { send } from '@/routes/verification';

const COOLDOWN = 60;

export const maskEmail = (email: string) => {
    const [local, domain = ''] = email.split('@');

    return `${local.slice(0, 2)}***@${domain}`;
};

export function RegisterSuccess({ email }: { email: string }) {
    const [seconds, setSeconds] = useState(COOLDOWN);
    const [busy, setBusy] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const heading = useRef<HTMLHeadingElement>(null);

    useEffect(() => heading.current?.focus(), []);

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
                    <strong className="font-medium text-foreground">
                        {maskEmail(email)}
                    </strong>
                    . Buka email tersebut lalu klik tautannya untuk mengaktifkan
                    akun.
                </p>
            </div>

            {sent && (
                <div
                    role="status"
                    className="rounded-control bg-success-subtle p-3 text-sm font-medium text-success-subtle-foreground"
                >
                    Tautan verifikasi baru telah dikirim.
                </div>
            )}
            <InputError message={error} />

            <Button
                type="button"
                variant="secondary"
                className="w-full pointer-coarse:h-touch"
                icon={Send}
                loading={busy}
                disabled={busy || seconds > 0}
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
