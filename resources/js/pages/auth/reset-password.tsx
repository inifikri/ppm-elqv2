import { Form, Head } from '@inertiajs/react';
import { KeyRound, Lock, Mail } from 'lucide-react';
import { FormField } from '@/components/form-field';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    return (
        <>
            <Head title="Reset password" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                className="grid gap-5"
            >
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
                                value={email}
                                readOnly
                                aria-describedby="email-error"
                            />
                        </FormField>

                        <FormField
                            id="password"
                            label="Password baru"
                            error={errors.password}
                        >
                            <PasswordInput
                                id="password"
                                name="password"
                                icon={Lock}
                                autoComplete="new-password"
                                autoFocus
                                passwordrules={passwordRules}
                                aria-invalid={!!errors.password}
                                aria-describedby="password-error"
                            />
                        </FormField>

                        <FormField
                            id="password_confirmation"
                            label="Konfirmasi password"
                            error={errors.password_confirmation}
                        >
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                icon={Lock}
                                autoComplete="new-password"
                                passwordrules={passwordRules}
                                aria-invalid={!!errors.password_confirmation}
                                aria-describedby="password_confirmation-error"
                            />
                        </FormField>

                        <Button
                            type="submit"
                            className="w-full pointer-coarse:h-touch"
                            loading={processing}
                            icon={KeyRound}
                            data-test="reset-password-button"
                        >
                            {processing ? 'Memproses...' : 'Reset password'}
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Reset password',
    description: 'Masukkan password baru Anda',
};
