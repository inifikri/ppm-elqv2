import { Form, Head } from '@inertiajs/react';
import { Lock, ShieldCheck } from 'lucide-react';
import { FormField } from '@/components/form-field';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Konfirmasi password" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="grid gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <FormField
                            id="password"
                            label="Password"
                            error={errors.password}
                        >
                            <PasswordInput
                                id="password"
                                name="password"
                                icon={Lock}
                                autoComplete="current-password"
                                autoFocus
                                aria-invalid={!!errors.password}
                                aria-describedby="password-error"
                            />
                        </FormField>

                        <Button
                            className="w-full pointer-coarse:h-touch"
                            loading={processing}
                            icon={ShieldCheck}
                            data-test="confirm-password-button"
                        >
                            {processing ? 'Memproses...' : 'Konfirmasi'}
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

ConfirmPassword.layout = {
    title: 'Konfirmasi password',
    description: 'Area ini aman. Konfirmasi password Anda sebelum melanjutkan.',
};
