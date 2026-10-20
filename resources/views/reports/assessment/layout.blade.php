<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Hasil Asesmen ELQ - {{ $data->participant['name'] }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 15mm 15mm 20mm 15mm;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #1e293b;
            margin: 0;
            padding: 0;
        }

        /* Tipografi & Warna */
        h1, h2, h3, h4 {
            color: #0f172a;
            margin: 0;
            font-weight: bold;
        }

        .text-primary { color: #1e40af; }
        .text-muted { color: #64748b; font-size: 8.5pt; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }

        /* Utilitas Page Break */
        .page-break {
            page-break-before: always;
        }
        .page-break-avoid {
            page-break-inside: avoid;
        }

        /* Tabel Standar Dompdf */
        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            display: table-header-group;
        }

        tr {
            page-break-inside: avoid;
        }

        /* Gaya Data Table */
        .data-table {
            width: 100%;
            margin-top: 8px;
            margin-bottom: 14px;
            border-collapse: collapse;
            font-size: 8.5pt;
        }

        .data-table th {
            background-color: #1e40af;
            color: #ffffff;
            font-size: 8pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            padding: 6px 7px;
            border: 1px solid #1e3a8a;
            text-align: center;
        }

        .data-table td {
            padding: 5px 7px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
        }

        .data-table tr.zebra {
            background-color: #f8fafc;
        }

        .data-table tr.subtotal-row {
            background-color: #f1f5f9;
            font-weight: bold;
            color: #0f172a;
            border-top: 1.5px solid #94a3b8;
            border-bottom: 1.5px solid #94a3b8;
        }

        /* Badge Kategori */
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 7.5pt;
            font-weight: bold;
            text-align: center;
        }

        /* Section Heading */
        .section-header {
            border-bottom: 2px solid #1e40af;
            padding-bottom: 5px;
            margin-top: 16px;
            margin-bottom: 10px;
        }

        .section-title {
            font-size: 12pt;
            color: #1e40af;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Box Kartu Skor */
        .score-card-table {
            width: 100%;
            margin-bottom: 14px;
            border-collapse: separate;
            border-spacing: 6px 0;
        }

        .score-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 10px;
            text-align: center;
            vertical-align: top;
        }

        .score-card-main {
            background-color: #eff6ff;
            border: 1.5px solid #bfdbfe;
        }

        .score-big {
            font-size: 20pt;
            font-weight: bold;
            color: #1e40af;
            margin: 2px 0;
        }

        .score-title {
            font-size: 8pt;
            color: #64748b;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>

    {{-- 1. Halaman Utama: Header, Profil Peserta, Skor Keseluruhan & Status --}}
    @include('reports.assessment._header')
    @include('reports.assessment._summary')

    {{-- 2. Grafik Bar Dimensi & Tabel Rekapitulasi Dimensi --}}
    @include('reports.assessment._dimension_chart')
    @include('reports.assessment._dimension_table')

    {{-- 3. Rincian per Dimensi (Grafik Horizontal Sub-Dimensi & Tabel Lengkap 39 Pertanyaan) --}}
    @include('reports.assessment._dimension_detail')

    {{-- 4. Halaman Penutup: Legenda Kategori, Skala & Kerahasiaan --}}
    @include('reports.assessment._footer')

</body>
</html>
