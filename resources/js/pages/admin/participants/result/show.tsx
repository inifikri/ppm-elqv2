import { useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    Download,
    Mail,
    AlertCircle,
    FileBarChart2,
    Send,
} from "lucide-react";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { ScoreCard } from "@/components/assessment/score-card";
import { DimensionRadarChart } from "@/components/assessment/charts/dimension-radar-chart";
import { RoleComparisonBarChart } from "@/components/assessment/charts/role-comparison-bar-chart";
import { SubDimensionBarChart } from "@/components/assessment/charts/sub-dimension-bar-chart";
import { DetailedAnswersTable } from "@/components/assessment/detailed-answers-table";
import { SendPdfDialog } from "@/components/assessment/send-pdf-dialog";
import type { AssessmentResult } from "@/types/assessment";
import type { Auth } from "@/types/auth";

export default function AssessmentResultShow({
    result,
}: {
    result: AssessmentResult;
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [sendModalOpen, setSendModalOpen] = useState(false);

    const canExport = Boolean(auth.can?.export_results);
    const canShare = Boolean(auth.can?.share_results);

    const subtitle = [
        result.participant.company,
        result.participant.position,
        result.participant.email,
    ]
        .filter(Boolean)
        .join(" · ");

    const downloadPdfUrl = `/admin/participants/${result.participant.id}/result/pdf`;
    const sendPdfUrl = `/admin/participants/${result.participant.id}/result/send-pdf`;

    return (
        <PageContainer>
            <Head title={`Hasil Assessment - ${result.participant.name}`} />

            <div className="mb-2">
                <Button asChild variant="ghost" size="sm" icon={ArrowLeft}>
                    <Link href={`/admin/participants/${result.participant.id}`}>
                        Kembali ke Detail Peserta
                    </Link>
                </Button>
            </div>

            <PageHeader
                title={`Hasil Assessment: ${result.participant.name}`}
                description={
                    subtitle || "Ringkasan hasil evaluasi kepemimpinan 360°"
                }
                actions={
                    <div className="flex items-center gap-2">
                        {canExport && result.has_data && (
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                icon={Download}
                            >
                                <a href={downloadPdfUrl} download>
                                    Unduh PDF
                                </a>
                            </Button>
                        )}
                        {canShare && result.has_data && (
                            <Button
                                size="sm"
                                icon={Send}
                                onClick={() => setSendModalOpen(true)}
                            >
                                Kirim Hasil
                            </Button>
                        )}
                    </div>
                }
            />

            {!result.has_data ? (
                <Card className="mt-4">
                    <CardContent className="pt-6">
                        <EmptyState
                            icon={AlertCircle}
                            title="Belum Ada Data Penilaian"
                            description="Peserta ini belum memiliki penilai yang menyelesaikan dan mengirimkan jawaban kuesioner. Hasil assessment akan tampil secara otomatis setelah penilai melakukan submit."
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* Ringkasan Skor & Status Penilai */}
                    <ScoreCard result={result} />

                    {/* Tabs Konten */}
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 max-w-md">
                            <TabsTrigger value="overview">
                                Ringkasan
                            </TabsTrigger>
                            <TabsTrigger value="sub-dimensions">
                                Sub Dimensi
                            </TabsTrigger>
                            <TabsTrigger value="details">
                                Detail Jawaban
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab 1: Ringkasan & Grafik Utama */}
                        <TabsContent
                            value="overview"
                            className="space-y-6 pt-2"
                        >
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Diagram Radar 3 Dimensi
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Perbandingan persepsi kepemimpinan
                                            antara Diri Sendiri, Atasan,
                                            Bawahan, dan Rata-rata (Average).
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <DimensionRadarChart
                                            dimensions={result.dimensions}
                                        />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Perbandingan Skor per Dimensi
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Skor tiap role dan rata-rata
                                            (Average) per dimensi kepemimpinan
                                            (skala 1 s.d. 6).
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <RoleComparisonBarChart
                                            dimensions={result.dimensions}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Tabel Rangkuman Dimensi */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        Tabel Rangkuman Nilai Dimensi
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Rata-rata penilaian untuk setiap dimensi
                                        kepemimpinan utama beserta rata-rata
                                        keseluruhan (Average).
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto rounded-md border">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="font-semibold">
                                                        Dimensi
                                                    </TableHead>
                                                    <TableHead className="text-center">
                                                        Diri Sendiri
                                                    </TableHead>
                                                    <TableHead className="text-center">
                                                        Atasan
                                                    </TableHead>
                                                    <TableHead className="text-center">
                                                        Bawahan
                                                    </TableHead>
                                                    <TableHead className="text-center">
                                                        Rata-rata
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="bg-white dark:bg-card">
                                                {result.dimensions.map(
                                                    (dim) => (
                                                        <TableRow key={dim.id}>
                                                            <TableCell className="font-semibold">
                                                                {dim.name}
                                                            </TableCell>
                                                            <TableCell className="text-center font-medium tabular-nums text-indigo-600 dark:text-indigo-400">
                                                                {dim.scores
                                                                    .self !==
                                                                null
                                                                    ? dim.scores.self.toFixed(
                                                                          2,
                                                                      )
                                                                    : "-"}
                                                            </TableCell>
                                                            <TableCell className="text-center font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                                                                {dim.scores
                                                                    .boss !==
                                                                null
                                                                    ? dim.scores.boss.toFixed(
                                                                          2,
                                                                      )
                                                                    : "-"}
                                                            </TableCell>
                                                            <TableCell className="text-center font-medium tabular-nums text-amber-600 dark:text-amber-400">
                                                                {dim.scores
                                                                    .subordinate !==
                                                                null
                                                                    ? dim.scores.subordinate.toFixed(
                                                                          2,
                                                                      )
                                                                    : "-"}
                                                            </TableCell>
                                                            <TableCell className="text-center font-bold tabular-nums text-sky-600 dark:text-sky-400">
                                                                {dim.scores
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
                                            <TableFooter>
                                                <TableRow className="bg-muted/60 font-bold">
                                                    <TableCell className="font-bold text-foreground">
                                                        Rata-rata Keseluruhan
                                                        (Average)
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                                                        {result
                                                            .role_overall_scores
                                                            .self !== null
                                                            ? result.role_overall_scores.self.toFixed(
                                                                  2,
                                                              )
                                                            : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                                        {result
                                                            .role_overall_scores
                                                            .boss !== null
                                                            ? result.role_overall_scores.boss.toFixed(
                                                                  2,
                                                              )
                                                            : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold tabular-nums text-amber-600 dark:text-amber-400">
                                                        {result
                                                            .role_overall_scores
                                                            .subordinate !==
                                                        null
                                                            ? result.role_overall_scores.subordinate.toFixed(
                                                                  2,
                                                              )
                                                            : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold tabular-nums text-sky-600 dark:text-sky-400">
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
                        </TabsContent>

                        {/* Tab 2: Rincian Sub Dimensi */}
                        <TabsContent
                            value="sub-dimensions"
                            className="space-y-6 pt-2"
                        >
                            {result.dimensions.map((dim) => (
                                <Card key={dim.id}>
                                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <CardTitle className="text-base">
                                                Dimensi: {dim.name}
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                Perbandingan skor dan rata-rata
                                                (Average) seluruh sub-dimensi
                                                pada {dim.name}.
                                            </CardDescription>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                            <span className="rounded-md border bg-muted/40 px-2.5 py-1 font-medium text-muted-foreground">
                                                Rata-rata Dimensi:{" "}
                                                <strong className="tabular-nums text-sky-600 dark:text-sky-400">
                                                    {dim.scores.average !== null
                                                        ? dim.scores.average.toFixed(
                                                              2,
                                                          )
                                                        : "-"}
                                                </strong>
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <SubDimensionBarChart
                                            dimensionName={dim.name}
                                            subDimensions={dim.sub_dimensions}
                                        />

                                        {/* Tabel Rincian Sub-Dimensi */}
                                        <div className="overflow-x-auto rounded-md border">
                                            <Table>
                                                <TableHeader className="bg-muted/50">
                                                    <TableRow>
                                                        <TableHead className="font-semibold">
                                                            Sub-Dimensi
                                                        </TableHead>
                                                        <TableHead className="text-center">
                                                            Diri Sendiri
                                                        </TableHead>
                                                        <TableHead className="text-center">
                                                            Atasan
                                                        </TableHead>
                                                        <TableHead className="text-center">
                                                            Bawahan
                                                        </TableHead>
                                                        <TableHead className="text-center">
                                                            Rata-rata
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody className="bg-white dark:bg-card">
                                                    {dim.sub_dimensions.map(
                                                        (sd) => (
                                                            <TableRow
                                                                key={sd.id}
                                                            >
                                                                <TableCell className="font-medium">
                                                                    {sd.name}
                                                                </TableCell>
                                                                <TableCell className="text-center font-medium tabular-nums text-indigo-600 dark:text-indigo-400">
                                                                    {sd.scores
                                                                        .self !==
                                                                    null
                                                                        ? sd.scores.self.toFixed(
                                                                              2,
                                                                          )
                                                                        : "-"}
                                                                </TableCell>
                                                                <TableCell className="text-center font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                                                                    {sd.scores
                                                                        .boss !==
                                                                    null
                                                                        ? sd.scores.boss.toFixed(
                                                                              2,
                                                                          )
                                                                        : "-"}
                                                                </TableCell>
                                                                <TableCell className="text-center font-medium tabular-nums text-amber-600 dark:text-amber-400">
                                                                    {sd.scores
                                                                        .subordinate !==
                                                                    null
                                                                        ? sd.scores.subordinate.toFixed(
                                                                              2,
                                                                          )
                                                                        : "-"}
                                                                </TableCell>
                                                                <TableCell className="text-center font-bold tabular-nums text-sky-600 dark:text-sky-400">
                                                                    {sd.scores
                                                                        .average !==
                                                                    null
                                                                        ? sd.scores.average.toFixed(
                                                                              2,
                                                                          )
                                                                        : "-"}
                                                                </TableCell>
                                                            </TableRow>
                                                        ),
                                                    )}
                                                </TableBody>
                                                <TableFooter>
                                                    <TableRow className="bg-muted/60 font-bold">
                                                        <TableCell className="font-bold text-foreground">
                                                            Rata-rata {dim.name}{" "}
                                                            (Average)
                                                        </TableCell>
                                                        <TableCell className="text-center font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                                                            {dim.scores.self !==
                                                            null
                                                                ? dim.scores.self.toFixed(
                                                                      2,
                                                                  )
                                                                : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-center font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                                            {dim.scores.boss !==
                                                            null
                                                                ? dim.scores.boss.toFixed(
                                                                      2,
                                                                  )
                                                                : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-center font-bold tabular-nums text-amber-600 dark:text-amber-400">
                                                            {dim.scores
                                                                .subordinate !==
                                                            null
                                                                ? dim.scores.subordinate.toFixed(
                                                                      2,
                                                                  )
                                                                : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-center font-bold tabular-nums text-sky-600 dark:text-sky-400">
                                                            {dim.scores
                                                                .average !==
                                                            null
                                                                ? dim.scores.average.toFixed(
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
                            ))}
                        </TabsContent>

                        {/* Tab 3: Detail Jawaban Per Butir */}
                        <TabsContent value="details" className="pt-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <FileBarChart2 className="size-4 text-primary" />
                                        Rincian Jawaban per Butir Pertanyaan
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Nilai jawaban per rater untuk
                                        masing-masing pertanyaan kuesioner 360°.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <DetailedAnswersTable
                                        participantId={result.participant.id}
                                        dimensions={result.dimensions}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            {/* Dialog Kirim PDF */}
            {canShare && (
                <SendPdfDialog
                    open={sendModalOpen}
                    onOpenChange={setSendModalOpen}
                    participantId={result.participant.id}
                    participantName={result.participant.name}
                    participantEmail={result.participant.email}
                    actionUrl={sendPdfUrl}
                />
            )}
        </PageContainer>
    );
}

AssessmentResultShow.layout = {
    breadcrumbs: [
        { title: "Peserta", href: "/admin/participants" },
        { title: "Detail Hasil" },
    ],
};
