import { Building2, Plus } from 'lucide-react';
import { Head, Link } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { ListToolbar } from '@/components/list-toolbar';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import Pagination from '@/components/pagination';
import { RowActions } from '@/components/row-actions';
import { Button } from '@/components/ui/button';
import { useLiveFilters } from '@/hooks/use-live-search';
import { cn } from '@/lib/utils';
import { create, destroy, edit, index } from '@/routes/admin/companies';
import type { Company, MasterFilters, Paginated } from '@/types';

export default function CompaniesIndex({
    companies,
    filters,
}: {
    companies: Paginated<Company>;
    filters: MasterFilters;
}) {
    const live = useLiveFilters(index().url, { search: filters.search }, [
        'companies',
        'filters',
    ]);

    return (
        <PageContainer>
            <Head title="Perusahaan" />
            <PageHeader
                title="Perusahaan"
                description="Daftar perusahaan peserta"
                actions={
                    <Button asChild icon={Plus}>
                        <Link href={create()}>Tambah</Link>
                    </Button>
                }
            />
            <ListToolbar
                label="Cari perusahaan"
                placeholder="Cari nama perusahaan"
                value={String(live.values.search ?? '')}
                onChange={(v) => live.set('search', v)}
            />
            <div
                className={cn(
                    'space-y-4 transition-opacity',
                    live.loading && 'opacity-60',
                )}
            >
                <DataTable
                    rows={companies.data}
                    empty={
                        <EmptyState
                            icon={Building2}
                            title="Belum ada perusahaan"
                            description="Perusahaan dibuat otomatis saat menambah peserta, atau tambahkan manual."
                        />
                    }
                    columns={[
                        {
                            header: 'Nama',
                            cell: (c) => (
                                <span className="font-medium">{c.name}</span>
                            ),
                        },
                        {
                            header: 'Peserta',
                            cell: (c) => c.participants_count,
                            className: 'tabular-nums',
                        },
                        {
                            header: 'Aksi',
                            actions: true,
                            className: 'text-right',
                            cell: (c) => (
                                <RowActions
                                    name={c.name}
                                    editHref={edit(c.id)}
                                    deleteUrl={destroy(c.id).url}
                                    deleteTitle="Hapus perusahaan?"
                                    deleteDescription={`${c.name} akan dihapus. Perusahaan yang masih dipakai peserta tidak bisa dihapus.`}
                                />
                            ),
                        },
                    ]}
                />
                <Pagination
                    paginator={companies}
                    pageUrl={(page) =>
                        index({
                            query: {
                                search: filters.search || undefined,
                                page,
                            },
                        }).url
                    }
                />
            </div>
        </PageContainer>
    );
}

CompaniesIndex.layout = {
    breadcrumbs: [{ title: 'Perusahaan', href: index() }],
};
