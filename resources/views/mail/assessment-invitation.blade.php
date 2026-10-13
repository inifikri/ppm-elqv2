<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Undangan Penilaian Kepemimpinan 360°</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px; margin: 0; line-height: 1.6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
        <tr>
            <td style="padding: 24px 32px; background-color: #0284c7; color: #ffffff;">
                <h1 style="margin: 0; font-size: 20px; font-weight: bold;">Executive Leadership Questionnaire (ELQ)</h1>
                <p style="margin: 4px 0 0; font-size: 13px; color: #e0f2fe;">Evaluasi Kepemimpinan 360 Derajat</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 32px;">
                <p style="margin-top: 0; font-size: 15px;">Halo,</p>
                <p style="font-size: 14px; color: #334155;">
                    Anda telah didaftarkan sebagai penilai (<strong>{{ $roleLabel }}</strong>) untuk evaluasi kepemimpinan 360° rekan Anda:
                </p>
                <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 20px 0;">
                    <div style="font-size: 16px; font-weight: bold; color: #0f172a;">{{ $participant->name ?? 'Peserta' }}</div>
                    <div style="font-size: 13px; color: #64748b;">{{ $participant->email ?? '' }}</div>
                </div>
                <p style="font-size: 14px; color: #334155;">
                    Penilaian ini bertujuan untuk mendukung pengembangan kepemimpinan yang objektif dan konstruktif. Jawaban Anda bersifat rahasia dan akan digabungkan secara agregat.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="{{ $evaluationUrl }}" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">
                        Mulai Penilaian
                    </a>
                </div>
                <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
                    Jika tombol di atas tidak dapat diklik, salin dan buka tautan berikut di peramban Anda:<br>
                    <a href="{{ $evaluationUrl }}" style="color: #0284c7; word-break: break-all;">{{ $evaluationUrl }}</a>
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding: 16px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
                Email ini dikirim otomatis oleh sistem ELQ. Harap tidak membalas email ini.
            </td>
        </tr>
    </table>
</body>
</html>
