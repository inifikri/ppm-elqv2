import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <div className="flex items-center gap-2.5">
            <AppLogoIcon className="size-8 shrink-0" />
            <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold tracking-tight text-foreground">
                        {name || 'ELQ 360°'}
                    </span>
                    <span className="rounded-sm bg-primary/10 px-1 py-0.5 text-[9px] font-bold text-primary tracking-wider uppercase leading-none">
                        PPM
                    </span>
                </div>
                <span className="truncate text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                    Leadership Assessment
                </span>
            </div>
        </div>
    );
}
