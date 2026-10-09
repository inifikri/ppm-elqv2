import { Form, Head } from '@inertiajs/react';
import { Mail, Send } from 'lucide-react';
import { FormField } from '@/components/form-field';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({
    status,
    prefill,
}: {
    status?: string;
    prefill?: string;
}) {
    return (
        <>
            <Head title="Lupa password" />

            {status && (
                <div
                    role="status"
                    className="mb-4 rounded-control bg-success-subtle p-3 text-center text-sm font-medium text-success"
                >
                    {status}
                </div>
            )}

            <Form {...email.form()} className="grid gap-5">
                {({ processing, errors }) => (
                    <>
                        <FormField
                            id="email"
                            label="Email"
                            error={errors.email}
                        >
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                icon={Mail}
                                autoComplete="email"
                                defaultValue={prefill}
                                autoFocus
                                placeholder="email@example.com"
                                aria-invalid={!!errors.email}
                                aria-describedby="email-error"
                            />
                        </FormField>

                        <Button
                            className="w-full pointer-coarse:h-touch"
                            loading={processing}
                            icon={Send}
                            data-test="email-password-reset-link-button"
                        >
                            {processing ? 'Memproses...' : 'Kirim tautan reset'}
                        </Button>
                    </>
                )}
            </Form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
                Kembali ke <TextLink href={login()}>halaman masuk</TextLink>
            </p>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Lupa password',
    description: 'Masukkan email Anda untuk menerima tautan reset password',
};
