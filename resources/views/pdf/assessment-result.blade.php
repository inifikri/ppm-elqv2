<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Hasil Assessment - {{ $result['participant']['name'] }}</title>
    <style>
        @page {
            margin: 12mm 15mm;
            size: A4 portrait;
        }
        body {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #1e293b;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .title {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            margin: 0;
        }
        .subtitle {
            font-size: 11px;
            color: #64748b;
            margin: 3px 0 0 0;
        }
        .info-table {
            width: 100%;
            margin-bottom: 16px;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 4px 6px;
            font-size: 10.5px;
        }
        .info-label {
            color: #64748b;
            width: 100px;
            font-weight: bold;
        }
        .info-val {
            color: #0f172a;
        }
        .score-box-table {
            width: 100%;
            margin-bottom: 16px;
            border-collapse: separate;
            border-spacing: 8px 0;
        }
        .score-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px;
            text-align: center;
        }
        .score-num {
            font-size: 22px;
            font-weight: bold;
            color: #0284c7;
            margin: 2px 0;
        }
        .score-label {
            font-size: 9.5px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        .section-title {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-top: 14px;
            margin-bottom: 10px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            margin-bottom: 16px;
        }
        .data-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-size: 9.5px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 7px 8px;
            border: 1px solid #cbd5e1;
            text-align: center;
        }
        .data-table td {
            padding: 6px 8px;
            font-size: 10px;
            border: 1px solid #e2e8f0;
        }
        .dim-row {
            background-color: #f8fafc;
            font-weight: bold;
            color: #0f172a;
        }
        .text-center {
            text-align: center;
        }
        .text-left {
            text-align: left;
        }
        .page-break {
            page-break-before: always;
        }
        .radar-container {
            text-align: center;
            margin: 12px 0;
        }
        .footer {
            margin-top: 20px;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
        }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td style="vertical-align: middle;">
                <h1 class="title">LAPORAN HASIL ASSESSMENT 360°</h1>
                <p class="subtitle">Executive Leadership Questionnaire (ELQ)</p>
            </td>
            <td style="text-align: right; vertical-align: middle; color: #64748b; font-size: 10px;">
                Tanggal Cetak: {{ date('d F Y') }}
            </td>
        </tr>
    </table>

    <table class="info-table">
        <tr>
            <td class="info-label">Nama Peserta:</td>
            <td class="info-val"><strong>{{ $result['participant']['name'] }}</strong></td>
            <td class="info-label">Perusahaan:</td>
            <td class="info-val">{{ $result['participant']['company'] ?? '-' }}</td>
        </tr>
        <tr>
            <td class="info-label">Email:</td>
            <td class="info-val">{{ $result['participant']['email'] }}</td>
            <td class="info-label">Jabatan:</td>
            <td class="info-val">{{ $result['participant']['position'] ?? '-' }}</td>
        </tr>
    </table>

    <table class="score-box-table">
        <tr>
            <td class="score-box" style="width: 25%;">
                <div class="score-label">Skor Keseluruhan</div>
                <div class="score-num">{{ $result['overall_score'] !== null ? number_format($result['overall_score'], 2) : '-' }}</div>
                <div style="font-size: 9px; color: #94a3b8;">Skala 1.00 - 6.00</div>
            </td>
            <td class="score-box" style="width: 25%;">
                <div class="score-label">Diri Sendiri (Self)</div>
                <div class="score-num" style="color: #4f46e5;">{{ $result['role_overall_scores']['self'] !== null ? number_format($result['role_overall_scores']['self'], 2) : '-' }}</div>
                <div style="font-size: 9px; color: #94a3b8;">Status: {{ $result['answered_raters']['self']['submitted'] }}/{{ $result['answered_raters']['self']['total'] }}</div>
            </td>
            <td class="score-box" style="width: 25%;">
                <div class="score-label">Atasan (Boss)</div>
                <div class="score-num" style="color: #059669;">{{ $result['role_overall_scores']['boss'] !== null ? number_format($result['role_overall_scores']['boss'], 2) : '-' }}</div>
                <div style="font-size: 9px; color: #94a3b8;">Status: {{ $result['answered_raters']['boss']['submitted'] }}/{{ $result['answered_raters']['boss']['total'] }}</div>
            </td>
            <td class="score-box" style="width: 25%;">
                <div class="score-label">Bawahan (Subordinate)</div>
                <div class="score-num" style="color: #d97706;">{{ $result['role_overall_scores']['subordinate'] !== null ? number_format($result['role_overall_scores']['subordinate'], 2) : '-' }}</div>
                <div style="font-size: 9px; color: #94a3b8;">Status: {{ $result['answered_raters']['subordinate']['submitted'] }}/{{ $result['answered_raters']['subordinate']['total'] }}</div>
            </td>
        </tr>
    </table>

    <div class="section-title">Diagram Radar Perbandingan Dimensi Kepemimpinan</div>
    <div class="radar-container">
        {!! $radarSvg !!}
    </div>

    <div class="section-title" style="page-break-before: auto;">Rincian Skor Per Dimensi &amp; Sub-Dimensi</div>
    <table class="data-table">
        <thead>
            <tr>
                <th class="text-left" style="width: 44%;">Dimensi &amp; Sub-Dimensi</th>
                <th style="width: 14%;">Diri Sendiri</th>
                <th style="width: 14%;">Atasan</th>
                <th style="width: 14%;">Bawahan</th>
                <th style="width: 14%;">Rata-rata</th>
            </tr>
        </thead>
        <tbody>
            @foreach($result['dimensions'] as $dim)
                <tr class="dim-row">
                    <td><strong>{{ $dim['name'] }}</strong></td>
                    <td class="text-center">{{ $dim['scores']['self'] !== null ? number_format($dim['scores']['self'], 2) : '-' }}</td>
                    <td class="text-center">{{ $dim['scores']['boss'] !== null ? number_format($dim['scores']['boss'], 2) : '-' }}</td>
                    <td class="text-center">{{ $dim['scores']['subordinate'] !== null ? number_format($dim['scores']['subordinate'], 2) : '-' }}</td>
                    <td class="text-center"><strong>{{ $dim['scores']['average'] !== null ? number_format($dim['scores']['average'], 2) : '-' }}</strong></td>
                </tr>
                @foreach($dim['sub_dimensions'] as $sub)
                    <tr>
                        <td style="padding-left: 18px; color: #475569;">&bull; {{ $sub['name'] }}</td>
                        <td class="text-center">{{ $sub['scores']['self'] !== null ? number_format($sub['scores']['self'], 2) : '-' }}</td>
                        <td class="text-center">{{ $sub['scores']['boss'] !== null ? number_format($sub['scores']['boss'], 2) : '-' }}</td>
                        <td class="text-center">{{ $sub['scores']['subordinate'] !== null ? number_format($sub['scores']['subordinate'], 2) : '-' }}</td>
                        <td class="text-center">{{ $sub['scores']['average'] !== null ? number_format($sub['scores']['average'], 2) : '-' }}</td>
                    </tr>
                @endforeach
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Dokumen ini bersifat rahasia dan diterbitkan secara resmi oleh sistem Executive Leadership Questionnaire (ELQ 360).
    </div>
</body>
</html>
