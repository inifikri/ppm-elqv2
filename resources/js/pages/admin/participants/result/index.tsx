import { FileBarChart2, CheckCircle2, Clock, Eye } from 'lucide-react';
import { Head, Link } from '@inertiajs/react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { ListToolbar } from '@/components/list-toolbar';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLiveFilters } from '@/hooks/use-live-search';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';
import type { ParticipantResultSummary } from '@/types/assessment';

export default function AssessmentResultsIndex({
    participants,
    filters,
}: {
    participants: Paginated<ParticipantResultSummary>;
    filters: { search: string };
}) {
    const live = useLiveFilters('/admin/results', { search: filters.search }, [
        'participants',
        'filters',
    ]);

    return (
        <PageContainer>
            <Head title="Hasil Asesmen" />
            <PageHeader
                title="Hasil Asesmen"
                description="Daftar dan evaluasi hasil penilaian 360° per peserta"
            />
            <ListToolbar
                label="Cari peserta"
                placeholder="Cari nama, email, perusahaan..."
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
                    rows={participants.data}
                    empty={
                        <EmptyState
                            icon={FileBarChart2}
                            title="Belum ada data hasil asesmen"
                            description="Peserta yang terdaftar akan muncul di sini beserta ringkasan status penilai."
                        />
                    }
                    columns={[
                        {
                            header: 'Peserta',
                            cell: (p) => (
                                <div>
                                    <div className="font-medium text-foreground">{p.name}</div>
                                    <div className="text-xs text-muted-foreground">{p.email}</div>
                                </div>
                            ),
                        },
                        {
                            header: 'Perusahaan / Jabatan',
                            cell: (p) => (
                                <div>
                                    <div className="text-sm font-medium">{p.company || '-'}</div>
                                    <div className="text-xs text-muted-foreground">{p.position || '-'}</div>
                                </div>
                            ),
                        },
                        {
                            header: 'Penilai',
                            cell: (p) => (
                                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                    <Badge
                                        variant={p.raters_status.self ? 'default' : 'outline'}
                                        className={cn(
                                            'text-[10px] px-1.5 py-0.5',
                                            p.raters_status.self
                                                ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {p.raters_status.self ? (
                                            <CheckCircle2 className="size-3 mr-1 inline" />
                                        ) : (
                                            <Clock className="size-3 mr-1 inline" />
                                        )}
                                        Self
                                    </Badge>
                                    <Badge
                                        variant={p.raters_status.boss ? 'default' : 'outline'}
                                        className={cn(
                                            'text-[10px] px-1.5 py-0.5',
                                            p.raters_status.boss
                                                ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {p.raters_status.boss ? (
                                            <CheckCircle2 className="size-3 mr-1 inline" />
                                        ) : (
                                            <Clock className="size-3 mr-1 inline" />
                                        )}
                                        Atasan
                                    </Badge>
                                    <Badge
                                        variant={
                                            p.raters_status.subordinate.submitted ===
                                                p.raters_status.subordinate.total &&
                                            p.raters_status.subordinate.total > 0
                                                ? 'default'
                                                : 'outline'
                                        }
                                        className={cn(
                                            'text-[10px] px-1.5 py-0.5',
                                            p.raters_status.subordinate.submitted ===
                                                p.raters_status.subordinate.total &&
                                                p.raters_status.subordinate.total > 0
                                                ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        Bawahan ({p.raters_status.subordinate.submitted}/
                                        {p.raters_status.subordinate.total})
                                    </Badge>
                                </div>
                            ),
                        },
                        {
                            header: 'Status',
                            cell: (p) => {
                                if (p.is_completed) {
                                    return (
                                        <Badge className="bg-emerald-600/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-600/30">
                                            Lengkap
                                        </Badge>
                                    );
                                }
                                if (p.has_data) {
                                    return (
                                        <Badge className="bg-amber-600/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-600/30">
                                            Sedang Berjalan
                                        </Badge>
                                    );
                                }
                                return (
                                    <Badge variant="outline" className="text-muted-foreground">
                                        Belum Ada Data
                                    </Badge>
                                );
                            },
                        },
                        {
                            header: 'Aksi',
                            actions: true,
                            className: 'text-right',
                            cell: (p) => (
                                <Button asChild size="sm" variant="outline" icon={Eye}>
                                    <Link href={`/admin/participants/${p.id}/result`}>
                                        Lihat Hasil
                                    </Link>
                                </Button>
                            ),
                        },
                    ]}
                />
                <Pagination
                    paginator={participants}
                    pageUrl={(page) => {
                        const params = new URLSearchParams();
                        if (filters.search) params.set('search', filters.search);
                        params.set('page', String(page));
                        return `/admin/results?${params.toString()}`;
                    }}
                />
            </div>
        </PageContainer>
    );
}

AssessmentResultsIndex.layout = {
    breadcrumbs: [{ title: 'Hasil Asesmen', href: '/admin/results' }],
};
