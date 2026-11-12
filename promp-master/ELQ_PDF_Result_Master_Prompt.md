# ELQ — Master Prompt: Pengembangan Format PDF Hasil Asesmen (Download & Kirim Email)

## 0. ROLE

Kamu adalah senior Laravel engineer + report/PDF engineer + data-visualization engineer.
Kamu bekerja di **project Laravel 13 yang sudah berjalan** (ELQ PPM Management 360). Modul hasil asesmen dan PDF **sudah ada**. Tugasmu adalah **memperbaiki dan mengembangkan**, BUKAN membuat ulang dari nol.

## 1. SCOPE (KETAT)

**Dalam scope:**
- Template/format PDF hasil asesmen.
- Aksi **Download PDF** (FR-022) dan **Kirim PDF via email** (FR-021).
- Perhitungan data yang dibutuhkan laporan (via `ScoreCalculator` yang sudah ada).
- Render grafik server-side untuk PDF.
- Test Pest untuk bagian di atas.

**Di luar scope (JANGAN disentuh):** auth, master data, assessment form, dashboard, RBAC, modul DISC, UI halaman lain, migrasi data.

## 2. FAKTA DARI DOKUMEN PROJECT (jangan dilanggar)

- Stack: Laravel 13, PHP 8.3, MySQL 8.4, `barryvdh/laravel-dompdf`, Laravel Mail + Queue (driver database), `spatie/laravel-activitylog`, Pest.
- Skala jawaban 1–6; 39 pertanyaan; hierarki Dimension (Task, People, Change oriented) → Sub Dimension → Question.
- Penilai: Self, Atasan (1), Bawahan (3). Hanya assessment yang sudah `submitted_at` terisi yang dihitung.
- Nilai **dihitung saat dibutuhkan, tidak disimpan** (FR-017). Logika skor ada di `ScoreCalculator`/Action class, **bukan di controller**.
- **PDF dibuat saat dibutuhkan dan tidak disimpan di server** (Bagian 8 dokumen v2.1).
- PDF dikirim **hanya ke email terdaftar milik peserta yang dinilai** (Q-3), lewat **queue**.
- Pengiriman dicatat di `email_logs` (status queued/sent/failed, attempts, error) dan `activity_log`. Isi email, lampiran, dan signed URL **tidak disimpan**. Nilai jawaban, password, token, isi PDF **tidak boleh masuk log** (FR-044, FR-047).
- Admin-only: lihat hasil, download, kirim PDF. Otorisasi wajib server-side (permission/policy).
- **Risiko R-1:** Chart.js tidak berjalan di dompdf/worker tanpa browser → grafik PDF **wajib dirender server-side** (SVG atau gambar dari PHP).
- Tanpa raw query dari input user; Blade escaping `{{ }}`; CSRF aktif.

## 3. LANGKAH PERTAMA: AUDIT MODUL YANG ADA

Sebelum menulis kode, inspeksi dan ringkas singkat (maks 15 baris):

1. Route, controller, dan policy untuk download/kirim PDF hasil.
2. Blade view PDF yang ada, dan konfigurasi dompdf (`config/dompdf.php`, font, DPI, `isRemoteEnabled`).
3. `ScoreCalculator` / service perhitungan: input, output, dan apakah sudah mengembalikan nilai per dimensi, sub dimensi, **per pertanyaan**, per tipe penilai.
4. Mailable, Job, dan pencatatan `email_logs` untuk kirim PDF.
5. Test Pest yang sudah ada terkait modul ini.
6. Cara grafik saat ini dirender di PDF (jika ada).

Tentukan: apa yang dipakai ulang, direfactor, dan ditambah. **Jangan menimpa fungsi yang sudah berjalan tanpa alasan.** Perubahan harus inkremental dan bisa di-rollback (commit per langkah).

## 4. SPESIFIKASI KONTEN PDF

Urutan bagian laporan:

