import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import { FormCard } from '@/components/form-card';
import { FormField } from '@/components/form-field';
import { FormFooter } from '@/components/form-footer';
import Heading from '@/components/heading';
import { fieldA11y } from '@/components/master-form';
import { UnsavedChangesGuard } from '@/components/unsaved-changes-guard';
import PasswordInput from '@/components/password-input';
import { edit } from '@/routes/security';

// oxfmt-ignore
type Props = {
    passwordRules: string;
} ;

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title="Security settings" />

            <h1 className="sr-only">Security settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Update password"
                    description="Ensure your account is using a long, random password to stay secure"
                />

                <Form
                    {...SecurityController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    resetOnError={[
                        'password',
                        'password_confirmation',
                        'current_password',
                    ]}
                    resetOnSuccess
                    onError={(errors) => {
                        if (errors.password) {
                            passwordInput.current?.focus();
                        }

                        if (errors.current_password) {
                            currentPasswordInput.current?.focus();
                        }
                    }}
                    className="space-y-4"
                >
                    {({ errors, processing, isDirty, reset }) => (
                        <>
                            <UnsavedChangesGuard dirty={isDirty} />
                            <FormCard title="Password">
                                <FormField
                                    id="current_password"
                                    label="Current password"
                                    error={errors.current_password}
                                    className="sm:col-span-2"
                                >
                                    <PasswordInput
                                        {...fieldA11y(
                                            'current_password',
                                            errors.current_password,
                                        )}
                                        ref={currentPasswordInput}
                                        name="current_password"
                                        autoComplete="current-password"
                                        placeholder="Current password"
                                    />
                                </FormField>
                                <FormField
                                    id="password"
                                    label="New password"
                                    error={errors.password}
                                >
                                    <PasswordInput
                                        {...fieldA11y(
                                            'password',
                                            errors.password,
                                        )}
                                        ref={passwordInput}
                                        name="password"
                                        autoComplete="new-password"
                                        placeholder="New password"
                                        passwordrules={props.passwordRules}
                                    />
                                </FormField>
                                <FormField
                                    id="password_confirmation"
                                    label="Confirm password"
                                    error={errors.password_confirmation}
                                >
                                    <PasswordInput
                                        {...fieldA11y(
                                            'password_confirmation',
                                            errors.password_confirmation,
                                        )}
                                        name="password_confirmation"
                                        autoComplete="new-password"
                                        placeholder="Confirm password"
                                        passwordrules={props.passwordRules}
                                    />
                                </FormField>
                            </FormCard>
                            <FormFooter
                                processing={processing}
                                onReset={() => reset()}
                                canReset={isDirty}
                                submitTestId="update-password-button"
                            />
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Security settings',
            href: edit(),
        },
    ],
};
