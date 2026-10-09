import { Search, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Single search field: leading icon, clear button when filled. */
export function SearchInput({
    value,
    onValueChange,
    label,
    className,
    ...props
}: Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
    value: string;
    onValueChange: (value: string) => void;
    /** Accessible name; also used for the clear button. */
    label: string;
}) {
    return (
        <div className={cn('relative w-full', className)}>
            <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
                {...props}
                type="search"
                aria-label={label}
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                className="pr-9 pl-8 [&::-webkit-search-cancel-button]:appearance-none"
            />
            {value && (
                <button
                    type="button"
                    aria-label={`Hapus pencarian: ${label}`}
                    onClick={() => onValueChange('')}
                    className="absolute top-1/2 right-1 flex size-control -translate-y-1/2 items-center justify-center rounded-control text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-touch"
                >
                    <X aria-hidden="true" />
                </button>
            )}
        </div>
    );
}
