import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useInitials } from '@/hooks/use-initials';

const MAX_BYTES = 2 * 1024 * 1024;

export default function PhotoInput({
    currentUrl,
    fallback,
    ...props
}: Omit<ComponentProps<typeof Input>, 'type' | 'accept'> & {
    currentUrl?: string | null;
    fallback?: string;
}) {
    const initials = useInitials();
    const [preview, setPreview] = useState<string>();
    const [error, setError] = useState<string>();

    useEffect(
        () => () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        },
        [preview],
    );

    return (
        <div className="flex items-center gap-3">
            <Avatar className="size-12 shrink-0">
                <AvatarImage src={preview ?? currentUrl ?? undefined} alt="" />
                <AvatarFallback>
                    {initials(fallback ?? '') || '?'}
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
                <Input
                    {...props}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        const bad =
                            file &&
                            (!['image/jpeg', 'image/png'].includes(file.type)
                                ? 'Format harus JPG atau PNG.'
                                : file.size > MAX_BYTES
                                  ? 'Ukuran maksimal 2 MB.'
                                  : undefined);

                        setError(bad);

                        if (!file || bad) {
                            e.target.value = '';
                            setPreview(undefined);

                            return;
                        }

                        setPreview(URL.createObjectURL(file));
                    }}
                />
                {error && (
                    <p role="alert" className="text-xs text-destructive">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}
