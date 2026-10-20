<?php

namespace App\Services\Reports;

use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as DomPdfWrapper;
use Illuminate\Http\Response;

class AssessmentPdfGenerator
{
    public function __construct(
        private readonly BarChartSvgRenderer $chartRenderer,
    ) {}

    /**
     * Buat wrapper DomPDF siap render dari data laporan.
     */
    public function make(AssessmentReportData $data): DomPdfWrapper
    {
        // 1. Render grafik grouped bar dimensi (SVG)
        $dimensionBarChartSvg = $this->chartRenderer->renderVerticalGroupedBarSvg(
            $data->getDimensionChartItems(),
            640,
            240
        );

        // 2. Render grafik grouped bar horizontal untuk setiap sub-dimensi
        $subDimensionCharts = [];
        foreach ($data->dimensions as $dim) {
            $subDimensionCharts[$dim['id']] = $this->chartRenderer->renderHorizontalGroupedBarSvg(
                $data->getSubDimensionChartItems($dim['id']),
                640
            );
        }

        // 3. Load view modular template laporan
        /** @var DomPdfWrapper $pdf */
        $pdf = Pdf::loadView('reports.assessment.layout', [
            'data' => $data,
            'dimensionBarChartSvg' => $dimensionBarChartSvg,
            'subDimensionCharts' => $subDimensionCharts,
        ]);

        $pdf->setPaper('a4', 'portrait');

        // Pastikan asset remote tidak dimuat (keamanan & on-premise)
        $pdf->getDomPDF()->getOptions()->setIsRemoteEnabled(false);

        return $pdf;
    }

    /**
     * Hasilkan binary string PDF (%PDF-...) dengan canvas footer penomoran halaman.
     */
    public function generateBinary(AssessmentReportData $data): string
    {
        $pdf = $this->make($data);
        $this->applyCanvasFooter($pdf);

        return $pdf->output();
    }

    /**
     * Download file PDF secara streaming langsung ke browser.
     */
    public function downloadResponse(AssessmentReportData $data, string $filename): Response
    {
        $pdf = $this->make($data);
        $this->applyCanvasFooter($pdf);

        return $pdf->download($filename);
    }

    /**
     * Suntikkan penomoran halaman "Halaman X dari Y" dan catatan kerahasiaan pada footer canvas.
     */
    private function applyCanvasFooter(DomPdfWrapper $pdf): void
    {
        $pdf->render();

        $dompdf = $pdf->getDomPDF();
        $canvas = $dompdf->getCanvas();
        $font = $dompdf->getFontMetrics()->getFont('Helvetica', 'normal');

        // Koordinat A4: lebar 595.28 pt, tinggi 841.89 pt
        // Kiri: Catatan kerahasiaan dokumen
        $canvas->page_text(
            42,
            814,
            'ELQ 360° Assessment Report — Dokumen Rahasia',
            $font,
            7.5,
            [0.45, 0.50, 0.55]
        );

        // Kanan: Penomoran halaman dinamis
        $canvas->page_text(
            475,
            814,
            'Halaman {PAGE_NUM} dari {PAGE_COUNT}',
            $font,
            7.5,
            [0.45, 0.50, 0.55]
        );
    }
}
