import { Layers, Plus } from 'lucide-react';
import { Head, Link } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { ListToolbar } from '@/components/list-toolbar';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import Pagination from '@/components/pagination';
import { RowActions } from '@/components/row-actions';
import { StatusBadge, activeStatus } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { useLiveFilters } from '@/hooks/use-live-search';
import { cn } from '@/lib/utils';
import { create, destroy, edit, index, show } from '@/routes/admin/domains';
import type { Domain, MasterFilters, Paginated } from '@/types';

export default function DomainsIndex({
    domains,
    filters,
}: {
    domains: Paginated<Domain>;
    filters: MasterFilters;
}) {
    const live = useLiveFilters(index().url, { search: filters.search }, [
        'domains',
        'filters',
    ]);

    return (
        <PageContainer>
            <Head title="Dimensi" />
            <PageHeader
                title="Dimensi"
                description="Dimensi utama kuesioner"
                actions={
                    <Button asChild icon={Plus}>
                        <Link href={create()}>Tambah</Link>
                    </Button>
                }
            />
            <ListToolbar
                label="Cari dimensi"
                placeholder="Cari nama dimensi"
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
                    rows={domains.data}
                    empty={
                        <EmptyState
                            icon={Layers}
                            title="Belum ada dimensi"
                            description="Tambahkan dimensi pertama untuk menyusun kuesioner."
                        />
                    }
                    columns={[
                        {
                            header: 'Urutan',
                            cell: (d) => d.sort_order,
                            className: 'w-20 tabular-nums',
                        },
                        {
                            header: 'Nama',
                            cell: (d) => (
                                <Link
                                    href={show(d.id)}
                                    className="font-medium hover:underline"
                                >
                                    {d.name}
                                </Link>
                            ),
                        },
                        {
                            header: 'Sub Dimensi',
                            cell: (d) => d.sub_domains_count,
                            className: 'tabular-nums',
                        },
                        {
                            header: 'Status',
                            cell: (d) => (
                                <StatusBadge
                                    status={activeStatus(d.is_active)}
                                />
                            ),
                        },
                        {
                            header: 'Aksi',
                            actions: true,
                            className: 'text-right',
                            cell: (d) => (
                                <RowActions
                                    name={d.name}
                                    editHref={edit(d.id)}
                                    deleteUrl={destroy(d.id).url}
                                    deleteTitle="Hapus dimensi?"
                                    deleteDescription={`${d.name} akan dihapus. Dimensi yang masih punya sub dimensi tidak bisa dihapus; nonaktifkan saja.`}
                                />
                            ),
                        },
                    ]}
                />
                <Pagination
                    paginator={domains}
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

DomainsIndex.layout = {
    breadcrumbs: [{ title: 'Dimensi', href: index() }],
};
