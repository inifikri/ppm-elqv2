@extends('mail.layouts.base')

@section('title', 'Laporan Hasil Asesmen ELQ 360° - ' . $participant->name)

@section('preheader')
Laporan hasil evaluasi kepemimpinan ELQ 360° Anda telah selesai diproses. Dokumen PDF telah dilampirkan pada email ini.
@endsection

@section('header_extra')
<span style="display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px;">
    Laporan Tersedia
</span>
@endsection

@section('content')
<div style="margin-bottom: 20px;">
    <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em;">
        Laporan Hasil Asesmen Kepemimpinan 360°
    </h1>
    <p style="margin: 0; font-size: 14px; color: #64748b;">
        Executive Leadership Questionnaire (ELQ)
    </p>
</div>

<p style="margin: 0 0 16px 0;">
    Halo <strong>{{ $recipientName ?? $participant->name }}</strong>,
</p>

<p style="margin: 0 0 20px 0;">
@if(!empty($recipientName) && $recipientName !== $participant->name)
    Berikut terlampir dokumen laporan hasil evaluasi kepemimpinan ELQ 360° untuk rekan kerja Anda, <strong>{{ $participant->name }}</strong>. Penilaian ini mengintegrasikan sudut pandang evaluasi diri bersama umpan balik konstruktif dari atasan langsung dan rekan kerja.
@else
    Laporan hasil evaluasi kepemimpinan 360 derajat Anda telah selesai diproses. Penilaian ini mengintegrasikan sudut pandang evaluasi diri Anda bersama umpan balik konstruktif dari atasan langsung dan rekan bawahan.
@endif
</p>

{{-- Ringkasan Skor & Grafik Dimensi --}}
@if(!empty($reportData) && $reportData->hasData)
    {{-- Kartu Skor Keseluruhan --}}
    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
        <tr>
            <td style="padding: 20px; text-align: center;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px;">
                    Skor Kepemimpinan Keseluruhan
                </div>
                <div style="font-size: 32px; font-weight: 800; color: #0284c7; line-height: 1;">
                    {{ $reportData->overallScore !== null ? number_format($reportData->overallScore, 2) : '-' }}
                    <span style="font-size: 14px; font-weight: 600; color: #94a3b8;">/ 6.00</span>
                </div>
                @if($reportData->overallCategory)
                    <div style="margin-top: 8px;">
                        <span style="display: inline-block; background-color: {{ $reportData->overallCategory->bgHexColor() }}; color: {{ $reportData->overallCategory->hexColor() }}; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px;">
                            {{ $reportData->overallCategory->label() }}
                        </span>
                    </div>
                @endif
                <div style="font-size: 11px; color: #64748b; margin-top: 10px; border-top: 1px dashed #e2e8f0; padding-top: 8px;">
                    Status Respon: Self ({{ $reportData->answeredRaters['self']['submitted'] }}/{{ $reportData->answeredRaters['self']['total'] }}) &bull;
                    Atasan ({{ $reportData->answeredRaters['boss']['submitted'] }}/{{ $reportData->answeredRaters['boss']['total'] }}) &bull;
                    Bawahan/Rekan ({{ $reportData->answeredRaters['subordinate']['submitted'] }}/{{ $reportData->answeredRaters['subordinate']['total'] }})
                </div>
            </td>
        </tr>
    </table>

    {{-- Grafik Perbandingan Tingkat Dimensi (Email-Safe Table Bar Chart) --}}
    <div style="margin-bottom: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #32327f; margin-bottom: 4px;">
            Grafik Perbandingan Dimensi Kepemimpinan
        </div>
        <div style="font-size: 12px; color: #64748b; margin-bottom: 16px;">
            Rata-rata skor per dimensi (skala 1.00 – 6.00):
        </div>

        @foreach($reportData->dimensions as $dim)
            @php
                $avg = $dim['scores']['average'] ?? 0;
                $pct = $avg ? min(100, max(0, (int) round(($avg / 6) * 100))) : 0;
                $remain = 100 - $pct;
            @endphp
            <div style="margin-bottom: 16px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 4px;">
                    <tr>
                        <td align="left" style="font-size: 13px; font-weight: 700; color: #0f172a;">
                            {{ $dim['name'] }}
                        </td>
                        <td align="right" style="font-size: 13px; font-weight: 700; color: #0284c7;">
                            {{ $avg ? number_format($avg, 2) : '-' }} <span style="font-size: 11px; font-weight: 400; color: #94a3b8;">/ 6.00</span>
                        </td>
                    </tr>
                </table>

                {{-- Batang Progres Horizontal --}}
                <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f1f5f9; border-radius: 6px; overflow: hidden; height: 14px; line-height: 14px; margin-bottom: 6px;">
                    <tr>
                        @if($pct > 0)
                            <td width="{{ $pct }}%" style="background-color: #0284c7; height: 14px; font-size: 1px; line-height: 1px; border-radius: 6px;">&nbsp;</td>
                        @endif
                        @if($remain > 0)
                            <td width="{{ $remain }}%" style="height: 14px; font-size: 1px; line-height: 1px;">&nbsp;</td>
                        @endif
                    </tr>
                </table>

                {{-- Breakdown Penilai --}}
                <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="font-size: 11px; color: #64748b;">
                    <tr>
                        <td style="padding: 2px 0;">
                            <span style="display: inline-block; width: 8px; height: 8px; background-color: #64748b; border-radius: 2px; margin-right: 4px;"></span>
                            Self: <strong style="color: #334155;">{{ $dim['scores']['self'] !== null ? number_format($dim['scores']['self'], 2) : '-' }}</strong>
                        </td>
                        <td style="padding: 2px 0; text-align: center;">
                            <span style="display: inline-block; width: 8px; height: 8px; background-color: #0d9488; border-radius: 2px; margin-right: 4px;"></span>
                            Atasan: <strong style="color: #334155;">{{ $dim['scores']['boss'] !== null ? number_format($dim['scores']['boss'], 2) : '-' }}</strong>
                        </td>
                        <td style="padding: 2px 0; text-align: right;">
                            <span style="display: inline-block; width: 8px; height: 8px; background-color: #d97706; border-radius: 2px; margin-right: 4px;"></span>
                            Bawahan/Rekan: <strong style="color: #334155;">{{ $dim['scores']['subordinate'] !== null ? number_format($dim['scores']['subordinate'], 2) : '-' }}</strong>
                        </td>
                    </tr>
                </table>
            </div>
        @endforeach

        {{-- Legenda Warna --}}
        <div style="border-top: 1px dashed #e2e8f0; padding-top: 10px; margin-top: 12px; font-size: 10.5px; color: #64748b; text-align: center;">
            <span style="margin: 0 6px;">
                <span style="display: inline-block; width: 8px; height: 8px; background-color: #32327f; border-radius: 2px; margin-right: 3px;"></span> Rata-rata
            </span>
            <span style="margin: 0 6px;">
                <span style="display: inline-block; width: 8px; height: 8px; background-color: #64748b; border-radius: 2px; margin-right: 3px;"></span> Diri Sendiri
            </span>
            <span style="margin: 0 6px;">
                <span style="display: inline-block; width: 8px; height: 8px; background-color: #0d9488; border-radius: 2px; margin-right: 3px;"></span> Atasan
            </span>
            <span style="margin: 0 6px;">
                <span style="display: inline-block; width: 8px; height: 8px; background-color: #d97706; border-radius: 2px; margin-right: 3px;"></span> Bawahan/Rekan
            </span>
        </div>
    </div>
