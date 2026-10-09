import { Network, Pencil, Plus } from 'lucide-react';
import { Head, Link } from '@inertiajs/react';
import { BackButton } from '@/components/back-button';
import { EmptyState } from '@/components/empty-state';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { StatusBadge, activeStatus } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { create as createQuestion } from '@/routes/admin/questions';
import { edit, index } from '@/routes/admin/domains';
import {
    create as createSubDomain,
    edit as editSubDomain,
} from '@/routes/admin/sub-domains';
import type { DomainDetail } from '@/types';

export default function DomainShow({ domain }: { domain: DomainDetail }) {
    return (
        <PageContainer>
            <Head title={domain.name} />
            <BackButton href={index()} />
            <PageHeader
                title={domain.name}
                description={`${domain.sub_domains.length} sub dimensi`}
                actions={
                    <>
                        <StatusBadge status={activeStatus(domain.is_active)} />
                        <Button asChild variant="outline">
                            <Link href={edit(domain.id)}>
                                <Pencil /> Ubah
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link
                                href={createSubDomain({
                                    query: { dimension_id: domain.id },
                                })}
                            >
                                <Plus /> Sub Dimensi
                            </Link>
                        </Button>
                    </>
                }
            />
            {domain.sub_domains.length === 0 ? (
                <Card className="shadow-none">
                    <EmptyState
                        icon={Network}
                        title="Belum ada sub dimensi"
                        description="Tambahkan sub dimensi untuk mengelompokkan pertanyaan."
                    />
                </Card>
            ) : (
                <div className="space-y-4">
                    {domain.sub_domains.map((sub) => (
                        <Card key={sub.id} className="shadow-none">
                            <CardHeader className="flex-row items-center justify-between gap-3">
                                <CardTitle>
                                    {sub.name}{' '}
                                    <span className="text-sm font-normal text-muted-foreground">
                                        ({sub.questions.length} pertanyaan)
                                    </span>
                                </CardTitle>
                                <Button asChild variant="ghost" size="icon">
                                    <Link
                                        href={editSubDomain(sub.id)}
                                        aria-label={`Ubah ${sub.name}`}
                                    >
                                        <Pencil />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {sub.questions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Belum ada pertanyaan.{' '}
                                        <Link
                                            href={createQuestion({
                                                query: {
                                                    sub_dimension_id: sub.id,
                                                },
                                            })}
                                            className="underline"
                                        >
                                            Tambah
                                        </Link>
                                    </p>
                                ) : (
                                    <ol className="list-inside list-decimal space-y-1.5 text-sm">
                                        {sub.questions.map((q) => (
                                            <li key={q.id}>{q.text}</li>
                                        ))}
                                    </ol>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </PageContainer>
    );
}

DomainShow.layout = {
    breadcrumbs: [{ title: 'Dimensi', href: index() }],
};
