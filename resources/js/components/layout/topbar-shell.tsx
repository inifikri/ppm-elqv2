import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function useScrolled(threshold = 4) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = (event: Event) => {
            const target = event.target;
            const top =
                target instanceof Element ? target.scrollTop : window.scrollY;
            setScrolled(top > threshold);
        };

        window.addEventListener('scroll', onScroll, {
            capture: true,
            passive: true,
        });

        return () => window.removeEventListener('scroll', onScroll, true);
    }, [threshold]);

    return scrolled;
}

export type TopbarShellProps = {
    left?: ReactNode;
    center?: ReactNode;
    right?: ReactNode;
    className?: string;
    containerClassName?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
};

export function TopbarShell({
    left,
    center,
    right,
    className,
    containerClassName,
    maxWidth = '2xl',
}: TopbarShellProps) {
    const scrolled = useScrolled(4);

    const maxWidthClass = {
        sm: 'max-w-screen-sm',
        md: 'max-w-screen-md',
        lg: 'max-w-screen-lg',
        xl: 'max-w-screen-xl',
        '2xl': 'max-w-2xl',
        '7xl': 'max-w-7xl',
        full: 'max-w-full',
    }[maxWidth];

    return (
        <header
            className={cn(
                'sticky top-0 z-30 w-full transition-colors duration-200 ease-in-out',
                'pt-[env(safe-area-inset-top,0px)]',
                scrolled
                    ? 'bg-background/75 backdrop-blur-md'
                    : 'bg-transparent',
                className
            )}
        >
            <div
                className={cn(
                    'mx-auto flex h-14 items-center justify-between px-4 sm:px-6',
                    maxWidthClass,
                    containerClassName
                )}
            >
                {left && <div className="flex items-center gap-2 min-w-0">{left}</div>}
                {center && <div className="flex items-center justify-center min-w-0 flex-1 px-2">{center}</div>}
                {right && <div className="flex items-center gap-2 shrink-0 ml-auto">{right}</div>}
            </div>
        </header>
    );
}
