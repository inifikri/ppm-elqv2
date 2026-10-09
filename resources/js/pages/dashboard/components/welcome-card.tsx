import { usePage } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

export function WelcomeCard() {
    const { user } = usePage().props.auth;
    const getInitials = useInitials();

    return (
        <section
            aria-label="Selamat datang"
            className="flex w-full items-center gap-4 rounded-card bg-primary p-5 text-primary-foreground sm:p-6 md:w-3/5"
        >
            <Avatar className="size-14 border-2 border-white/40 sm:size-16">
                <AvatarImage src={user.avatar ?? undefined} alt="" />
                <AvatarFallback className="bg-white/20 text-lg text-primary-foreground">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
                <p className="text-base font-bold sm:text-lg">
                    Selamat datang kembali,
                </p>
                <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                    {user.name}
                </h1>
                <p className="text-sm opacity-90">
                    Ringkasan progres assessment 360.
                </p>
            </div>
        </section>
    );
}
