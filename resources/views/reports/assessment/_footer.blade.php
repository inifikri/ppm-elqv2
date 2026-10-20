<div class="page-break">
    <div class="section-header">
        <div class="section-title">PANDUAN INTERPRETASI HASIL ASESMEN</div>
    </div>

    {{-- 1. Legenda Kategori Efektivitas Kepemimpinan --}}
    <div style="font-size: 9pt; font-weight: bold; color: #334155; margin-top: 10px; margin-bottom: 6px; text-transform: uppercase;">
        1. Kategori Efektivitas Kepemimpinan (ELQ Effectiveness Category)
    </div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 15%;">Rentang Skor</th>
                <th style="width: 25%;">Kategori</th>
                <th style="width: 60%; text-align: left;">Deskripsi &amp; Interpretasi</th>
            </tr>
        </thead>
        <tbody>
            @foreach(\App\Enums\EffectivenessCategory::cases() as $idx => $cat)
                <tr class="{{ $idx % 2 === 1 ? 'zebra' : '' }}">
                    <td class="text-center font-bold" style="color: #0f172a;">
                        {{ $cat->scoreRange() }}
                    </td>
                    <td class="text-center">
                        <span class="badge" style="background-color: {{ $cat->bgHexColor() }}; color: {{ $cat->hexColor() }};">
                            {{ $cat->label() }}
                        </span>
                    </td>
                    <td style="color: #334155; font-size: 8pt; line-height: 1.35;">
                        {{ $cat->description() }}
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    {{-- 2. Keterangan Skala Jawaban Kuesioner (1-6) --}}
    <div style="font-size: 9pt; font-weight: bold; color: #334155; margin-top: 16px; margin-bottom: 6px; text-transform: uppercase;">
        2. Keterangan Skala Penilaian Kuesioner (Skala Likert 1 – 6)
    </div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 10%;">Skala</th>
                <th style="width: 25%;">Predikat</th>
                <th style="width: 65%; text-align: left;">Makna Operasional</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="text-center font-bold">1</td>
                <td class="font-bold">Sangat Jarang</td>
                <td>Perilaku kepemimpinan hampir tidak pernah ditampilkan dalam situasi kerja sehari-hari.</td>
            </tr>
            <tr class="zebra">
                <td class="text-center font-bold">2</td>
                <td class="font-bold">Jarang</td>
                <td>Perilaku kepemimpinan sesekali tampak, namun belum menjadi kebiasaan konsisten.</td>
            </tr>
            <tr>
                <td class="text-center font-bold">3</td>
                <td class="font-bold">Cukup Sering</td>
                <td>Perilaku kepemimpinan muncul dalam frekuensi moderat, namun belum konsisten di semua situasi.</td>
            </tr>
            <tr class="zebra">
                <td class="text-center font-bold">4</td>
                <td class="font-bold">Sering</td>
                <td>Perilaku kepemimpinan sudah terbiasa ditampilkan dan dapat diamati secara berkala oleh lingkungan kerja.</td>
            </tr>
            <tr>
                <td class="text-center font-bold">5</td>
                <td class="font-bold">Sangat Sering</td>
                <td>Perilaku kepemimpinan ditampilkan secara rutin, konsisten, dan efektif dalam berbagai dinamika organisasi.</td>
            </tr>
            <tr class="zebra">
                <td class="text-center font-bold">6</td>
                <td class="font-bold">Selalu</td>
                <td>Perilaku kepemimpinan mendarah daging, konsisten tanpa putus, dan menjadi teladan bagi rekan kerja.</td>
            </tr>
        </tbody>
    </table>

    {{-- 3. Pernyataan Kerahasiaan & Disclaimer --}}
    <div style="margin-top: 24px; padding: 12px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 8pt; color: #475569; line-height: 1.45;">
        <strong style="color: #0f172a; display: block; margin-bottom: 4px;">CATATAN KERAHASIAAN (CONFIDENTIALITY NOTICE):</strong>
        Laporan hasil asesmen kepemimpinan 360° ini bersifat <strong>SANGAT RAHASIA</strong> dan diterbitkan secara otomatis oleh sistem <strong>Effective Leadership Questionnaire (ELQ)</strong>. Laporan ini ditujukan semata-mata untuk pengembangan pribadi peserta yang dinilai serta pembinaan pimpinan organisasi. Dilarang menggandakan, menyebarluaskan, atau mempublikasikan sebagian atau seluruh isi dokumen ini tanpa izin resmi tertulis.
    </div>
</div>
