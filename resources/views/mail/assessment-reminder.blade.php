@extends('mail.layouts.base')

@section('title', '[Pengingat] Penilaian Kepemimpinan 360° - ' . ($participant->name ?? 'Rekan Kerja'))

@section('preheader')
Pengingat pengisian evaluasi kepemimpinan 360° untuk {{ $participant->name ?? 'rekan kerja Anda' }}. Mohon kesediaan meluangkan waktu sejenak untuk menyelesaikan penilaian.
@endsection

@section('header_extra')
@php
    $isBoss = str_contains(strtolower($roleLabel), 'atasan');
    $badgeBg = $isBoss ? '#ede9fe' : '#e0f2fe';
    $badgeColor = $isBoss ? '#6d28d9' : '#0369a1';
@endphp
<span style="display: inline-block; background-color: {{ $badgeBg }}; color: {{ $badgeColor }}; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px;">
    {{ $roleLabel }}
</span>
@endsection

@section('content')
<div style="margin-bottom: 20px;">
    <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em;">
        Pengingat Penilaian Kepemimpinan
    </h1>
    <p style="margin: 0; font-size: 14px; color: #64748b;">
        Evaluasi multi-rater untuk pengembangan kompetensi kepemimpinan.
    </p>
</div>

<p style="margin: 0 0 16px 0;">
    Yth. Bapak/Ibu Penilai,
</p>

<p style="margin: 0 0 20px 0;">
    Semoga Bapak/Ibu senantiasa dalam keadaan sehat dan lancar dalam menjalankan aktivitas.
</p>

<p style="margin: 0 0 20px 0;">
    Melalui pesan ini, kami menyampaikan pengingat terkait pelaksanaan evaluasi kepemimpinan <strong>Executive Leadership Questionnaire (ELQ) 360°</strong>. Berdasarkan catatan sistem kami, Bapak/Ibu telah terdaftar sebagai penilai (<strong>{{ $roleLabel }}</strong>) untuk rekan kerja berikut:
</p>

{{-- Kartu Asesi / Peserta --}}
<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
    <tr>
        <td style="padding: 16px 20px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px;">
                Peserta / Asesi yang Dinilai
            </div>
            <div style="font-size: 16px; font-weight: 700; color: #0f172a;">
                {{ $participant->name ?? 'Peserta Asesmen' }}
            </div>
            <div style="font-size: 13px; color: #475569; margin-top: 2px;">
                {{ $participant->email ?? '-' }}
            </div>
            @if(!empty($participant->participantProfile?->position) || !empty($participant->participantProfile?->company?->name))
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                    {{ $participant->participantProfile?->position ?? '' }}
                    @if(!empty($participant->participantProfile?->position) && !empty($participant->participantProfile?->company?->name)) &bull; @endif
                    {{ $participant->participantProfile?->company?->name ?? '' }}
                </div>
            @endif
        </td>
    </tr>
</table>

{{-- Informasi Anonimitas & Kerahasiaan --}}
@if(!$isBoss)
    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.5; color: #065f46;">
        <strong style="color: #047857;">Jaminan Kerahasiaan &amp; Anonimitas:</strong><br>
        Seluruh tanggapan dan penilaian rekan bawahan bersifat rahasia dan diagregasikan. Sistem tidak menampilkan identitas individual maupun rincian skor perorangan kepada peserta.
    </div>
@else
    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.5; color: #0369a1;">
        <strong style="color: #0284c7;">Catatan Atasan Langsung:</strong><br>
        Umpan balik objektif Anda sangat berharga untuk memetakan capaian efektivitas kepemimpinan peserta secara akurat dan komprehensif.
    </div>
@endif

<p style="margin: 0 0 20px 0;">
    Kami sangat mengharapkan kesediaan Bapak/Ibu untuk meluangkan waktu sejenak (sekitar 10–15 menit) guna mengisi kuesioner yang terdiri dari {{ $questionCount ?? 39 }} butir pertanyaan skala 1–6 sebelum batas waktu penutupan evaluasi.
</p>

<p style="margin: 0 0 24px 0;">
    Bapak/Ibu dapat langsung melanjutkan pengisian penilaian melalui tombol tautan aman di bawah ini tanpa perlu proses pendaftaran akun:
</p>

{{-- Call To Action Button --}}
<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 28px;">
    <tr>
        <td align="center">
            <a href="{{ $evaluationUrl }}" class="btn-action" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 10px; font-size: 14px; font-weight: 600; display: inline-block; letter-spacing: 0.01em;">
                Lanjutkan Penilaian Kepemimpinan &rarr;
            </a>
        </td>
    </tr>
</table>

<p style="margin: 0 0 24px 0; font-size: 13px; color: #64748b; line-height: 1.6;">
    Atas perhatian, waktu, dan partisipasi berharga yang Bapak/Ibu berikan dalam mendukung pengembangan kepemimpinan ini, kami ucapkan terima kasih.
</p>

{{-- Fallback URL Box --}}
<div style="border-top: 1px dashed #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b; line-height: 1.5;">
    <p style="margin: 0 0 6px 0;">
        Jika tombol di atas mengalami kendala saat diklik, salin dan tempelkan tautan aman berikut pada peramban web Anda:
    </p>
    <a href="{{ $evaluationUrl }}" style="color: #0284c7; text-decoration: underline; word-break: break-all; font-size: 11px;">
        {{ $evaluationUrl }}
    </a>
</div>
@endsection
