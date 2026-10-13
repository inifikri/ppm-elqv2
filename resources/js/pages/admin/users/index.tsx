import { Plus } from 'lucide-react';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Pagination from '@/components/pagination';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/search-input';
import { cn } from '@/lib/utils';
import { create, index } from '@/routes/admin/users';
import type { ManagedUser, Paginated, UserFilters } from '@/types';
import UsersTable from './components/users-table';

export default function UsersIndex({
    users,
    filters,
}: {
    users: Paginated<ManagedUser>;
    filters: UserFilters;
}) {
    const [query, setQuery] = useState(filters.search);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query === filters.search) {
            return;
        }

        const timer = setTimeout(
            () =>
                router.get(
                    index().url,
                    { search: query || undefined },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                        only: ['users', 'filters'],
                    },
                ),
            300,
        );

        return () => clearTimeout(timer);
    }, [query, filters.search]);

    useEffect(() => {
        const offStart = router.on('start', () => setLoading(true));
        const offFinish = router.on('finish', () => setLoading(false));

        return () => {
            offStart();
            offFinish();
        };
    }, []);

    const pageUrl = (page: number) =>
        index({ query: { search: filters.search || undefined, page } }).url;

    return (
        <PageContainer>
            <Head title="Pengguna" />
            <PageHeader
                title="Pengguna"
                description="Kelola akun dan hak akses"
                actions={
                    <Button asChild icon={Plus}>
                        <Link href={create()}>Tambah</Link>
                    </Button>
                }
            />
            <SearchInput
                label="Cari pengguna"
                placeholder="Cari nama, email, telepon, perusahaan, jabatan"
                value={query}
                onValueChange={setQuery}
                className="max-w-md"
            />
            <div
                className={cn(
                    'space-y-4 pb-20 transition-opacity',
                    loading && 'opacity-60',
                )}
            >
                <UsersTable
                    key={`${users.current_page}-${filters.search}`}
                    users={users.data}
                />
                <Pagination paginator={users} pageUrl={pageUrl} />
            </div>
        </PageContainer>
    );
}

UsersIndex.layout = {
    breadcrumbs: [{ title: 'Pengguna', href: index() }],
};
