import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Home,
    RotateCcw,
    ShieldAlert,
    FileQuestion,
    ServerCrash,
    Clock,
    Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
    status: number;
    message?: string;
}

const ERROR_DETAILS: Record<
    number,
    {
        title: string;
        description: string;
        icon: typeof FileQuestion;
        badge: string;
    }
> = {
    401: {
        title: 'Sesi Belum Terautentikasi',
        description:
            'Anda perlu masuk ke akun terlebih dahulu untuk mengakses halaman ini.',
        icon: ShieldAlert,
        badge: '401 Unauthorized',
    },
    403: {
        title: 'Akses Dibatasi',
        description:
            'Akun Anda tidak memiliki izin untuk melihat atau menjalankan tindakan pada halaman ini.',
        icon: ShieldAlert,
        badge: '403 Forbidden',
    },
    404: {
        title: 'Halaman Tidak Ditemukan',
        description:
            'Tautan yang Anda tuju mungkin salah ketik, sudah dihapus, atau dipindahkan ke alamat lain.',
        icon: FileQuestion,
        badge: '404 Not Found',
    },
    419: {
        title: 'Sesi Halaman Berakhir',
        description:
            'Sesi keamanan Anda telah kadaluarsa karena tidak ada aktivitas. Silakan muat ulang halaman.',
        icon: Clock,
        badge: '419 Page Expired',
    },
    429: {
        title: 'Terlalu Banyak Permintaan',
        description:
            'Sistem mendeteksi aktivitas yang terlalu cepat. Harap tunggu beberapa saat sebelum mencoba lagi.',
        icon: Flame,
        badge: '429 Too Many Requests',
    },
    500: {
        title: 'Terjadi Kesalahan Server',
        description:
            'Sistem kami mengalami kendala teknis sementara saat memproses permintaan ini.',
        icon: ServerCrash,
        badge: '500 Server Error',
    },
    503: {
        title: 'Layanan Dalam Pemeliharaan',
        description:
            'Aplikasi sedang menjalani pemeliharaan berkala untuk peningkatan performa. Silakan kembali sesaat lagi.',
        icon: ServerCrash,
        badge: '503 Maintenance',
    },
};

export default function ErrorPage({ status, message }: ErrorPageProps) {
    const error = ERROR_DETAILS[status] ?? {
        title: 'Terjadi Kesalahan',
        description:
            message ||
            'Permintaan Anda tidak dapat diselesaikan karena terjadi kendala teknis yang tidak terduga.',
        icon: ServerCrash,
        badge: `${status} Error`,
    };

    const Icon = error.icon;

    const handleReload = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/';
        }
    };

    return (
        <div className="flex min-h-svh w-full items-center justify-center bg-background px-4 py-12 text-foreground sm:px-6">
            <Head title={`${status} - ${error.title}`} />

            <main className="w-full max-w-xl text-center flex flex-col items-center">
                {/* Minimal Status Code Display */}
                <div className="mb-4 font-mono text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    HTTP {status}
                </div>

                {/* Subtle Icon Box */}
                <div className="mb-6 flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-surface shadow-xs">
                    <Icon
                        className="size-6 text-muted-foreground"
                        aria-hidden="true"
                    />
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                    {error.title}
                </h1>

                <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">
                    {message && status !== 500 ? message : error.description}
                </p>

                {/* Action Buttons */}
                <div className="mt-8 flex w-full flex-col-reverse gap-2.5 sm:w-auto sm:flex-row sm:items-center">
                    <Button
                        type="button"
                        variant="outline"
                        size="default"
                        icon={status === 419 ? RotateCcw : ArrowLeft}
                        onClick={status === 419 ? handleReload : handleBack}
                        className="w-full sm:w-auto"
                    >
                        {status === 419 ? 'Muat Ulang Halaman' : 'Kembali'}
                    </Button>

                    <Button
                        asChild
                        variant="default"
                        size="default"
                        icon={Home}
                        className="w-full sm:w-auto"
                    >
                        <Link href="/">Ke Halaman Utama</Link>
                    </Button>
                </div>
            </main>
        </div>
    );
}

