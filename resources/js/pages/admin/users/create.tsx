import { Head } from '@inertiajs/react';
import { BackButton } from '@/components/back-button';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { create, index, store } from '@/routes/admin/users';
import type { PermissionGroup } from '@/types';
import UserForm from './components/user-form';

export default function CreateUser({
    permissionGroups,
    companies,
    defaultPermissions,
}: {
    permissionGroups: PermissionGroup[];
    companies: string[];
    defaultPermissions: string[];
}) {
    return (
        <PageContainer narrow>
            <Head title="Tambah pengguna" />
            <BackButton href={index()} />
            <PageHeader title="Tambah pengguna" />
            <UserForm
                form={store.form()}
                permissionGroups={permissionGroups}
                companies={companies}
                permissions={defaultPermissions}
            />
        </PageContainer>
    );
}

CreateUser.layout = {
    breadcrumbs: [
        { title: 'Pengguna', href: index() },
        { title: 'Tambah', href: create() },
    ],
};