### 4.1 Halaman Awal — Informasi Peserta & Ringkasan
- Header: logo/nama ELQ (Effective Leadership Questionnaire), judul "Laporan Hasil Asesmen", tanggal cetak.
- **Informasi Peserta:** Nama, Perusahaan, Email, Jabatan, No. HP.
  - Field kosong ditampilkan "-". Semua output di-escape.
- **Skor Keseluruhan + Kategori Hasil** (lihat 4.2), tampil sebagai kartu ringkasan menonjol (skor besar + badge kategori).
- Ringkasan status penilai (mis. Self ✓, Atasan 1/1, Bawahan 3/3) — hanya jika data tersedia dari model yang ada.

### 4.2 Kategori Hasil (Skor → Kategori)

| Skor | Kategori |
| :-- | :-- |
| ≥ 5.7 | Highly Effective |
| 4.5 – 5.6 | Effective |
| 3.6 – 4.4 | Moderate Effective |
| ≤ 3.5 | Least Effective |

Implementasi: satu **Enum/value object** (mis. `EffectivenessCategory`) dengan method `fromScore(float): self`, label, dan warna. **Satu sumber kebenaran**, dipakai di PDF dan layar. Tampilkan tabel legenda kategori di PDF.

> ⚠️ **ASUMSI YANG PERLU DIKONFIRMASI (celah rentang):** batas di atas meninggalkan celah untuk nilai desimal (mis. 5.65, 4.45, 3.55).
> **Asumsi default yang dipakai:** skor **dibulatkan ke 1 desimal (round half up) terlebih dahulu**, lalu dikategorikan. Dengan begitu 5.65→5.7 (Highly), 4.45→4.5 (Effective), 3.55→3.6 (Moderate), sehingga tidak ada celah.
> Tulis aturan ini sebagai konstanta + komentar, dan buat **test boundary** (5.7, 5.6, 5.65, 4.5, 4.4, 4.45, 3.6, 3.5, 3.55, 1.0, 6.0).

### 4.3 Grafik Bar Chart Dimensi
- Bar chart **grouped** per dimensi (Task, People, Change oriented).
- Series: **Rata-rata, Diri Sendiri, Atasan, Bawahan**.
- Sumbu Y skala 1–6 (garis bantu 1..6), label nilai di atas bar, legenda, warna konsisten untuk tiap series di seluruh laporan.

### 4.4 Tabel Rekapitulasi Rata-rata per Dimensi
Kolom: **Dimensi | Rata-rata | Diri Sendiri | Atasan | Bawahan**. Nilai 2 desimal. Tambahkan baris/badge kategori untuk kolom Rata-rata bila ruang cukup.

### 4.5 Bagian per Dimensi (diulang untuk tiap dimensi, mulai halaman baru)
Untuk setiap dimensi:
1. **Judul dimensi** + skor rata-ratanya.
2. **Bar chart grouped per sub dimensi** di dalam dimensi tsb. Series: Rata-rata, Diri Sendiri, Atasan, Bawahan.
   - Bila nama sub dimensi panjang, gunakan **horizontal bar chart**.
3. **Tabel rekapitulasi per dimensi (grouped by dimensi)** dengan kolom:
   **No | Sub Dimensi | Pertanyaan | Rata-rata | Diri Sendiri | Atasan | Bawahan**
   - Baris pertanyaan dikelompokkan per sub dimensi (sub dimensi sebagai group header atau rowspan).
   - `No` = nomor urut pertanyaan (berdasarkan `sort_order`, bukan ID).
   - Header tabel berulang di tiap halaman (`thead` `display: table-header-group`); baris tidak terpotong antar halaman (`page-break-inside: avoid`).
   - Tambahkan baris subtotal rata-rata per sub dimensi.

> ⚠️ **INKONSISTENSI URUTAN KOLOM:** di permintaan, tabel 4.5 menulis "diri sendiri, **bawahan, atasan**", sedangkan bagian lain "diri sendiri, **atasan, bawahan**".
> **Asumsi default:** urutan seragam di seluruh laporan = **Rata-rata, Diri Sendiri, Atasan, Bawahan**. Definisikan satu konstanta urutan series agar mudah diubah.

