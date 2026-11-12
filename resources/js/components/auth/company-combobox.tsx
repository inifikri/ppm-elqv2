import { Building2, ChevronsUpDown, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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

export type CompanyComboboxProps = {
    id?: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    label?: string;
    description?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    initialSuggestions?: string[];
};

export function CompanyCombobox({
    id = 'company_name',
    value,
    onChange,
    error,
    label = 'Perusahaan',
    description,
    placeholder = 'Cari atau ketik nama perusahaan',
    required = true,
    disabled = false,
    className,
    initialSuggestions = [],
}: CompanyComboboxProps) {
    const [open, setOpen] = useState(false);
    const [term, setTerm] = useState('');
    const [remoteItems, setRemoteItems] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const cache = useRef(new Map<string, string[]>());

    const q = term.trim();
    const qNorm = normalize(q);

    // Filter local suggestions instantly when user types or opens
    const localMatches = useMemo(() => {
        if (!initialSuggestions || initialSuggestions.length === 0) {
            return [];
        }
        if (qNorm.length === 0) {
            return initialSuggestions.slice(0, 10);
        }
        return initialSuggestions
            .filter((c) => normalize(c).includes(qNorm))
            .slice(0, 10);
    }, [initialSuggestions, qNorm]);

    // Combined unique items (local + remote)
    const items = useMemo(() => {
        const seen = new Set<string>();
        const merged: string[] = [];

        for (const item of [...localMatches, ...remoteItems]) {
            const key = normalize(item);
            if (!seen.has(key)) {
                seen.add(key);
                merged.push(item);
            }
        }

        return merged;
    }, [localMatches, remoteItems]);

    useEffect(() => {
        if (qNorm.length < MIN_CHARS) {
            setRemoteItems([]);
            setLoading(false);
            return;
        }

        const hit = cache.current.get(qNorm);
        if (hit) {
            setRemoteItems(hit);
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
                cache.current.set(qNorm, data);
                setRemoteItems(data);
                setLoading(false);
            } catch {
                if (!ctrl.signal.aborted) {
                    setRemoteItems([]);
                    setLoading(false);
                }
            }
        }, DEBOUNCE_MS);

        return () => {
            clearTimeout(timer);
            ctrl.abort();
        };
    }, [q, qNorm]);

    const pick = (name: string) => {
        onChange(name);
        setOpen(false);
        setTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setTerm('');
    };

    const exact = items.some((n) => normalize(n) === qNorm);

    return (
        <FormField
            id={id}
            label={label}
            description={description}
            error={error}
            required={required}
            className={className}
        >
            <Popover
                open={open}
                onOpenChange={(next) => {
                    setOpen(next);
                    if (!next) {
                        setTerm('');
                    }
                }}
            >
                <PopoverTrigger asChild>
                    <div className="relative w-full">
                        <Button
                            id={id}
                            type="button"
                            variant="outline"
                            role="combobox"
                            disabled={disabled}
                            aria-expanded={open}
                            aria-haspopup="listbox"
                            aria-required={required}
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? `${id}-error` : undefined}
                            className={cn(
                                'h-field w-full justify-start gap-2 px-3 font-normal pointer-coarse:h-touch',
                                value && 'pr-8',
                            )}
                        >
                            <Building2
                                className="size-4 shrink-0 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <span
                                className={cn(
                                    'truncate text-left flex-1',
                                    !value && 'text-muted-foreground',
                                )}
                            >
                                {value || placeholder}
                            </span>
                            <ChevronsUpDown
                                className="ml-auto size-4 shrink-0 text-muted-foreground"
                                aria-hidden="true"
                            />
                        </Button>
                        {value && !disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                aria-label="Hapus pilihan perusahaan"
                                className="absolute right-7 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            value={term}
                            onValueChange={setTerm}
                            maxLength={255}
                            placeholder={placeholder}
                            aria-label="Cari perusahaan"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const trimmed = term.trim();
                                    if (
                                        trimmed.length >= MIN_CHARS &&
                                        !/<\/?[a-z!][\s\S]*?>/i.test(trimmed)
                                    ) {
                                        e.preventDefault();
                                        const exactMatch = items.find(
                                            (n) => normalize(n) === normalize(trimmed),
                                        );
                                        pick(exactMatch ?? trimmed);
                                    }
                                }
                            }}
                        />
                        <CommandList>
                            <p role="status" className="sr-only">
                                {loading ? 'Mencari…' : `${items.length} saran`}
                            </p>
                            {/<\/?[a-z!][\s\S]*?>/i.test(term) && (
                                <p
                                    role="alert"
                                    className="px-2 py-3 text-center text-xs text-destructive"
                                >
                                    Input tidak boleh mengandung tag HTML.
                                </p>
                            )}
                            {!/<\/?[a-z!][\s\S]*?>/i.test(term) &&
                                items.length === 0 &&
                                qNorm.length < MIN_CHARS && (
                                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                                        Ketik minimal {MIN_CHARS} huruf untuk melihat saran.
                                    </p>
                                )}
                            {items.length > 0 && qNorm.length < MIN_CHARS && (
                                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Perusahaan Terdaftar
                                </p>
                            )}
                            {items.map((name) => (
                                <CommandItem
                                    key={name}
                                    value={name}
                                    onSelect={() => pick(name)}
                                >
                                    <Building2 className="size-3.5 shrink-0 text-muted-foreground mr-1.5" />
                                    <span className="truncate">
                                        <Highlight text={name} term={q} />
                                    </span>
                                </CommandItem>
                            ))}
                            {qNorm.length >= MIN_CHARS &&
                                !exact &&
                                !/<\/?[a-z!][\s\S]*?>/i.test(q) && (
                                    <CommandItem
                                        value={`__new__${q}`}
                                        onSelect={() => pick(q)}
                                        className="text-primary font-medium"
                                    >
                                        <Plus className="size-4 shrink-0 mr-1.5" aria-hidden="true" />
                                        <span className="truncate">
                                            Gunakan &ldquo;{q}&rdquo; sebagai perusahaan baru
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
