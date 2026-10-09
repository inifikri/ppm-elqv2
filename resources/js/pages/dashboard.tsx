import {
    CircleCheck,
    ClipboardList,
    Hourglass,
    Percent,
    Users,
} from 'lucide-react';
import { Deferred, Head, router } from '@inertiajs/react';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { PageContainer } from '@/components/page-container';
import { WelcomeCard } from './dashboard/components/welcome-card';
import { StatCard, StatCardSkeleton } from '@/components/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboard } from '@/routes';
import type { DashboardData } from '@/types';
import { AttentionList } from './dashboard/components/attention-list';
import { DimensionOverview } from './dashboard/components/dimension-overview';
import { ProgressOverview } from './dashboard/components/progress-overview';
import { RecentActivity } from './dashboard/components/recent-activity';
import { RecentAssessments } from './dashboard/components/recent-assessments';

function DashboardSkeleton() {
    return (
        <div className="space-y-6" role="status" aria-label="Memuat dashboard">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
                <Skeleton className="h-64 lg:col-span-2" />
                <Skeleton className="h-64" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        </div>
    );
}

function DashboardContent({ data }: { data?: DashboardData }) {
    if (!data) {
        return (
            <ErrorState
                title="Dashboard gagal dimuat"
                description="Terjadi kesalahan saat mengambil data."
                onRetry={() => router.reload({ only: ['dashboard'] })}
            />
        );
    }

    const { kpi } = data;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Peserta aktif"
                    value={kpi.active}
                    hint={`${kpi.not_started} belum punya penilai`}
                    icon={Users}
                    tone="info"
                />
                <StatCard
                    label="Sedang berjalan"
                    value={kpi.in_progress}
                    hint="Penilai belum lengkap submit"
                    icon={Hourglass}
                    tone="warning"
                />
                <StatCard
                    label="Selesai"
                    value={kpi.completed}
                    hint="Semua penilai sudah submit"
                    icon={CircleCheck}
                    tone="success"
                />
                <StatCard
                    label="Completion rate"
                    value={`${kpi.completion_rate}%`}
                    hint="Selesai / peserta aktif"
                    icon={Percent}
                    tone="primary"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <ProgressOverview kpi={kpi} roles={data.roles} />
                    <DimensionOverview dimensions={data.dimensions} />
                </div>
                <AttentionList items={data.attention} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <RecentAssessments items={data.recent_assessments} />
                <RecentActivity items={data.recent_activity} />
            </div>
        </div>
    );
}

export default function Dashboard({
    canViewStats,
    dashboard: data,
}: {
    canViewStats: boolean;
    dashboard?: DashboardData;
}) {
    return (
        <>
            <Head title="Dashboard" />
            <PageContainer>
                <WelcomeCard />
                {canViewStats ? (
                    <Deferred data="dashboard" fallback={<DashboardSkeleton />}>
                        <DashboardContent data={data} />
                    </Deferred>
                ) : (
                    <EmptyState
                        icon={ClipboardList}
                        title="Selamat datang"
                        description="Statistik dashboard hanya tersedia untuk admin."
                    />
                )}
            </PageContainer>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
