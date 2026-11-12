import { useState } from "react";
import { Head } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Download,
    CheckCircle2,
    Clock,
    UserCheck,
    Users,
    ShieldCheck,
    Mail,
    Building2,
    Briefcase,
    BarChart3,
    Activity,
    Layers,
    FileSpreadsheet,
    FileText,
    PieChart,
} from "lucide-react";
import { ScoreCard } from "@/components/assessment/score-card";
import { DimensionRadarChart } from "@/components/assessment/charts/dimension-radar-chart";
import { RoleComparisonBarChart } from "@/components/assessment/charts/role-comparison-bar-chart";
import { SubDimensionBarChart } from "@/components/assessment/charts/sub-dimension-bar-chart";
import type { ParticipantDashboardData } from "@/types/assessment";

export default function ParticipantDashboard({
    participant,
    self_assessment,
    evaluators,
    result,
}: ParticipantDashboardData) {
    const hasResultData = Boolean(result?.has_data);

    // Tab Utama: Hasil Asesmen vs Status Penilai
    const [mainTab, setMainTab] = useState<string>(
        hasResultData ? "results" : "evaluators",
    );

    // Sub-tab Tampilan Grafik agar tidak menumpuk: Overview Dimensi vs 14 Sub-Dimensi vs Tabel
    const [chartView, setChartView] = useState<
        "dimensions" | "sub-dimensions" | "table"
    >("dimensions");

    const isAllEvaluatorsComplete =
        evaluators.total_invited > 0 &&
        evaluators.total_submitted === evaluators.total_invited;

    const downloadPdfUrl = "/participant/result/pdf";

    return (
        <>
            <Head title="Dashboard Asesmen Kepemimpinan 360° - ELQ" />

            <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
                {/* 1. Header Profil Peserta (Bersih & Fokus) */}
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-br from-primary/10 via-card to-background p-5 sm:p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
                                    Executive Leadership Questionnaire 360°
                                </span>
                                {isAllEvaluatorsComplete ? (
                                    <Badge className="bg-primary text-primary-foreground gap-1 text-xs">
                                        <CheckCircle2 className="size-3" />
                                        Evaluasi 360° Lengkap
                                    </Badge>
                                ) : (
                                    <Badge
                                        variant="outline"
                                        className="text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-xs bg-amber-500/10"
                                    >
                                        <Clock className="size-3" />
                                        {evaluators.total_submitted} dari{" "}
                                        {evaluators.total_invited} Penilai
                                        Selesai
                                    </Badge>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                Halo, {participant.name}!
                            </h1>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
                                {participant.company && (
                                    <span className="flex items-center gap-1.5 font-medium text-foreground/85">
                                        <Building2 className="size-3.5 text-primary" />
                                        {participant.company}
                                    </span>
                                )}
                                {participant.position && (
                                    <span className="flex items-center gap-1.5">
                                        <Briefcase className="size-3.5 text-muted-foreground" />
                                        {participant.position}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <Mail className="size-3.5 text-muted-foreground" />
                                    {participant.email}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Kartu Aksi Terpisah: Unduh Laporan PDF (Khusus & Elegan) */}
                {hasResultData && (
                    <div className="rounded-xl border border-primary/25 bg-card p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <FileText className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm sm:text-base font-semibold text-foreground">
                                    Dokumen Laporan Profil Kepemimpinan 360°
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Dokumen PDF resmi mencakup diagram radar,
                                    skor peran, dan 14 sub-dimensi.
                                </p>
                            </div>
                        </div>

                        <Button
                            asChild
                            size="default"
                            className="shrink-0 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
                        >
                            <a href={downloadPdfUrl} download>
                                <Download className="size-4" />
                                <span>Unduh Laporan (PDF)</span>
                            </a>
                        </Button>
                    </div>
                )}

                {/* 3. Tab Navigasi Utama */}
                <Tabs
                    value={mainTab}
                    onValueChange={setMainTab}
                    className="w-full space-y-6"
                >
                    <div className="flex items-center justify-between pb-2">
                        <TabsList className="grid grid-cols-2 w-full sm:w-auto h-10 p-1">
                            <TabsTrigger
                                value="results"
                                disabled={!hasResultData}
                                className="gap-2 text-xs sm:text-sm font-semibold"
                            >
                                <BarChart3 className="size-4 text-primary" />
                                <span>Hasil Assessment</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="evaluators"
                                className="gap-2 text-xs sm:text-sm font-semibold"
                            >
                                <Users className="size-4 text-primary" />
                                <span>Status Penilai 360°</span>
                            </TabsTrigger>
                        </TabsList>

                        <span className="hidden sm:inline-block text-xs text-muted-foreground">
                            {hasResultData
                                ? "Laporan Teragregasi & Dianonimkan"
                                : "Menunggu pengisian rekan penilai"}
                        </span>
                    </div>

                    {/* TAB 1: HASIL ASSESSMENT 360° */}
                    {hasResultData && result && (
                        <TabsContent value="results" className="space-y-6 mt-0">
                            {/* Kartu Skor Keseluruhan & Peran */}
                            <ScoreCard result={result} />

                            {/* Segmented Switcher untuk Grafik: Mencegah Kartu Bertumpuk */}
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                                    <div>
                                        <h2 className="text-base font-bold text-foreground">
                                            Visualisasi &amp; Analisis Hasil
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Pilih sudut pandang analisis untuk
                                            melihat rincian visual secara fokus.
                                        </p>
                                    </div>

                                    {/* Segmented Controller */}
                                    <div className="inline-flex items-center rounded-lg bg-muted p-1 text-xs">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setChartView("dimensions")
                                            }
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                                                chartView === "dimensions"
                                                    ? "bg-card text-foreground shadow-xs font-semibold"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            <PieChart className="size-3.5 text-primary" />
                                            <span>Dimensi Utama</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setChartView("sub-dimensions")
                                            }
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                                                chartView === "sub-dimensions"
                                                    ? "bg-card text-foreground shadow-xs font-semibold"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            <Layers className="size-3.5 text-primary" />
                                            <span>14 Sub-Dimensi</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setChartView("table")
                                            }
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                                                chartView === "table"
                                                    ? "bg-card text-foreground shadow-xs font-semibold"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            <FileSpreadsheet className="size-3.5 text-primary" />
                                            <span>Matriks Tabel</span>
                                        </button>
                                    </div>
                                </div>

                                {/* VIEW 1: Dimensi Utama (Radar & Perbandingan Peran) */}
                                {chartView === "dimensions" && (
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-in fade-in-50 duration-200">
                                        <Card className="shadow-xs border-border/80">
                                            <CardHeader className="p-4 sm:p-5 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                                        <Activity className="size-4" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-sm sm:text-base font-bold">
                                                            Diagram Radar 3
                                                            Dimensi
                                                        </CardTitle>
                                                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                                            Perbandingan
                                                            persepsi Diri
                                                            Sendiri, Atasan,
                                                            Bawahan/Rekan, dan
                                                            Rata-rata.
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 sm:p-5 pt-2">
                                                <DimensionRadarChart
                                                    dimensions={
                                                        result.dimensions
                                                    }
                                                />
                                            </CardContent>
                                        </Card>

                                        <Card className="shadow-xs border-border/80">
                                            <CardHeader className="p-4 sm:p-5 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                                        <BarChart3 className="size-4" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-sm sm:text-base font-bold">
                                                            Perbandingan Skor
                                                            per Dimensi
                                                        </CardTitle>
                                                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                                            Distribusi nilai
                                                            Task, People, dan
                                                            Change Oriented
                                                            Leadership.
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 sm:p-5 pt-2">
                                                <RoleComparisonBarChart
                                                    dimensions={
                                                        result.dimensions
                                                    }
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* VIEW 2: 14 Sub-Dimensi (Grafik Batang Horizontal yang Lega) */}
                                {chartView === "sub-dimensions" && (
                                    <Card className="shadow-xs border-border/80 animate-in fade-in-50 duration-200">
                                        <CardHeader className="p-4 sm:p-5 pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                                    <Layers className="size-4" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-sm sm:text-base font-bold">
                                                        Profil 14 Sub-Dimensi
                                                        Kepemimpinan
                                                    </CardTitle>
                                                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                                        Visualisasi skor Diri
                                                        Sendiri, Atasan,
                                                        Bawahan/Rekan, dan
                                                        Rata-rata pada setiap
                                                        kompetensi kepemimpinan.
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 sm:p-5 pt-2">
                                            <SubDimensionBarChart
                                                dimensions={result.dimensions}
                                            />
                                        </CardContent>
                                    </Card>
                                )}

                                {/* VIEW 3: Matriks Tabel Nilai */}
                                {chartView === "table" && (
                                    <Card className="shadow-xs border-border/80 animate-in fade-in-50 duration-200">
                                        <CardHeader className="p-4 sm:p-5 pb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                                    <FileSpreadsheet className="size-4" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-sm sm:text-base font-bold">
                                                        Matriks Rangkuman Nilai
                                                        Dimensi &amp;
                                                        Sub-Dimensi
                                                    </CardTitle>
                                                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                                        Rincian tabulasi
                                                        kuantitatif skor
                                                        persepsi skala 1–6.
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0 sm:px-5 sm:pb-5">
                                            <div className="overflow-x-auto border-t sm:border sm:rounded-xl">
                                                <Table>
                                                    <TableHeader className="bg-muted/50">
                                                        <TableRow>
                                                            <TableHead className="font-semibold text-xs text-foreground">
                                                                Dimensi
                                                            </TableHead>
                                                            <TableHead className="text-center font-semibold text-xs text-foreground">
                                                                Diri Sendiri
                                                            </TableHead>
                                                            <TableHead className="text-center font-semibold text-xs text-foreground">
                                                                Atasan
                                                            </TableHead>
                                                            <TableHead className="text-center font-semibold text-xs text-foreground">
                                                                Bawahan/Rekan
                                                            </TableHead>
                                                            <TableHead className="text-center font-semibold text-xs text-foreground">
                                                                Rata-rata
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {result.dimensions.map(
                                                            (dim) => (
                                                                <TableRow
                                                                    key={dim.id}
                                                                    className="hover:bg-muted/30"
                                                                >
                                                                    <TableCell className="font-bold text-xs sm:text-sm text-foreground">
                                                                        {
                                                                            dim.name
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell className="text-center font-semibold tabular-nums text-xs sm:text-sm text-indigo-600 dark:text-indigo-400">
                                                                        {dim
                                                                            .scores
                                                                            .self !==
                                                                        null
                                                                            ? dim.scores.self.toFixed(
                                                                                  2,
                                                                              )
                                                                            : "-"}
                                                                    </TableCell>
                                                                    <TableCell className="text-center font-semibold tabular-nums text-xs sm:text-sm text-primary">
                                                                        {dim
                                                                            .scores
                                                                            .boss !==
                                                                        null
                                                                            ? dim.scores.boss.toFixed(
                                                                                  2,
                                                                              )
                                                                            : "-"}
                                                                    </TableCell>
                                                                    <TableCell className="text-center font-semibold tabular-nums text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                                                                        {dim
                                                                            .scores
                                                                            .subordinate !==
                                                                        null
                                                                            ? dim.scores.subordinate.toFixed(
                                                                                  2,
                                                                              )
                                                                            : "-"}
                                                                    </TableCell>
                                                                    <TableCell className="text-center font-bold tabular-nums text-xs sm:text-sm text-primary">
                                                                        {dim
                                                                            .scores
                                                                            .average !==
                                                                        null
                                                                            ? dim.scores.average.toFixed(
                                                                                  2,
                                                                              )
                                                                            : "-"}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ),
                                                        )}
                                                    </TableBody>
                                                    <TableFooter className="bg-muted/60 font-bold border-t-2">
                                                        <TableRow>
                                                            <TableCell className="font-bold text-xs sm:text-sm text-foreground">
                                                                Rata-rata
                                                                Keseluruhan
                                                                (Overall Score)
                                                            </TableCell>
                                                            <TableCell className="text-center font-bold tabular-nums text-xs sm:text-sm text-indigo-600 dark:text-indigo-400">
                                                                {result
                                                                    .role_overall_scores
                                                                    .self !==
                                                                null
                                                                    ? result.role_overall_scores.self.toFixed(
                                                                          2,
                                                                      )
                                                                    : "-"}
                                                            </TableCell>
                                                            <TableCell className="text-center font-bold tabular-nums text-xs sm:text-sm text-primary">
                                                                {result
                                                                    .role_overall_scores
                                                                    .boss !==
                                                                null
                                                                    ? result.role_overall_scores.boss.toFixed(
                                                                          2,
                                                                      )
                                                                    : "-"}
                                                            </TableCell>
                                                            <TableCell className="text-center font-bold tabular-nums text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                                                                {result
                                                                    .role_overall_scores
                                                                    .subordinate !==
                                                                null
                                                                    ? result.role_overall_scores.subordinate.toFixed(
                                                                          2,
                                                                      )
                                                                    : "-"}
                                                            </TableCell>
                                                            <TableCell className="text-center font-bold tabular-nums text-xs sm:text-sm text-primary">
                                                                {result.overall_score !==
                                                                null
                                                                    ? result.overall_score.toFixed(
                                                                          2,
                                                                      )
                                                                    : "-"}
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableFooter>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Kerahasiaan & Anonimitas Penilai Notice */}
                            <Alert className="bg-muted/30 border-border/80">
                                <ShieldCheck className="size-4 text-primary" />
                                <AlertTitle className="text-xs font-semibold">
                                    Prinsip Kerahasiaan &amp; Anonimitas
                                </AlertTitle>
                                <AlertDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    Hasil asesmen disajikan dalam bentuk agregat
                                    rata-rata kompetensi. Untuk menjamin
                                    objektivitas dan independensi penilaian,
                                    respon butir pertanyaan individual nomor
                                    1–39 maupun identitas penilai bawahan/rekan
                                    tidak disajikan dalam laporan ini.
                                </AlertDescription>
                            </Alert>
                        </TabsContent>
                    )}

                    {/* TAB 2: STATUS PENILAI 360° */}
                    <TabsContent value="evaluators" className="space-y-6 mt-0">
                        {/* Status Asesmen Mandiri */}
                        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    <CheckCircle2 className="size-5" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-sm sm:text-base font-semibold text-primary dark:text-primary-foreground">
                                        Asesmen Mandiri Anda Telah Berhasil
                                        Diserahkan
                                    </h2>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Anda telah menyelesaikan seluruh{" "}
                                        {self_assessment.total_questions || 39}{" "}
                                        butir pertanyaan evaluasi diri.
                                        Tanggapan Anda telah tersimpan dan
                                        menjadi bagian dari kalkulasi profil
                                        kepemimpinan 360°.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status Penilai Card */}
                        <Card className="border border-border/80 shadow-none">
                            <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-base sm:text-lg font-bold">
                                            Status Pengisian Penilai (Evaluator
                                            360°)
                                        </CardTitle>
                                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                            Undangan penilaian telah dikirimkan
                                            ke atasan dan 3 bawahan/rekan kerja
                                            yang Anda daftarkan.
                                        </CardDescription>
                                    </div>
                                    <Badge
                                        variant={
                                            isAllEvaluatorsComplete
                                                ? "default"
                                                : "secondary"
                                        }
                                        className="w-fit text-xs font-semibold py-1 px-2.5 bg-primary/10 text-primary border-primary/20"
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
                                                    <div className="pt-1.5">
                                                        {evaluators.boss
                                                            .is_submitted ? (
                                                            <Badge className="bg-primary text-primary-foreground gap-1 hover:bg-primary text-[10px]">
                                                                <CheckCircle2 className="size-3" />
                                                                Sudah Mengisi
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-muted-foreground gap-1 text-[10px]"
                                                            >
                                                                <Clock className="size-3" />
                                                                Menunggu
                                                                Pengisian
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">
                                            Belum ada data atasan.
                                        </p>
                                    )}
                                </div>

                                {/* 2. Bawahan/Rekan Langsung */}
                                <div className="space-y-2 pt-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        2. Penilai Bawahan/Rekan Langsung (3
                                        Orang)
                                    </span>
                                    <div className="space-y-2">
                                        {evaluators.subordinates.map(
                                            (sub, idx) => (
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
                                                            <div className="pt-1.5">
                                                                {sub.is_submitted ? (
                                                                    <Badge className="bg-primary text-primary-foreground gap-1 hover:bg-primary text-[10px]">
                                                                        <CheckCircle2 className="size-3" />
                                                                        Sudah
                                                                        Mengisi
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-muted-foreground gap-1 text-[10px]"
                                                                    >
                                                                        <Clock className="size-3" />
                                                                        Menunggu
                                                                        Pengisian
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Edukasi & Notice */}
                        <Alert className="bg-muted/40 border-border/80">
                            <ShieldCheck className="size-4 text-primary" />
                            <AlertTitle className="text-xs font-semibold">
                                Kerahasiaan &amp; Langkah Selanjutnya
                            </AlertTitle>
                            <AlertDescription className="text-xs text-muted-foreground mt-1 space-y-1.5 leading-relaxed">
                                <p>
                                    • Sistem otomatis mengirimkan pengingat
                                    kepada rekan penilai yang belum
                                    menyelesaikan evaluasi.
                                </p>
                                <p>
                                    • Setelah seluruh penilai selesai, profil
                                    kepemimpinan Anda terkalkulasi lengkap dan
                                    dapat diunduh kapan saja melalui tombol
                                    Laporan PDF.
                                </p>
                            </AlertDescription>
                        </Alert>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
