import { Form, Head } from '@inertiajs/react';
import { Send } from 'lucide-react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="Verifikasi email" />

            {status === 'verification-link-sent' && (
                <div
                    role="status"
                    className="mb-4 rounded-control bg-success-subtle p-3 text-center text-sm font-medium text-success"
                >
                    Tautan verifikasi baru telah dikirim ke email yang Anda
                    daftarkan.
                </div>
            )}

            <Form {...send.form()} className="grid gap-4 text-center">
                {({ processing }) => (
                    <>
                        <Button
                            variant="secondary"
                            className="w-full pointer-coarse:h-touch"
                            loading={processing}
                            icon={Send}
                        >
                            {processing
                                ? 'Memproses...'
                                : 'Kirim ulang email verifikasi'}
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm"
                        >
                            Keluar
                        </TextLink>
                    </>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verifikasi email',
    description:
        'Klik tautan verifikasi yang kami kirim ke email Anda untuk melanjutkan.',
};
