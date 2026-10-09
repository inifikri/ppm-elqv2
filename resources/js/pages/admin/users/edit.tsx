import { Head } from '@inertiajs/react';
import { BackButton } from '@/components/back-button';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { index, update } from '@/routes/admin/users';
import type { EditableUser, PermissionGroup } from '@/types';
import UserForm from './components/user-form';

export default function EditUser({
    user,
    permissionGroups,
    companies,
    permissions,
}: {
    user: EditableUser;
    permissionGroups: PermissionGroup[];
    companies: string[];
    permissions: string[];
}) {
    return (
        <PageContainer narrow>
            <Head title="Ubah pengguna" />
            <BackButton href={index()} />
            <PageHeader title="Ubah pengguna" />
            <UserForm
                form={update.form(user.id)}
                user={user}
                permissionGroups={permissionGroups}
                companies={companies}
                permissions={permissions}
            />
        </PageContainer>
    );
}

EditUser.layout = {
    breadcrumbs: [{ title: 'Pengguna', href: index() }],
};
