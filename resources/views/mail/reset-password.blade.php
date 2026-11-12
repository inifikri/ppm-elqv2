@extends('mail.layouts.base')

@section('title', 'Permintaan Atur Ulang Password - ELQ 360°')

@section('preheader')
Instruksi pengaturan ulang kata sandi akun ELQ 360° Anda. Tautan ini berlaku selama {{ $count ?? 60 }} menit.
@endsection

@section('header_extra')
<span style="display: inline-block; background-color: #fef3c7; color: #b45309; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px;">
    Keamanan Akun
</span>
@endsection

@section('content')
<div style="margin-bottom: 20px;">
    <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em;">
        Atur Ulang Kata Sandi
    </h1>
    <p style="margin: 0; font-size: 14px; color: #64748b;">
        Instruksi pembaruan kredensial akses akun ELQ 360°
    </p>
</div>

<p style="margin: 0 0 16px 0;">
    Halo <strong>{{ $user->name ?? 'Pengguna' }}</strong>,
</p>

<p style="margin: 0 0 24px 0;">
    Kami menerima permintaan untuk mengatur ulang kata sandi akun ELQ 360° yang terdaftar dengan alamat email ini. Silakan klik tombol di bawah untuk membuat kata sandi baru Anda:
</p>

{{-- Call To Action Button --}}
<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
    <tr>
        <td align="center">
            <a href="{{ $resetUrl }}" class="btn-action" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 10px; font-size: 14px; font-weight: 600; display: inline-block; letter-spacing: 0.01em;">
                Atur Ulang Password Saya &rarr;
            </a>
        </td>
    </tr>
</table>

{{-- Peringatan Keamanan & Expire Box --}}
<div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.5; color: #92400e;">
    <strong style="color: #b45309;">Informasi Keamanan:</strong><br>
    Tautan atur ulang kata sandi ini hanya berlaku selama <strong>{{ $count ?? 60 }} menit</strong>. Jika Anda tidak pernah meminta pengaturan ulang kata sandi, Anda dapat mengabaikan email ini dengan aman &mdash; akun dan kata sandi Anda tetap terlindungi.
</div>

{{-- Fallback URL Box --}}
<div style="border-top: 1px dashed #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b; line-height: 1.5;">
    <p style="margin: 0 0 6px 0;">
        Jika tombol di atas tidak dapat diklik, salin dan buka tautan berikut di peramban Anda:
    </p>
    <a href="{{ $resetUrl }}" style="color: #0284c7; text-decoration: underline; word-break: break-all; font-size: 11px;">
        {{ $resetUrl }}
    </a>
</div>
@endsection
