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
    Halo <strong>{{ $participant->name }}</strong>,
</p>

<p style="margin: 0 0 20px 0;">
    Laporan hasil evaluasi kepemimpinan 360 derajat Anda telah selesai diproses. Penilaian ini mengintegrasikan sudut pandang evaluasi diri Anda bersama umpan balik konstruktif dari atasan langsung dan rekan bawahan.
</p>

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
