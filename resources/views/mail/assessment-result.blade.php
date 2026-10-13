<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Hasil Assessment ELQ 360</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.6;
            color: #334155;
            background-color: #f8fafc;
            margin: 0;
            padding: 24px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            padding: 32px;
            border: 1px solid #e2e8f0;
        }
        .header {
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 16px;
            margin-bottom: 24px;
        }
        .header h1 {
            font-size: 20px;
            color: #0f172a;
            margin: 0 0 6px 0;
        }
        .footer {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Laporan Hasil Assessment ELQ 360</h1>
            <p style="margin: 0; color: #64748b; font-size: 14px;">Executive Leadership Questionnaire</p>
        </div>

        <p>Halo <strong>{{ $participant->name }}</strong>,</p>

        <p>Laporan hasil evaluasi assessment 360° kepemimpinan Anda telah selesai diproses oleh Administrator.</p>

        <p>File ringkasan hasil dalam format PDF telah dilampirkan pada email ini untuk Anda pelajari.</p>

        <p>Semoga hasil evaluasi ini dapat menjadi rujukan berharga bagi pengembangan kepemimpinan Anda ke depan.</p>

        <div class="footer">
            <p style="margin: 0;">Email ini dikirim secara otomatis oleh sistem ELQ 360 Assessment. Harap tidak membalas langsung ke alamat email ini.</p>
        </div>
    </div>
</body>
</html>
