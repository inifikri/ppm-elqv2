import { Form } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { FormCard } from '@/components/form-card';
import { FormField } from '@/components/form-field';
import { FormFooter } from '@/components/form-footer';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { UnsavedChangesGuard } from '@/components/unsaved-changes-guard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { fieldA11y as a11y } from '@/components/master-form';
import { index } from '@/routes/admin/users';
import type { EditableUser, PermissionGroup } from '@/types';
import PhotoInput from './photo-input';
import PermissionCheckboxes from './permission-checkboxes';

type Props = {
    form: Pick<ComponentProps<typeof Form>, 'action' | 'method'>;
    user?: EditableUser;
    permissionGroups: PermissionGroup[];
    companies: string[];
    permissions: string[];
};

export default function UserForm({
    form,
    user,
    permissionGroups,
    companies,
    permissions,
}: Props) {
    const isEdit = user !== undefined;
    const [createRole, setCreateRole] = useState<'admin' | 'participant'>(
        'participant',
    );
    const role = isEdit ? (user.role ?? 'participant') : createRole;
    const isParticipant = role === 'participant';

    return (
        <Form {...form} className="space-y-4" encType="multipart/form-data">
            {({ processing, errors, isDirty, reset }) => (
                <>
                    <UnsavedChangesGuard dirty={isDirty} />
                    <FormCard
                        title="Profil Pengguna"
                        description="Identitas dan kredensial masuk."
                    >
                        <FormField
                            id="photo"
                            label="Foto profil"
                            description="JPG atau PNG, maksimal 2 MB."
                            error={errors.photo}
                            className="sm:col-span-2"
                        >
                            <PhotoInput
                                {...a11y('photo', errors.photo)}
                                name="photo"
                                currentUrl={user?.avatar}
                                fallback={user?.name}
                            />
                        </FormField>
                        <FormField
                            id="name"
                            label="Nama"
                            error={errors.name}
                            required
                        >
                            <Input
                                {...a11y('name', errors.name)}
                                name="name"
                                required
                                defaultValue={user?.name}
                            />
                        </FormField>
                        <FormField
                            id="email"
                            label="Email"
                            error={errors.email}
                            required
                        >
                            <Input
                                {...a11y('email', errors.email)}
                                type="email"
                                name="email"
                                required
                                defaultValue={user?.email}
                            />
                        </FormField>
                        <FormField
                            id="phone"
                            label="Telepon"
                            error={errors.phone}
                        >
                            <Input
                                {...a11y('phone', errors.phone)}
                                name="phone"
                                defaultValue={user?.phone ?? ''}
                            />
                        </FormField>
                        {isParticipant && (
                            <>
                                <FormField
                                    id="company_name"
                                    label="Perusahaan"
                                    error={errors.company_name}
                                    required
                                >
                                    <Input
                                        {...a11y(
                                            'company_name',
                                            errors.company_name,
                                        )}
                                        name="company_name"
                                        list="companies"
                                        required
                                        defaultValue={user?.company_name ?? ''}
                                    />
                                    <datalist id="companies">
                                        {companies.map((c) => (
                                            <option key={c} value={c} />
                                        ))}
                                    </datalist>
                                </FormField>
                                <FormField
                                    id="position"
                                    label="Jabatan"
                                    error={errors.position}
                                    required
                                >
                                    <Input
                                        {...a11y('position', errors.position)}
                                        name="position"
                                        required
                                        defaultValue={user?.position ?? ''}
                                    />
                                </FormField>
                            </>
                        )}
                        <FormField
                            id="password"
                            label="Password"
                            error={errors.password}
                            required={!isEdit}
                            description={
                                isEdit
                                    ? 'Kosongkan bila tidak diubah'
                                    : undefined
                            }
                        >
                            <PasswordInput
                                {...a11y('password', errors.password)}
                                name="password"
                                required={!isEdit}
                                autoComplete="new-password"
                            />
                        </FormField>
                        <FormField
                            id="password_confirmation"
                            label="Konfirmasi password"
                            required={!isEdit}
                        >
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                required={!isEdit}
                                autoComplete="new-password"
                            />
                        </FormField>
                    </FormCard>

                    <FormCard
                        title="Hak Akses"
                        description="Role dan status akun."
                    >
                        <div className="grid content-start gap-2">
                            <Label id="role-label">Role</Label>
                            {isEdit ? (
                                <p className="text-sm">
                                    {role === 'admin'
                                        ? 'Administrator'
                                        : 'Peserta'}
                                </p>
                            ) : (
                                <div
                                    className="flex gap-4 pointer-coarse:min-h-touch pointer-coarse:items-center"
                                    role="radiogroup"
                                    aria-labelledby="role-label"
                                >
                                    {(['participant', 'admin'] as const).map(
                                        (r) => (
                                            <label
                                                key={r}
                                                className="flex items-center gap-2 text-sm"
                                            >
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value={r}
                                                    checked={createRole === r}
                                                    onChange={() =>
                                                        setCreateRole(r)
                                                    }
                                                />
                                                {r === 'admin'
                                                    ? 'Administrator'
                                                    : 'Peserta'}
                                            </label>
                                        ),
                                    )}
                                </div>
                            )}
                            <InputError message={errors.role} />
                        </div>
                        <div className="grid content-start gap-2">
                            <Label htmlFor="is_active">Status akun</Label>
                            <div className="flex items-center gap-3">
                                {!user?.is_self && (
                                    <input
                                        type="hidden"
                                        name="is_active"
                                        value="0"
                                    />
                                )}
                                <Switch
                                    id="is_active"
                                    name="is_active"
                                    value="1"
                                    defaultChecked={user?.is_active ?? true}
                                    disabled={user?.is_self}
                                />
                                <span className="text-sm">Akun aktif</span>
                            </div>
                            <InputError message={errors.is_active} />
                        </div>
                        <div className="sm:col-span-2">
                            <PermissionCheckboxes
                                key={role}
                                groups={permissionGroups}
                                role={role}
                                checked={permissions}
                            />
                            <InputError message={errors['permissions.0']} />
                        </div>
                    </FormCard>

                    <FormFooter
                        processing={processing}
                        cancelHref={index()}
                        onReset={isEdit ? () => reset() : undefined}
                        canReset={isDirty}
                    />
                </>
            )}
        </Form>
    );
}
