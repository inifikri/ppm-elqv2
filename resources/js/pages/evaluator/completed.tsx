import { Head } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, User, ShieldCheck } from 'lucide-react';

interface CompletedProps {
    rater: {
        ulid: string;
        role: string;
        role_label: string;
        email: string;
        submitted_at?: string;
    };
    participant: {
        name: string;
        company?: string | null;
        position?: string | null;
    };
}

export default function EvaluatorCompleted({ rater, participant }: CompletedProps) {
    return (
        <>
            <Head title="Penilaian Selesai - Evaluasi 360°" />

            <div className="mx-auto max-w-lg py-8 sm:py-12">
                <Card className="border border-border/80 bg-card shadow-sm">
                    <CardContent className="flex flex-col items-center p-6 text-center sm:p-8">
                        {/* Success Icon */}
                        <div className="relative mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <span className="absolute size-full animate-ping rounded-full bg-emerald-500/10 opacity-75 duration-1000" />
                            <CheckCircle2 className="size-8" />
                        </div>

                        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                            Penilaian Telah Diserahkan
                        </h1>

                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            Terima kasih atas partisipasi dan kontribusi Anda dalam pengisian kuesioner evaluasi kepemimpinan 360° untuk{' '}
                            <strong className="text-foreground">{participant.name}</strong>.
                        </p>

                        {/* Summary Details */}
                        <div className="mt-6 w-full rounded-xl border border-border/60 bg-muted/30 p-4 text-left text-xs sm:text-sm">
                            <div className="divide-y divide-border/60 space-y-2.5">
                                <div className="flex items-center justify-between pb-2">
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                        <User className="size-3.5" />
                                        Peserta Dinilai
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {participant.name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-muted-foreground">
                                        Peran Penilai
                                    </span>
                                    <span className="font-medium text-foreground">
                                        {rater.role_label}
                                    </span>
                                </div>
                                {rater.submitted_at && (
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-muted-foreground">
                                            Waktu Kirim
                                        </span>
                                        <span className="font-medium text-foreground">
                                            {rater.submitted_at}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Jawaban Anda telah tersimpan secara aman dan terenkripsi.</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