### 4.6 Definisi "Rata-rata" — ⚠️ PERLU KONFIRMASI
Dokumen project hanya menyebut "menggabungkan Self, Boss, Subordinate" (FR-018) tanpa rumus.
**Asumsi default:** Rata-rata = rata-rata aritmetika dari **skor per kelompok penilai yang tersedia** (Self, Atasan, Bawahan), bobot sama.
- Skor Bawahan = rata-rata dari semua bawahan yang sudah submit.
- Bila suatu kelompok belum ada data, tampil "-" dan **dikecualikan** dari rata-rata (bukan dihitung 0). Tampilkan catatan di PDF bila ada kelompok yang belum lengkap.
- Gunakan rumus yang **sudah ada di `ScoreCalculator`** jika sudah ditetapkan; jangan membuat rumus baru tanpa menandainya. Bila rumus existing berbeda dari asumsi di atas, **ikuti yang existing dan laporkan perbedaannya**.

### 4.7 Halaman Penutup
- Legenda kategori, keterangan skala 1–6, catatan kerahasiaan ("Dokumen rahasia — hanya untuk peserta yang bersangkutan"), nomor halaman "Halaman X dari Y", footer.

## 5. DESAIN VISUAL PDF

Gaya: **profesional, modern, rapi, proporsional, minimalis**.

- Warna dominan **biru** (aksen, header tabel, judul), latar putih, teks netral (slate/gray). Warna kategori: Highly = hijau tua, Effective = biru, Moderate = amber, Least = merah — **selalu disertai label teks** (jangan hanya warna).
- Palet series chart (tetap & kontras, aman cetak hitam-putih lewat label nilai):
  Rata-rata = biru tua, Diri Sendiri = abu-slate, Atasan = biru muda/teal, Bawahan = amber.
- Tipografi: font sans-serif yang didukung dompdf. Gunakan font **ter-embed lokal** (mis. Inter/DejaVu Sans di `storage/fonts`) — **jangan memuat font/gambar dari URL remote** (`isRemoteEnabled` tetap `false`). Hierarki: judul 20–22pt, H2 14pt, body 9–10pt, tabel 8.5–9pt.
- Ukuran **A4 portrait**, margin ±20mm, grid sederhana, whitespace lega, border tipis, tanpa bayangan berat.
- Tabel: header biru, zebra sangat halus, angka rata kanan/tengah, 2 desimal.
- Kompatibel dompdf: **hindari flexbox/grid CSS**; gunakan `table`, `float`, atau `display: inline-block`. Uji dengan dompdf, bukan hanya browser.

## 6. GRAFIK SERVER-SIDE (RISIKO R-1)

- Render grafik **di PHP tanpa browser**. Pendekatan utama: bangun **SVG** lewat class `BarChartSvgRenderer` (grouped vertical & horizontal), embed sebagai `data:image/svg+xml;base64` pada `<img>`.
- **Proof of concept wajib dulu:** verifikasi dompdf versi terpasang merender SVG dengan benar (teks, rotasi label, warna). Jika tidak memadai, **fallback** ke render PNG via GD/Imagick (cek ekstensi tersedia di server on-premise) atau bar berbasis tabel HTML/CSS. Laporkan hasil PoC dan pilihan yang diambil.
- Renderer harus: murni (input array data → output string), tanpa akses DB, dapat diuji unit, mendukung label panjang (wrap/truncate), skala tetap 1–6, dan menangani nilai `null` (tanpa bar + label "-").
- **Jangan** menggunakan Chart.js, headless browser, atau layanan eksternal/berbayar untuk PDF.

## 7. ARSITEKTUR KODE (usulan, sesuaikan dengan struktur existing)

