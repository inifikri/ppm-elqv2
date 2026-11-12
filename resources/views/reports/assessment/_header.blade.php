{{-- Kop Surat Resmi PPM Manajemen --}}
<table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
    <tr>
        <td style="width: 28%; vertical-align: middle; padding-bottom: 8px;">
            @if(file_exists(public_path('image/Logo-PPM-01.png')))
                <img src="{{ public_path('image/Logo-PPM-01.png') }}" style="width: 140px; height: auto;" alt="PPM Manajemen">
            @endif
        </td>
        <td style="width: 72%; vertical-align: middle; text-align: right; padding-bottom: 8px;">
            <div style="font-size: 13pt; font-weight: bold; color: #32327f; letter-spacing: 0.8px; line-height: 1.2;">
                PPM MANAJEMEN
            </div>
            <div style="font-size: 8pt; font-weight: bold; color: #475569; margin-top: 1px; letter-spacing: 0.3px;">
                Pusat Pengembangan Manajemen
            </div>
            <div style="font-size: 7pt; color: #64748b; margin-top: 3px; line-height: 1.35;">
                Jl. Menteng Raya No. 9, Jakarta Pusat 10340, Indonesia<br>
                Telp: (021) 2300313 &bull; Fax: (021) 2302051 &bull; Email: info@ppm-manajemen.ac.id &bull; Website: www.ppm-manajemen.ac.id
            </div>
        </td>
    </tr>
</table>

{{-- Garis Ganda Pembatas Kop Surat --}}
<div style="border-top: 2.5px solid #32327f; margin-top: 2px; margin-bottom: 2px;"></div>
<div style="border-top: 0.8px solid #32327f; margin-bottom: 14px;"></div>

{{-- Judul Laporan Hasil Asesmen --}}
<div style="text-align: center; margin-bottom: 12px;">
    <h1 style="font-size: 13.5pt; font-weight: bold; color: #32327f; letter-spacing: 0.6px; text-transform: uppercase; margin: 0 0 2px 0;">
        LAPORAN HASIL ASESMEN KEPEMIMPINAN 360°
    </h1>
    <p style="font-size: 9pt; color: #475569; font-weight: bold; letter-spacing: 0.4px; margin: 0;">
        EXECUTIVE LEADERSHIP QUESTIONNAIRE (ELQ)
    </p>
</div>

{{-- Informasi Profil Peserta (Ringkas, Proporsional, Kelas Manajer) --}}
<table style="width: 100%; margin-bottom: 12px; font-size: 8.5pt; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; border-collapse: collapse;">
    <tr>
        <td style="padding: 5px 8px; width: 15%; color: #64748b; font-weight: bold; border: 1px solid #e2e8f0;">Nama Lengkap</td>
        <td style="padding: 5px 8px; width: 35%; color: #0f172a; font-weight: bold; border: 1px solid #e2e8f0;">: {{ $data->participant['name'] }}</td>
        <td style="padding: 5px 8px; width: 15%; color: #64748b; font-weight: bold; border: 1px solid #e2e8f0;">Perusahaan</td>
        <td style="padding: 5px 8px; width: 35%; color: #0f172a; border: 1px solid #e2e8f0;">: {{ $data->participant['company'] ?: '-' }}</td>
    </tr>
    <tr>
        <td style="padding: 5px 8px; color: #64748b; font-weight: bold; border: 1px solid #e2e8f0;">Jabatan</td>
        <td style="padding: 5px 8px; color: #0f172a; border: 1px solid #e2e8f0;">: {{ $data->participant['position'] ?: '-' }}</td>
        <td style="padding: 5px 8px; color: #64748b; font-weight: bold; border: 1px solid #e2e8f0;">Email</td>
        <td style="padding: 5px 8px; color: #0f172a; border: 1px solid #e2e8f0;">: {{ $data->participant['email'] }}</td>
    </tr>
    <tr>
        <td style="padding: 5px 8px; color: #64748b; font-weight: bold; border: 1px solid #e2e8f0;">No. Telepon/HP</td>
        <td style="padding: 5px 8px; color: #0f172a; border: 1px solid #e2e8f0;">: {{ $data->participant['phone'] ?: '-' }}</td>
        <td style="padding: 5px 8px; color: #64748b; font-weight: bold; border: 1px solid #e2e8f0;">Status Respon</td>
        <td style="padding: 5px 8px; color: #0f172a; border: 1px solid #e2e8f0;">: {{ $data->answeredRaters['total_submitted'] }} / {{ $data->answeredRaters['total_raters'] }} responden telah berpartisipasi</td>
    </tr>
</table>
