@extends('mail.layouts.base')

@section('title', 'Verifikasi Alamat Email - ELQ 360°')

@section('preheader')
Selesaikan verifikasi alamat email Anda untuk mulai mengakses asesmen kepemimpinan ELQ 360°.
@endsection

@section('header_extra')
<span style="display: inline-block; background-color: #ccfbf1; color: #0f766e; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px;">
    Aktivasi Akun
</span>
@endsection

@section('content')
<div style="margin-bottom: 20px;">
    <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em;">
        Verifikasi Alamat Email Anda
    </h1>
    <p style="margin: 0; font-size: 14px; color: #64748b;">
        Satu langkah lagi untuk mengaktifkan akun asesmen ELQ 360°
    </p>
</div>

<p style="margin: 0 0 16px 0;">
    Halo <strong>{{ $user->name ?? 'Peserta' }}</strong>,
</p>

<p style="margin: 0 0 24px 0;">
    Terima kasih telah melakukan pendaftaran di sistem <strong>Executive Leadership Questionnaire (ELQ) 360°</strong>. Untuk memastikan keabsahan dan keamanan akun Anda, silakan konfirmasi kepemilikan alamat email dengan mengklik tombol berikut:
</p>

{{-- Call To Action Button --}}
<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
    <tr>
        <td align="center">
            <a href="{{ $verificationUrl }}" class="btn-action" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 10px; font-size: 14px; font-weight: 600; display: inline-block; letter-spacing: 0.01em;">
                Verifikasi Email Saya &rarr;
            </a>
        </td>
    </tr>
</table>

{{-- Info Langkah Selanjutnya --}}
<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
    <tr>
        <td style="padding: 16px 20px; font-size: 13px; color: #475569; line-height: 1.5;">
            <strong style="color: #0f172a;">Langkah Selanjutnya Setelah Verifikasi:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #64748b;">
                <li>Login ke dashboard peserta ELQ 360°.</li>
                <li>Mendaftarkan formasi penilai (1 Atasan Langsung &amp; 3 Rekan Bawahan).</li>
                <li>Mengisi kuesioner asesmen mandiri (Self-Assessment).</li>
            </ul>
        </td>
    </tr>
</table>

{{-- Fallback URL Box --}}
<div style="border-top: 1px dashed #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b; line-height: 1.5;">
    <p style="margin: 0 0 6px 0;">
        Jika tombol di atas tidak dapat diklik, salin dan buka tautan berikut di peramban Anda:
    </p>
    <a href="{{ $verificationUrl }}" style="color: #0284c7; text-decoration: underline; word-break: break-all; font-size: 11px;">
        {{ $verificationUrl }}
    </a>
</div>
@endsection
