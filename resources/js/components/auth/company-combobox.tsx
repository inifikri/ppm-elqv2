import { Building2, ChevronsUpDown, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { xhr } from '@/lib/xhr';
import { suggest } from '@/routes/companies';

const MIN_CHARS = 2;

/** Cermin Company::normalize di server: abaikan kapitalisasi, tanda baca, spasi ganda. */
const normalize = (v: string) =>
    v
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
const DEBOUNCE_MS = 300;

/** Sorot teks cocok sebagai node React (tanpa HTML mentah). */
function Highlight({ text, term }: { text: string; term: string }) {
    const at = text.toLowerCase().indexOf(term.toLowerCase());

    if (at < 0 || !term) {
        return <>{text}</>;
    }

    return (
        <>
            {text.slice(0, at)}
            <mark className="bg-transparent font-semibold text-primary">
                {text.slice(at, at + term.length)}
            </mark>
            {text.slice(at + term.length)}
        </>
    );
}

export function CompanyCombobox({
    id,
    value,
    onChange,
    error,
}: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
}) {
    const [open, setOpen] = useState(false);
    const [term, setTerm] = useState('');
    const [items, setItems] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const cache = useRef(new Map<string, string[]>());

    useEffect(() => {
        const q = term.trim();

        if (normalize(q).length < MIN_CHARS) {
            setItems([]);
            setLoading(false);

            return;
        }

        const key = normalize(q);
        const hit = cache.current.get(key);

        if (hit) {
            setItems(hit);

            return;
        }

        const ctrl = new AbortController();
        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const [status, body] = await xhr<{ data?: string[] }>(
                    suggest.url({ query: { q } }),
                    { signal: ctrl.signal },
                );
                const data =
                    status === 200 ? (body.data ?? []).slice(0, 8) : [];
                cache.current.set(key, data);
                setItems(data);
                setLoading(false);
            } catch {
                // dibatalkan atau jaringan gagal: biarkan opsi "perusahaan baru" tetap bisa dipakai
                if (!ctrl.signal.aborted) {
                    setItems([]);
                    setLoading(false);
                }
            }
        }, DEBOUNCE_MS);

        return () => {
            clearTimeout(timer);
            ctrl.abort();
        };
    }, [term]);

    const pick = (name: string) => {
        onChange(name);
        setOpen(false);
    };
    const q = term.trim();
    const exact = items.some((n) => normalize(n) === normalize(q));

    return (
        <FormField id={id} label="Perusahaan" error={error} required>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        aria-haspopup="listbox"
                        aria-required="true"
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? `${id}-error` : undefined}
                        className="h-field w-full justify-start gap-2 px-3 font-normal pointer-coarse:h-touch"
                    >
                        <Building2
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <span
                            className={cn(
                                'truncate',
                                !value && 'text-muted-foreground',
                            )}
                        >
                            {value || 'Cari atau ketik nama perusahaan'}
                        </span>
                        <ChevronsUpDown
                            className="ml-auto size-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                        />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                    <Command shouldFilter={false}>
                        <CommandInput
                            value={term}
                            onValueChange={setTerm}
                            maxLength={255}
                            placeholder="Ketik minimal 2 huruf…"
                            aria-label="Cari perusahaan"
                        />
                        <CommandList>
                            <p role="status" className="sr-only">
                                {loading ? 'Mencari…' : `${items.length} saran`}
                            </p>
                            {normalize(q).length < MIN_CHARS && (
                                <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                                    Ketik minimal {MIN_CHARS} huruf untuk
                                    melihat saran.
                                </p>
                            )}
                            {items.map((name) => (
                                <CommandItem
                                    key={name}
                                    value={name}
                                    onSelect={() => pick(name)}
                                >
                                    <span className="truncate">
                                        <Highlight text={name} term={q} />
                                    </span>
                                </CommandItem>
                            ))}
                            {normalize(q).length >= MIN_CHARS && !exact && (
                                <CommandItem
                                    value={`__new__${q}`}
                                    onSelect={() => pick(q)}
                                >
                                    <Plus aria-hidden="true" />
                                    <span className="truncate">
                                        Gunakan &ldquo;{q}&rdquo; sebagai
                                        perusahaan baru
                                    </span>
                                </CommandItem>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </FormField>
    );
}
