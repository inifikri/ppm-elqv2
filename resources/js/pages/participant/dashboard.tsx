import { Head } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    CheckCircle2,
    Clock,
    UserCheck,
    Users,
    ShieldCheck,
    Mail,
    Building2,
    Briefcase,
    Sparkles,
} from "lucide-react";
import type { ParticipantDashboardData } from "@/types/assessment";

export default function ParticipantDashboard({
    participant,
    self_assessment,
    evaluators,
}: ParticipantDashboardData) {
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const isAllEvaluatorsComplete =
        evaluators.total_invited > 0 &&
        evaluators.total_submitted === evaluators.total_invited;

    return (
        <>
            <Head title="Penutup & Status Evaluasi - ELQ 360°" />

            <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
                {/* Greeting & Header */}
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="size-3.5" />
                        <span>Tahap Penutup &amp; Pemantauan</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        Terima Kasih, {participant.name}!
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                        {participant.company && (
                            <span className="flex items-center gap-1">
                                <Building2 className="size-3.5" />
                                {participant.company}
                            </span>
                        )}
                        {participant.position && (
                            <span className="flex items-center gap-1">
                                <Briefcase className="size-3.5" />
                                {participant.position}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Mail className="size-3.5" />
                            {participant.email}
                        </span>
                    </div>
                </div>

                {/* Penutup Banner: Asesmen Mandiri Selesai */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-4 dark:bg-emerald-950/20 sm:p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                            <CheckCircle2 className="size-5" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-sm sm:text-base font-semibold text-emerald-950 dark:text-emerald-200">
                                Asesmen Mandiri Anda Telah Berhasil Diserahkan
                            </h2>
                            <p className="text-xs text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
                                Anda telah menyelesaikan{' '}
                                {self_assessment.total_questions
                                    ? `${self_assessment.total_questions} butir pertanyaan`
                                    : 'seluruh butir pertanyaan'}{' '}
                                evaluasi diri pada{' '}
                                <strong className="font-semibold text-foreground">
                                    {formatDate(self_assessment.submitted_at)}
                                </strong>
                                . Tanggapan Anda telah tersimpan dengan aman di
                                sistem.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status Evaluator 360° Card */}
                <Card className="border border-border/80 shadow-none">
                    <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-base sm:text-lg font-bold">
                                    Status Pengisian Penilai (Evaluator 360°)
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                    Undangan penilaian telah dikirimkan ke
                                    atasan dan 3 bawahan yang Anda daftarkan.
                                </CardDescription>
                            </div>
                            <Badge
                                variant={
                                    isAllEvaluatorsComplete
                                        ? "default"
                                        : "secondary"
                                }
                                className="w-fit text-xs font-semibold py-1 px-2.5"
                            >
                                {evaluators.total_submitted} dari{" "}
                                {evaluators.total_invited} Selesai
                            </Badge>
                        </div>

                        {/* Progress Bar */}
                        <div className="pt-3">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full bg-primary transition-all duration-300 rounded-full"
                                    style={{
                                        width: `${
                                            evaluators.total_invited > 0
                                                ? (evaluators.total_submitted /
                                                      evaluators.total_invited) *
                                                  100
                                                : 0
                                        }%`,
                                    }}
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-1 sm:p-6 sm:pt-2 space-y-4">
                        {/* 1. Atasan Langsung */}
                        <div className="space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                1. Penilai Atasan Langsung
                            </span>
                            {evaluators.boss ? (
                                <div className="flex items-center justify-between rounded-lg border bg-card p-3 text-xs sm:p-3.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                            <UserCheck className="size-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground truncate">
                                                {evaluators.boss.email}
                                            </p>
                                            <p className="pt-2">
                                                {evaluators.boss
                                                    .is_submitted ? (
                                                    <Badge className="bg-emerald-600 text-white gap-1 hover:bg-emerald-600">
                                                        <CheckCircle2 className="size-3" />
                                                        Sudah Mengisi
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-muted-foreground gap-1"
                                                    >
                                                        <Clock className="size-3" />
                                                        Menunggu Pengisian
                                                    </Badge>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">
                                    Belum ada data atasan.
                                </p>
                            )}
                        </div>

                        {/* 2. Bawahan Langsung */}
                        <div className="space-y-2 pt-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                2. Penilai Bawahan Langsung (3 Orang)
                            </span>
                            <div className="space-y-2">
                                {evaluators.subordinates.map((sub, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between rounded-lg border bg-card p-3 text-xs sm:p-3.5"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                                <Users className="size-3.5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-foreground truncate">
                                                    {sub.email}
                                                </p>
                                                <p className="pt-2">
                                                    {sub.is_submitted ? (
                                                        <Badge className="bg-emerald-600 text-white gap-1 hover:bg-emerald-600">
                                                            <CheckCircle2 className="size-3" />
                                                            Sudah Mengisi
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-muted-foreground gap-1"
                                                        >
                                                            <Clock className="size-3" />
                                                            Menunggu Pengisian
                                                        </Badge>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Penutup Notice & Kerahasiaan (FR-039) */}
                <Alert className="bg-muted/40 border-border/80">
                    <ShieldCheck className="size-4 text-primary" />
                    <AlertTitle className="text-xs font-semibold">
                        Langkah Selanjutnya &amp; Kerahasiaan Laporan
                    </AlertTitle>
                    <AlertDescription className="text-xs text-muted-foreground mt-1 space-y-1.5 leading-relaxed">
                        <p>
                            • Sistem sedang menunggu penyelesaian kuesioner oleh
                            seluruh rekan penilai Anda.
                        </p>
                        <p>
                            • Demi menjaga integritas dan kerahasiaan evaluasi,
                            skor penilaian individual tidak disajikan kepada
                            peserta.
                        </p>
                        <p>
                            • Laporan komprehensif profil kepemimpinan ELQ 360°
                            akan diproses dan diterbitkan secara resmi oleh
                            konsultan/administrator setelah evaluasi seluruh
                            pihak lengkap.
                        </p>
                    </AlertDescription>
                </Alert>
            </div>
        </>
    );
}
