import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { Paginated } from '@/types';

function pageWindow(current: number, last: number): (number | 'gap')[] {
    const pages = new Set(
        [1, last, current - 1, current, current + 1].filter(
            (p) => p >= 1 && p <= last,
        ),
    );
    const sorted = [...pages].sort((a, b) => a - b);

    return sorted.flatMap((p, i) =>
        i > 0 && p - sorted[i - 1] > 1 ? ['gap' as const, p] : [p],
    );
}

export default function Pagination({
    paginator,
    pageUrl,
}: {
    paginator: Paginated<unknown>;
    pageUrl: (page: number) => string;
}) {
    const { current_page, last_page, from, to, total } = paginator;

    return (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
                {total === 0
                    ? 'Tidak ada data'
                    : `Menampilkan ${from} sampai ${to} dari ${total}`}
            </p>
            {last_page > 1 && (
                <nav
                    aria-label="Pagination"
                    className="flex items-center gap-1"
                >
                    <Button
                        asChild={paginator.prev_page_url !== null}
                        variant="outline"
                        size="sm"
                        disabled={paginator.prev_page_url === null}
                    >
                        {paginator.prev_page_url ? (
                            <Link href={paginator.prev_page_url} preserveScroll>
                                Sebelumnya
                            </Link>
                        ) : (
                            'Sebelumnya'
                        )}
                    </Button>
                    {pageWindow(current_page, last_page).map((p, i) =>
                        p === 'gap' ? (
                            <span key={`gap-${i}`} className="px-1">
                                …
                            </span>
                        ) : (
                            <Button
                                key={p}
                                asChild
                                size="sm"
                                variant={
                                    p === current_page ? 'default' : 'outline'
                                }
                            >
                                <Link
                                    href={pageUrl(p)}
                                    preserveScroll
                                    aria-current={
                                        p === current_page ? 'page' : undefined
                                    }
                                >
                                    {p}
                                </Link>
                            </Button>
                        ),
                    )}
                    <Button
                        asChild={paginator.next_page_url !== null}
                        variant="outline"
                        size="sm"
                        disabled={paginator.next_page_url === null}
                    >
                        {paginator.next_page_url ? (
                            <Link href={paginator.next_page_url} preserveScroll>
                                Berikutnya
                            </Link>
                        ) : (
                            'Berikutnya'
                        )}
                    </Button>
                </nav>
            )}
        </div>
    );
}
