import { Plus, Trash2, Users } from 'lucide-react';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Pagination from '@/components/pagination';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchInput } from '@/components/search-input';
import { cn } from '@/lib/utils';
import { create, index } from '@/routes/admin/users';
import type { ManagedUser, Paginated, UserFilters } from '@/types';
import UsersTable from './components/users-table';

export default function UsersIndex({
    users,
    filters,
    trash_count = 0,
}: {
    users: Paginated<ManagedUser>;
    filters: UserFilters;
    trash_count: number;
}) {
    const [query, setQuery] = useState(filters.search ?? '');
    const [role, setRole] = useState(filters.role ?? 'all');
    const [status, setStatus] = useState(filters.status ?? 'all');
    const [tab, setTab] = useState(filters.tab ?? 'all');
    const [loading, setLoading] = useState(false);

    const applyFilters = (newFilters: {
        search?: string;
        role?: string;
        status?: string;
        tab?: string;
    }) => {
        router.get(
            index().url,
            {
                search: (newFilters.search ?? query) || undefined,
                role: (newFilters.role ?? role) === 'all' ? undefined : (newFilters.role ?? role),
                status: (newFilters.status ?? status) === 'all' ? undefined : (newFilters.status ?? status),
                tab: (newFilters.tab ?? tab) === 'all' ? undefined : (newFilters.tab ?? tab),
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['users', 'filters', 'trash_count'],
            },
        );
    };

    useEffect(() => {
        if (query === (filters.search ?? '')) {
            return;
        }

        const timer = setTimeout(() => {
            applyFilters({ search: query });
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const offStart = router.on('start', () => setLoading(true));
        const offFinish = router.on('finish', () => setLoading(false));

        return () => {
            offStart();
            offFinish();
        };
    }, []);

    const pageUrl = (page: number) =>
        index({
            query: {
                search: filters.search || undefined,
                role: filters.role || undefined,
                status: filters.status || undefined,
                tab: filters.tab || undefined,
                page,
            },
        }).url;

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

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Tabs
                    value={tab}
                    onValueChange={(val) => {
                        setTab(val);
                        applyFilters({ tab: val });
                    }}
                >
                    <TabsList>
                        <TabsTrigger value="all" className="gap-2">
                            <Users className="size-4" /> Semua Pengguna
                        </TabsTrigger>
                        <TabsTrigger value="trash" className="gap-2">
                            <Trash2 className="size-4" /> Data Sampah
                            {trash_count > 0 && (
                                <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                                    {trash_count}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <SearchInput
                    label="Cari pengguna"
                    placeholder="Cari nama, email, telepon..."
                    value={query}
                    onValueChange={setQuery}
                    className="w-full"
                />
                <Select
                    value={role}
                    onValueChange={(val) => {
                        setRole(val);
                        applyFilters({ role: val });
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Semua Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Role</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="participant">Peserta</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={status}
                    onValueChange={(val) => {
                        setStatus(val);
                        applyFilters({ status: val });
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Nonaktif</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div
                className={cn(
                    'space-y-4 pb-20 transition-opacity',
                    loading && 'opacity-60',
                )}
            >
                <UsersTable
                    key={`${users.current_page}-${filters.search}-${filters.role}-${filters.status}-${filters.tab}`}
                    users={users.data}
                    tab={filters.tab ?? 'all'}
                />
                <Pagination paginator={users} pageUrl={pageUrl} />
            </div>
        </PageContainer>
    );
}

UsersIndex.layout = {
    breadcrumbs: [{ title: 'Pengguna', href: index() }],
};
