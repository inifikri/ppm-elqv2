import { Network, Plus } from 'lucide-react';
import { Head, Link } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { ListToolbar } from '@/components/list-toolbar';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import Pagination from '@/components/pagination';
import { RowActions } from '@/components/row-actions';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLiveFilters } from '@/hooks/use-live-search';
import { cn } from '@/lib/utils';
import { create, destroy, edit, index } from '@/routes/admin/sub-domains';
import type {
    DomainOption,
    MasterFilters,
    Paginated,
    SubDomain,
} from '@/types';

const ALL = 'all';

export default function SubDomainsIndex({
    subDomains,
    filters,
    domains,
}: {
    subDomains: Paginated<SubDomain>;
    filters: MasterFilters;
    domains: DomainOption[];
}) {
    const live = useLiveFilters(
        index().url,
        { search: filters.search, dimension_id: filters.dimension_id },
        ['subDomains', 'filters'],
    );

    return (
        <PageContainer>
            <Head title="Sub Dimensi" />
            <PageHeader
                title="Sub Dimensi"
                description="Kelompok pertanyaan di dalam dimensi"
                actions={
                    <Button asChild icon={Plus}>
                        <Link href={create()}>Tambah</Link>
                    </Button>
                }
            />
            <ListToolbar
                label="Cari sub dimensi"
                placeholder="Cari nama sub dimensi"
                value={String(live.values.search ?? '')}
                onChange={(v) => live.set('search', v)}
            >
                <Select
                    value={
                        live.values.dimension_id
                            ? String(live.values.dimension_id)
                            : ALL
                    }
                    onValueChange={(v) =>
                        live.set('dimension_id', v === ALL ? null : Number(v))
                    }
                >
                    <SelectTrigger
                        aria-label="Filter dimensi"
                        className="w-full bg-card sm:w-56"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Semua dimensi</SelectItem>
                        {domains.map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                                {d.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </ListToolbar>
            <div
                className={cn(
                    'space-y-4 transition-opacity',
                    live.loading && 'opacity-60',
                )}
            >
                <DataTable
                    rows={subDomains.data}
                    empty={
                        <EmptyState
                            icon={Network}
                            title="Belum ada sub dimensi"
                            description="Ubah filter atau tambahkan sub dimensi baru."
                        />
                    }
                    columns={[
                        {
                            header: 'Nama',
                            cell: (s) => (
                                <span className="font-medium">{s.name}</span>
                            ),
                        },
                        {
                            header: 'Dimensi',
                            cell: (s) => s.domain,
                        },
                        {
                            header: 'Pertanyaan',
                            cell: (s) => s.questions_count,
                            className: 'tabular-nums',
                        },
                        {
                            header: 'Urutan',
                            cell: (s) => s.sort_order,
                            className: 'tabular-nums',
                        },
                        {
                            header: 'Aksi',
                            actions: true,
                            className: 'text-right',
                            cell: (s) => (
                                <RowActions
                                    name={s.name}
                                    editHref={edit(s.id)}
                                    deleteUrl={destroy(s.id).url}
                                    deleteTitle="Hapus sub dimensi?"
                                    deleteDescription={`${s.name} akan dihapus. Sub Dimensi yang masih punya pertanyaan tidak bisa dihapus.`}
                                />
                            ),
                        },
                    ]}
                />
                <Pagination
                    paginator={subDomains}
                    pageUrl={(page) =>
                        index({
                            query: {
                                search: filters.search || undefined,
                                dimension_id: filters.dimension_id ?? undefined,
                                page,
                            },
                        }).url
                    }
                />
            </div>
        </PageContainer>
    );
}

SubDomainsIndex.layout = {
    breadcrumbs: [{ title: 'Sub Dimensi', href: index() }],
};
