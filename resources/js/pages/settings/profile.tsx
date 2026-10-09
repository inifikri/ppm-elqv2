import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import { FormCard } from '@/components/form-card';
import { FormField } from '@/components/form-field';
import { FormFooter } from '@/components/form-footer';
import Heading from '@/components/heading';
import { fieldA11y } from '@/components/master-form';
import { UnsavedChangesGuard } from '@/components/unsaved-changes-guard';
import { Input } from '@/components/ui/input';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';
import { send } from '@/routes/verification';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and email address"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-4"
                >
                    {({ processing, errors, isDirty, reset }) => (
                        <>
                            <UnsavedChangesGuard dirty={isDirty} />
                            <FormCard title="Data Akun">
                                <FormField
                                    id="name"
                                    label="Name"
                                    error={errors.name}
                                    required
                                >
                                    <Input
                                        {...fieldA11y('name', errors.name)}
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />
                                </FormField>
                                <FormField
                                    id="email"
                                    label="Email address"
                                    error={errors.email}
                                    required
                                >
                                    <Input
                                        {...fieldA11y('email', errors.email)}
                                        type="email"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />
                                </FormField>
                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div className="sm:col-span-2">
                                            <p className="text-sm text-muted-foreground">
                                                Your email address is
                                                unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-border underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Click here to re-send the
                                                    verification email.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-success-subtle-foreground">
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </FormCard>
                            <FormFooter
                                processing={processing}
                                onReset={() => reset()}
                                canReset={isDirty}
                                submitTestId="update-profile-button"
                            />
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
