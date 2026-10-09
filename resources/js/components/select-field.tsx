import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
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

/** FormField + Combobox (Popover + Command) yang tetap terkirim lewat input hidden. */
export function SelectField({
    id,
    name,
    label,
    placeholder,
    options,
    defaultValue,
    error,
    className,
}: {
    id: string;
    name: string;
    label: string;
    placeholder: string;
    options: { value: number; label: string }[];
    defaultValue?: number | null;
    error?: string;
    className?: string;
}) {
    const initial = defaultValue ? String(defaultValue) : '';
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(initial);
    const hidden = useRef<HTMLInputElement>(null);
    const selected = options.find((o) => String(o.value) === value);

    useEffect(() => {
        const form = hidden.current?.form;
        const onReset = () => setValue(initial);

        form?.addEventListener('reset', onReset);

        return () => form?.removeEventListener('reset', onReset);
    }, [initial]);

    return (
        <FormField
            id={id}
            label={label}
            error={error}
            className={className}
            required
        >
            <input ref={hidden} type="hidden" name={name} value={value} />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        aria-required="true"
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? `${id}-error` : undefined}
                        className="h-field w-full justify-between px-3 font-normal pointer-coarse:h-touch"
                    >
                        <span
                            className={cn(
                                'truncate',
                                !selected && 'text-muted-foreground',
                            )}
                        >
                            {selected?.label ?? placeholder}
                        </span>
                        <ChevronsUpDown
                            className="ml-2 size-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                        />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                    <Command>
                        <CommandInput placeholder="Cari…" />
                        <CommandList>
                            <CommandEmpty>Tidak ada hasil.</CommandEmpty>
                            {options.map((o) => (
                                <CommandItem
                                    key={o.value}
                                    value={o.label}
                                    onSelect={() => {
                                        setValue(String(o.value));
                                        setOpen(false);
                                    }}
                                >
                                    <span className="truncate">{o.label}</span>
                                    <Check
                                        className={cn(
                                            'ml-auto',
                                            String(o.value) === value
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                        aria-hidden="true"
                                    />
                                </CommandItem>
                            ))}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </FormField>
    );
}