```text
app/
├── Enums/EffectivenessCategory.php
├── Services/Reports/
│   ├── AssessmentReportData.php        # DTO: peserta, skor total, dimensi, sub dimensi, pertanyaan
│   ├── AssessmentReportBuilder.php     # ambil data via ScoreCalculator → DTO (query efisien, tanpa N+1)
│   ├── AssessmentPdfGenerator.php      # DTO → binary PDF (dompdf)
│   └── Charts/BarChartSvgRenderer.php
├── Actions/Reports/
│   ├── DownloadAssessmentPdf.php
│   └── SendAssessmentPdfByEmail.php    # validasi, dispatch job, catat activity
├── Jobs/SendAssessmentPdfJob.php       # generate PDF di worker, kirim, update email_logs
├── Mail/AssessmentResultMail.php
resources/views/
├── reports/assessment/                  # layout, _partials: header, summary, charts, tables, footer
└── emails/assessment-result.blade.php
```

Aturan:
- Controller tipis → Action → Builder/Generator. **Tidak ada logika skor di controller/Blade.**
- Blade dipecah per partial (tidak satu file raksasa); CSS PDF dalam satu stylesheet inline khusus dompdf.
- Gunakan Eager Loading; hindari N+1 saat mengambil 39 pertanyaan × 3 kelompok penilai.
- Hanya assessment `submitted_at != null` yang dihitung.

## 8. ALUR DOWNLOAD & KIRIM EMAIL

### Download (FR-022)
- Route bernama (mis. `participants.result.pdf`), middleware auth + permission/policy admin.
- Generate on-the-fly, stream sebagai download, nama file aman: `ELQ-Result_{slug-nama}_{YYYYMMDD}.pdf` (sanitasi nama, tanpa karakter berbahaya).
- Catat `activity_log`: siapa, peserta mana, aksi "download pdf" (tanpa isi/skor).

### Kirim Email (FR-021)
- Tombol/aksi admin → **konfirmasi dialog** sebelum kirim (aksi mengirim data sensitif).
- Penerima: **hanya email akun peserta yang dinilai** (Q-3). Tidak boleh ada input penerima bebas dari request.
- Buat baris `email_logs` status `queued` → dispatch `SendAssessmentPdfJob` ke queue.
- Job: generate PDF di worker (tanpa browser) → kirim sebagai lampiran → update `email_logs` (`sent`/`failed`, attempts, pesan error). **PDF tidak disimpan**; tidak menyimpan lampiran/isi email.
- Konfigurasi `tries` dan `backoff`; gagal permanen → `failed` agar muncul di fitur kirim ulang (FR-047).
- Catat `activity_log` untuk pengiriman (tanpa skor, tanpa isi PDF).
- Pencegahan duplikasi klik (disable tombol saat proses; idempoten sederhana, mis. cegah kirim ganda dalam jendela waktu singkat atau tampilkan peringatan).
- Template email singkat, profesional, berbahasa Indonesia, menyebut peserta & tanggal, mengingatkan kerahasiaan. Tanpa signed URL dan tanpa skor di badan email.
- Respons UI: toast sukses/gagal; error tidak membocorkan detail exception.

## 9. KEAMANAN & PRIVASI (wajib)

- Otorisasi server-side di setiap endpoint; jangan percaya ID dari frontend tanpa policy check.
- Semua data peserta di-escape di Blade; nama file disanitasi.
- Tidak ada raw SQL dari input; filter/parameter lewat Eloquent.
- `isRemoteEnabled=false`; tidak memuat aset eksternal saat render PDF.
- Log tidak memuat nilai jawaban, skor, token, signed URL, isi PDF, atau lampiran.
- Dokumentasikan: bila queue worker/cron tidak berjalan di server on-premise, email tertahan di `queued`.

## 10. TESTING (Pest)

