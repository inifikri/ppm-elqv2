import type { ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export type Column<T> = {
    header: string;
    cell: (row: T) => ReactNode;
    className?: string;
    /** Row actions: pinned to the bottom of the mobile card, no label. */
    actions?: boolean;
};

export type RowSelection = {
    selected: ReadonlySet<number>;
    onChange: (next: Set<number>) => void;
    /** Accessible name per row, e.g. "Pilih pertanyaan 3". */
    rowLabel: (id: number) => string;
};

export function DataTable<T extends { id: number }>({
    columns,
    rows,
    empty,
    selection,
}: {
    columns: Column<T>[];
    rows: T[];
    empty: ReactNode;
    selection?: RowSelection;
}) {
    const toggle = (id: number, checked: boolean) => {
        const next = new Set(selection?.selected);

        if (checked) {
            next.add(id);
        } else {
            next.delete(id);
        }

        selection?.onChange(next);
    };

    const count = selection?.selected.size ?? 0;
    const allChecked =
        rows.length > 0 && count === rows.length
            ? true
            : count > 0
              ? 'indeterminate'
              : false;

    const rowCheckbox = (id: number) =>
        selection && (
            <label className="-m-3 flex size-11 items-center justify-center md:m-0 md:size-auto">
                <Checkbox
                    aria-label={selection.rowLabel(id)}
                    checked={selection.selected.has(id)}
                    onCheckedChange={(c) => toggle(id, c === true)}
                />
            </label>
        );

    if (rows.length === 0) {
        return <div className="rounded-card border bg-card">{empty}</div>;
    }

    const [primary, ...rest] = columns.filter((c) => !c.actions);
    const actions = columns.find((c) => c.actions);

    return (
        <>
            <ul className="space-y-3 md:hidden">
                {rows.map((row) => (
                    <li
                        key={row.id}
                        className="space-y-3 rounded-card border bg-card p-4"
                    >
                        <div className="flex items-start gap-3">
                            {rowCheckbox(row.id)}
                            <div className="min-w-0 flex-1 font-medium">
                                {primary.cell(row)}
                            </div>
                        </div>
                        <dl className="space-y-1.5 text-sm">
                            {rest.map((c) => (
                                <div
                                    key={c.header}
                                    className="flex justify-between gap-4"
                                >
                                    <dt className="text-muted-foreground">
                                        {c.header}
                                    </dt>
                                    <dd className="text-right">
                                        {c.cell(row)}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        {actions && (
                            <div className="border-t pt-2">
                                {actions.cell(row)}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
            <div className="hidden overflow-x-auto rounded-card border bg-card md:block">
                <Table>
                    <TableHeader className="bg-muted/50 [&_th]:h-11 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wider [&_th]:text-muted-foreground [&_th]:uppercase">
                        <TableRow>
                            {selection && (
                                <TableHead scope="col" className="w-10">
                                    <Checkbox
                                        aria-label="Pilih semua di halaman ini"
                                        checked={allChecked}
                                        onCheckedChange={(c) =>
                                            selection.onChange(
                                                c === true
                                                    ? new Set(
                                                          rows.map((r) => r.id),
                                                      )
                                                    : new Set(),
                                            )
                                        }
                                    />
                                </TableHead>
                            )}
                            {columns.map((c) => (
                                <TableHead
                                    key={c.header}
                                    scope="col"
                                    className={c.className}
                                >
                                    {c.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow
                                key={row.id}
                                className="hover:bg-accent/40"
                                data-state={
                                    selection?.selected.has(row.id)
                                        ? 'selected'
                                        : undefined
                                }
                            >
                                {selection && (
                                    <TableCell>{rowCheckbox(row.id)}</TableCell>
                                )}
                                {columns.map((c) => (
                                    <TableCell
                                        key={c.header}
                                        className={c.className}
                                    >
                                        {c.cell(row)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
