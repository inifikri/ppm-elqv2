import { CircleQuestionMark, Plus, Trash2 } from 'lucide-react';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { BulkActionBar } from '@/components/bulk-action-bar';
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
import { bulk, create, destroy, edit, index } from '@/routes/admin/questions';
import type {
    DomainOption,
    MasterFilters,
    Paginated,
    QuestionRow,
} from '@/types';

const ALL = 'all';

export default function QuestionsIndex({
    questions,
    filters,
    domains,
}: {
    questions: Paginated<QuestionRow>;
    filters: MasterFilters;
    domains: DomainOption[];
}) {
    const live = useLiveFilters(
        index().url,
        { search: filters.search, dimension_id: filters.dimension_id },
        ['questions', 'filters'],
    );

    // Selection lives only for the current page + filters; any change resets it.
    const scope = `${questions.current_page}|${filters.search}|${filters.dimension_id ?? ''}`;
    const [picked, setPicked] = useState<{ scope: string; ids: Set<number> }>({
        scope,
        ids: new Set(),
    });
    const selected = picked.scope === scope ? picked.ids : new Set<number>();
    const clear = () => setPicked({ scope, ids: new Set() });

    return (
        <PageContainer className={cn(selected.size > 0 && 'pb-24')}>
            <Head title="Pertanyaan" />
            <PageHeader
                title="Pertanyaan"
                description="Butir pertanyaan kuesioner"
                actions={
                    <Button asChild icon={Plus}>
                        <Link href={create()}>Tambah</Link>
                    </Button>
                }
            />
            <ListToolbar
                label="Cari pertanyaan"
                placeholder="Cari teks pertanyaan"
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
                        className="w-full sm:w-56"
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
                    rows={questions.data}
                    selection={{
                        selected,
                        onChange: (ids) => setPicked({ scope, ids }),
                        rowLabel: (id) => `Pilih pertanyaan ${id}`,
                    }}
                    empty={
                        <EmptyState
                            icon={CircleQuestionMark}
                            title="Belum ada pertanyaan"
                            description="Ubah filter atau tambahkan pertanyaan baru."
                        />
                    }
                    columns={[
                        {
                            header: 'Pertanyaan',
                            cell: (q) => (
                                <span className="line-clamp-2">
                                    {q.text_plain}
                                </span>
                            ),
                            className: 'max-w-md whitespace-normal',
                        },
                        {
                            header: 'Dimensi / Sub Dimensi',
                            cell: (q) =>
                                `${q.domain ?? '-'} / ${q.sub_domain ?? '-'}`,
                        },
                        {
                            header: 'Urutan',
                            cell: (q) => q.sort_order,
                            className: 'tabular-nums',
                        },
                        {
                            header: 'Aksi',
                            actions: true,
                            className: 'text-right',
                            cell: (q) => (
                                <RowActions
                                    name={`pertanyaan ${q.id}`}
                                    editHref={edit(q.id)}
                                    deleteUrl={destroy(q.id).url}
                                    deleteTitle="Hapus pertanyaan?"
                                    deleteDescription="Pertanyaan disembunyikan dari kuesioner; jawaban yang sudah masuk tetap tersimpan."
                                />
                            ),
                        },
                    ]}
                />
                <Pagination
                    paginator={questions}
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
            <BulkActionBar
                selectedCount={selected.size}
                onClear={clear}
                actions={[
                    {
                        label: 'Hapus',
                        icon: Trash2,
                        destructive: true,
                        onClick: () =>
                            router.post(
                                bulk().url,
                                { ids: [...selected] },
                                { preserveScroll: true, onSuccess: clear },
                            ),
                        confirm: {
                            title: 'Hapus pertanyaan?',
                            description: `${selected.size} pertanyaan terpilih disembunyikan dari kuesioner; jawaban yang sudah masuk tetap tersimpan.`,
                        },
                    },
                ]}
            />
        </PageContainer>
    );
}

QuestionsIndex.layout = {
    breadcrumbs: [{ title: 'Pertanyaan', href: index() }],
};