@endif

{{-- Info Lampiran PDF Card --}}
<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
    <tr>
        <td style="padding: 18px 20px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px;">
                Dokumen Lampiran
            </div>
            <div style="font-size: 15px; font-weight: 700; color: #0f172a;">
                &#128196; {{ $filename ?? ('ELQ-Result_' . \Illuminate\Support\Str::slug($participant->name) . '_' . now()->format('Ymd') . '.pdf') }}
            </div>
            <div style="font-size: 13px; color: #475569; margin-top: 4px; line-height: 1.5;">
                File ringkasan lengkap dalam format PDF telah dilampirkan pada email ini untuk Anda simpan dan pelajari.
            </div>
        </td>
    </tr>
</table>

{{-- Rekomendasi Langkah Lanjutan --}}
<div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.5; color: #166534;">
    <strong style="color: #15803d;">Rekomendasi Tindak Lanjut:</strong><br>
    Gunakan hasil evaluasi ini sebagai rujukan reflektif untuk mengidentifikasi area kekuatan kepemimpinan serta peluang pengembangan diri ke depan.
</div>

<p style="margin: 0 0 24px 0;">
    Anda juga dapat mengakses dashboard peserta untuk meninjau status dan perkembangan asesmen Anda secara langsung melalui tombol di bawah ini:
</p>

{{-- Call To Action Button --}}
<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 28px;">
    <tr>
        <td align="center">
            <a href="{{ url('/dashboard') }}" class="btn-action" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 10px; font-size: 14px; font-weight: 600; display: inline-block; letter-spacing: 0.01em;">
                Buka Dashboard Asesmen &rarr;
            </a>
        </td>
    </tr>
</table>

{{-- Fallback URL Box --}}
<div style="border-top: 1px dashed #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b; line-height: 1.5;">
    <p style="margin: 0 0 6px 0;">
        Jika tombol di atas tidak dapat diklik, salin dan buka tautan berikut di peramban Anda:
    </p>
    <a href="{{ url('/dashboard') }}" style="color: #0284c7; text-decoration: underline; word-break: break-all; font-size: 11px;">
        {{ url('/dashboard') }}
    </a>
</div>
@endsection
