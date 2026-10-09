import { Inbox } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { StatusBadge } from '@/components/status-badge';
import type { Status } from '@/components/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Row, Section } from './section';

const STATUSES: Status[] = [
    'active',
    'inactive',
    'completed',
    'in_progress',
    'not_started',
    'sent',
    'failed',
    'pending',
];

export default function Feedback() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Section id="sg-badges" title="Badge & StatusBadge">
                <Row>
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                </Row>
                <Row>
                    {STATUSES.map((s) => (
                        <StatusBadge key={s} status={s} />
                    ))}
                </Row>
            </Section>
            <Section id="sg-feedback" title="Alert, Toast, Dialog, Tooltip">
                <Alert variant="info">
                    <AlertTitle>Info</AlertTitle>
                    <AlertDescription>Banner informasi.</AlertDescription>
                </Alert>
                <Row>
                    <Button
                        variant="outline"
                        onClick={() => toast.success('Tersimpan.')}
                    >
                        Toast sukses
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => toast.error('Gagal menyimpan.')}
                    >
                        Toast gagal
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => toast.info('Informasi.')}
                    >
                        Toast info
                    </Button>
                    <Button variant="destructive" onClick={() => setOpen(true)}>
                        ConfirmDialog
                    </Button>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost">Tooltip</Button>
                        </TooltipTrigger>
                        <TooltipContent>Teks bantuan</TooltipContent>
                    </Tooltip>
                </Row>
                <ConfirmDeleteDialog
                    title="Hapus contoh?"
                    open={open}
                    onOpenChange={setOpen}
                    description="Hanya demo, tidak ada yang dihapus."
                    onConfirm={() => setOpen(false)}
                />
            </Section>
            <Section id="sg-states" title="Loading, Empty, Error, Progress">
                <div className="space-y-2 rounded-xl border bg-card p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="rounded-xl border bg-card">
                    <EmptyState
                        icon={Inbox}
                        title="Belum ada data"
                        description="Tambahkan data pertama Anda."
                        action={<Button>Tambah</Button>}
                    />
                </div>
                <div className="rounded-xl border bg-card">
                    <ErrorState onRetry={() => toast.info('Coba lagi')} />
                </div>
                <div className="max-w-md space-y-1">
                    <p className="text-sm">Soal 12 dari 39</p>
                    <Progress value={31} aria-label="Progres assessment" />
                </div>
            </Section>
        </>
    );
}
