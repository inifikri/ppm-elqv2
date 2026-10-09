import { Eye, EyeOff } from 'lucide-react';
import type { ComponentProps, Ref } from 'react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export default function PasswordInput({
    ref,
    ...props
}: Omit<ComponentProps<typeof Input>, 'type' | 'trailing'> & {
    ref?: Ref<HTMLInputElement>;
}) {
    const [showPassword, setShowPassword] = useState(false);
    const ToggleIcon = showPassword ? EyeOff : Eye;

    return (
        <Input
            type={showPassword ? 'text' : 'password'}
            ref={ref}
            trailing={
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="flex h-full items-center rounded-r-control px-3 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-label="Tampilkan password"
                    aria-pressed={showPassword}
                >
                    <ToggleIcon className="size-4" aria-hidden="true" />
                </button>
            }
            {...props}
        />
    );
}