Minimal:
1. `EffectivenessCategory::fromScore` — seluruh batas & kasus pembulatan (lihat 4.2).
2. Perhitungan Rata-rata: semua kelompok ada; satu kelompok kosong (dikecualikan, bukan 0); multi-bawahan.
3. `BarChartSvgRenderer`: output SVG valid, nilai null, label panjang.
4. `AssessmentReportBuilder`: struktur DTO benar, urutan pertanyaan mengikuti `sort_order`, hanya assessment tersubmit dihitung.
5. Download: admin berhasil (200, `application/pdf`); non-admin ditolak (403); peserta belum punya hasil → pesan/halaman error yang jelas.
6. Kirim email: `Queue::fake` + `Mail::fake` — job ter-dispatch, penerima = email peserta, `email_logs` berubah `queued→sent`, gagal → `failed`, `activity_log` tercatat tanpa data sensitif, non-admin ditolak.
7. Smoke test: PDF dapat digenerate untuk data lengkap dan data parsial (tanpa error, binary diawali `%PDF`).

## 11. EDGE CASE YANG HARUS DITANGANI

- Penilai belum lengkap (mis. bawahan baru 1 dari 3) → tetap render dengan penanda "-" + catatan.
- Belum ada penilaian sama sekali → tolak dengan pesan jelas, bukan PDF kosong.
- Teks pertanyaan panjang / karakter non-ASCII → tidak merusak layout, encoding UTF-8.
- Pertanyaan/sub dimensi yang di-soft-delete atau diubah teksnya → laporan memakai data terkini; tetapkan perilakunya secara eksplisit dan laporkan.
- Dimensi tidak aktif (`active = 0`) → ⚠️ perilaku belum ditetapkan di dokumen; asumsi default: **tidak ditampilkan**. Konfirmasi.
- Banyak halaman → header tabel berulang, tidak ada baris/grafik terpotong.

## 12. CARA KERJA (bertahap)

1. **Audit** (bagian 3) → ringkas temuan.
2. **PoC grafik** SVG di dompdf → laporkan hasil sebelum lanjut.
3. Enum kategori + test.
4. `AssessmentReportBuilder`/DTO + test.
5. Renderer grafik + test.
6. Template Blade PDF (partial per bagian) sesuai bagian 4 & 5.
7. Download action + test.
8. Email job/mailable + `email_logs` + test.
9. Jalankan formatter (Pint), test Pest, dan generate contoh PDF.

Setiap langkah: kecil, reversibel, dan jangan lanjut bila ada masalah arsitektur.

## 13. FORMAT LAPORAN SETELAH SELESAI

```text
## Selesai
## File Ditambah
## File Diubah
## Hasil PoC Grafik (pilihan & alasan)
## Asumsi yang Dipakai (konfirmasi diperlukan)
## Dependensi Ditambah (None / ...)
## Validasi: Pint / Pest / contoh PDF → PASS/FAIL (hanya klaim bila benar-benar dijalankan)
## Risiko & Rollback
## Langkah Berikutnya
```

## 14. LARANGAN

- Jangan membuat ulang modul dari nol atau mengubah stack (tanpa Chart.js/headless browser/layanan cloud berbayar untuk PDF).
- Jangan menyimpan PDF atau skor turunan di database/server.
- Jangan menaruh logika bisnis di Blade/controller.
- Jangan mengubah modul di luar scope hasil asesmen (download & email).
- Jangan menyatakan berhasil bila build/test tidak dijalankan.
- Jangan mengarang aturan bisnis: tandai sebagai **asumsi** dan laporkan.

## 15. DAFTAR KONFIRMASI UNTUK TECH LEAD

| ID | Butir | Asumsi default |
| :-- | :-- | :-- |
| C-1 | Celah rentang kategori (5.6–5.7, 4.4–4.5, 3.5–3.6) | Bulatkan 1 desimal lalu kategorikan |
| C-2 | Urutan kolom (bawahan/atasan berbeda di permintaan) | Rata-rata, Diri Sendiri, Atasan, Bawahan |
| C-3 | Definisi "Rata-rata" | Rata-rata bobot sama antar kelompok penilai yang ada (atau ikuti rumus existing) |
| C-4 | Kategori diterapkan ke skor keseluruhan saja, atau juga per dimensi | Keseluruhan + per dimensi |
| C-5 | Dimensi nonaktif di laporan | Tidak ditampilkan |
| C-6 | Penerima email | Hanya email akun peserta (Q-3) |
