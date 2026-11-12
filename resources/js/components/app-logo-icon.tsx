import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function AppLogoIcon({
    className,
    alt = 'PPM Manajemen',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/image/Logo-PPM-02.png"
            alt={alt}
            className={cn('aspect-square object-contain', className)}
            {...props}
        />
    );
}
