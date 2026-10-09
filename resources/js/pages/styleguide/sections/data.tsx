import { Users } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { DataTable } from '@/components/data-table';
import Pagination from '@/components/pagination';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Section } from './section';

type Row = { id: number; name: string; role: string; active: boolean };

const rows: Row[] = [
    { id: 1, name: 'Contoh Satu', role: 'Peserta', active: true },
    { id: 2, name: 'Contoh Dua', role: 'Admin', active: false },
];

const paginator = {
    data: rows,
    current_page: 2,
    last_page: 5,
    from: 11,
    to: 20,
    total: 48,
    prev_page_url: '#',
    next_page_url: '#',
};

export default function Data() {
    return (
        <Section
            id="sg-data"
            title="PageHeader, Breadcrumb, StatCard, DataTable, Pagination"
        >
            <Breadcrumbs
                breadcrumbs={[
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Styleguide', href: '/styleguide' },
                ]}
            />
            <PageHeader
                title="Judul halaman"
                description="Deskripsi singkat."
                actions={<Button>Aksi</Button>}
            />
            <div className="grid gap-4 sm:grid-cols-2">
                <StatCard
                    label="Peserta"
                    value={48}
                    hint="+3 minggu ini"
                    icon={Users}
                />
                <StatCard label="Selesai" value="62%" />
            </div>
            <p className="text-sm text-text-muted">
                Tabel: kartu di bawah 768px.
            </p>
            <DataTable<Row>
                rows={rows}
                empty={null}
                columns={[
                    { header: 'Nama', cell: (r) => r.name },
                    { header: 'Peran', cell: (r) => r.role },
                    {
                        header: 'Status',
                        cell: (r) => (
                            <StatusBadge
                                status={r.active ? 'active' : 'inactive'}
                            />
                        ),
                    },
                    {
                        header: 'Aksi',
                        actions: true,
                        cell: () => (
                            <Button size="sm" variant="outline">
                                Ubah
                            </Button>
                        ),
                    },
                ]}
            />
            <Pagination paginator={paginator} pageUrl={() => '#'} />
        </Section>
    );
}
