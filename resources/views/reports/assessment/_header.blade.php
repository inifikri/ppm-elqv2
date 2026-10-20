<table style="width: 100%; border-bottom: 2.5px solid #1e40af; padding-bottom: 10px; margin-bottom: 12px;">
    <tr>
        <td style="vertical-align: middle; width: 68%;">
            <h1 style="font-size: 16pt; color: #1e40af; margin: 0; letter-spacing: 0.5px;">LAPORAN HASIL ASESMEN 360°</h1>
            <p style="font-size: 9.5pt; color: #475569; margin: 3px 0 0 0; font-weight: bold;">
                Executive Leadership Questionnaire (ELQ)
            </p>
        </td>
        <td style="text-align: right; vertical-align: middle; width: 32%;">
            <div style="font-size: 8pt; color: #64748b;">Tanggal Cetak:</div>
            <div style="font-size: 9pt; font-weight: bold; color: #0f172a;">{{ $data->printedAt }}</div>
        </td>
    </tr>
</table>

{{-- Informasi Profil Peserta --}}
<table style="width: 100%; margin-bottom: 12px; font-size: 9pt; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
    <tr>
        <td style="padding: 6px 10px; width: 14%; color: #64748b; font-weight: bold;">Nama Lengkap</td>
        <td style="padding: 6px 10px; width: 36%; color: #0f172a; font-weight: bold;">: {{ $data->participant['name'] }}</td>
        <td style="padding: 6px 10px; width: 14%; color: #64748b; font-weight: bold;">Perusahaan</td>
        <td style="padding: 6px 10px; width: 36%; color: #0f172a;">: {{ $data->participant['company'] }}</td>
    </tr>
    <tr>
        <td style="padding: 6px 10px; color: #64748b; font-weight: bold;">Jabatan</td>
        <td style="padding: 6px 10px; color: #0f172a;">: {{ $data->participant['position'] }}</td>
        <td style="padding: 6px 10px; color: #64748b; font-weight: bold;">Email</td>
        <td style="padding: 6px 10px; color: #0f172a;">: {{ $data->participant['email'] }}</td>
    </tr>
    <tr>
        <td style="padding: 6px 10px; color: #64748b; font-weight: bold;">No. Telepon/HP</td>
        <td style="padding: 6px 10px; color: #0f172a;">: {{ $data->participant['phone'] }}</td>
        <td style="padding: 6px 10px; color: #64748b; font-weight: bold;">Total Penilai</td>
        <td style="padding: 6px 10px; color: #0f172a;">: {{ $data->answeredRaters['total_submitted'] }} / {{ $data->answeredRaters['total_raters'] }} responden telah berpartisipasi</td>
    </tr>
</table>
