import type { ReactNode } from 'react';
import { SearchInput } from '@/components/search-input';

export function ListToolbar({
    label,
    placeholder,
    value,
    onChange,
    children,
}: {
    label: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    children?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
                label={label}
                placeholder={placeholder}
                value={value}
                onValueChange={onChange}
                className="sm:max-w-md"
            />
            {children}
        </div>
    );
}
