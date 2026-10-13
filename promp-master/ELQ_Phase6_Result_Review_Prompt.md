# ELQ Phase 6 — Assessment Result Review (Claude Code CLI)

Kamu bekerja di project Laravel 13 + React + Inertia + Tailwind v4 + Fortify yang SUDAH ada. Jangan buat ulang project, jangan ganti auth/stack. Ikuti aturan di CLAUDE.md / ELQ_AI_CLI_Implementation_Prompt.md (komponen kecil, satu tanggung jawab per file, tanpa file raksasa, tanpa package baru tanpa alasan).

## Tugas
Implementasikan modul **Review Result Assessment** untuk Admin (FR-017 s.d. FR-022, FR-020, FR-029–032 yang terkait hasil). Hanya modul ini; jangan sentuh modul lain.

## Langkah 0 — Audit singkat (wajib, maksimal ringkas)
Baca HANYA: migration `raters`, `answers`, `questions`, `sub_dimensions`, `dimensions`; model + relasinya; route/permission yang ada; `AdminLayout` dan komponen `Components/UI` yang bisa dipakai ulang (Card, Badge, Tabs, DataTable, EmptyState, Skeleton, Dialog, Toast); package chart yang terpasang. Gunakan nama kolom ASLI dari migration, jangan menebak. Tulis ringkasan temuan maks 10 baris, lalu lanjut implementasi.

## Fakta bisnis (dari dokumen v2.1, jangan diubah)
- Role penilai di `raters`: self, boss (atasan), subordinate (bawahan). Status selesai = `submitted_at` terisi. Per peserta: 1 self, 1 atasan, 3 bawahan.
- Jawaban `answers`: skala 1–6, 39 pertanyaan per rater. Hierarki: Dimension (Task/People/Change) → Sub Dimension → Question.
- Skor **dihitung saat dibutuhkan, tidak disimpan** (ScoreCalculator). Hanya rater dengan `submitted_at` terisi yang dihitung. Pertanyaan soft-deleted tetap ikut dihitung untuk jawaban historis.
- Akses: hanya Admin (permission-based via spatie, bukan `if admin`). Peserta tidak melihat hasil.
- Tidak ada pencatatan nilai jawaban di log (FR-044).

## Backend
1. `App\Services\Scoring\ScoreCalculator` (murni, tanpa akses request): input participant → output DTO/array: rata-rata per sub-dimensi dan dimensi untuk Self, Boss, Subordinate (rata-rata antar bawahan yang sudah submit), plus `answered_raters` per role. Hindari N+1 (satu query agregat dengan join + groupBy, Eloquent/query builder berparameter, tanpa raw dari input user).
2. `ParticipantResultController` (tipis): `show` (Inertia), `detail` (jawaban per rater, FR-020), `pdf` (download, FR-022), `sendPdf` (FR-021). Authorize via Policy/permission `results.view`, `results.export`, `results.share`.
3. Form Request untuk `sendPdf`. Penerima PDF **hanya email akun peserta yang dinilai** (Q-3, asumsi usulan; jangan terima email dari input).
4. PDF: `barryvdh/laravel-dompdf`, dibuat saat dibutuhkan, **tidak disimpan**. Grafik di PDF dirender server-side (SVG/gambar dari PHP, bukan Chart.js; lihat risiko R-1). Buat `ResultChartRenderer` terpisah; jika PoC gagal, fallback tabel nilai + tandai TODO jelas.
5. `sendPdf` → Job di queue (database driver), catat di `email_logs` (queued/sent/failed, tanpa lampiran/isi) dan `activity_log` (tanpa nilai jawaban, token, URL bertanda tangan).
6. Jika peserta belum punya rater submit sama sekali → kembalikan state "belum ada data", bukan error.

## Frontend (React + Inertia)
Halaman `Pages/Participants/Result/Show.tsx` (+ komponen terpisah di `Components/Assessment/`):
- `ScoreCard`: skor keseluruhan, status kelengkapan (mis. Self ✓, Boss ✓, Bawahan 2/3).
- `DimensionRadarChart` (Self/Boss/Subordinate, 3 dimensi).
- `RoleComparisonBarChart` (grouped bar per dimensi).
- `SubDimensionBarChart` (horizontal, per dimensi).
- Tab: Ringkasan | Sub Dimensi | Detail Jawaban (tabel server-side paginated, filter per rater/dimensi).
- Aksi: Download PDF, Kirim PDF ke email peserta (dialog konfirmasi menampilkan email tujuan; tombol loading + cegah double submit; toast hasil).
- Chart.js via npm (bungkus 1 komponen `Charts/ChartCanvas`), dark mode aware, ada ringkasan teks/tabel aksesibel untuk tiap chart (jangan hanya warna).
- Loading skeleton, empty state, error state; responsif (mobile: chart satu kolom, tabel → card).
- Tombol aksi disembunyikan bila tanpa permission (backend tetap authoritative).
- Output Blade/React di-escape; tidak ada `dangerouslySetInnerHTML`.

## Test (Pest)
- ScoreCalculator: rata-rata benar, rater belum submit diabaikan, bawahan 1–3 submit, tanpa data.
- Otorisasi: non-admin/peserta → 403; guest → redirect.
- `sendPdf`: job ter-queue, hanya ke email akun peserta, `email_logs` terisi, activity log tidak memuat nilai jawaban.
- PDF endpoint mengembalikan `application/pdf` dan tidak menyimpan file.

## Aturan eksekusi (hemat token)
- Jangan cetak ulang isi file yang dibuat; cukup laporkan path.
- Jalankan: `pest`, `tsc --noEmit`, lint, `npm run build`. Perbaiki sampai hijau; jangan klaim PASS bila tidak dijalankan.
- Jangan membuat dokumentasi/README tambahan.

## Jangan mengarang — tanyakan di akhir (jangan diasumsikan diam-diam)
1. Definisi "overall score" (usulan: rata-rata tiga skor role; bobot sama).
2. Minimum bawahan yang sudah submit sebelum hasil bawahan ditampilkan (anonimitas) — belum ada di dokumen.
3. Apakah hasil boleh dilihat/diunduh saat rater belum lengkap (usulan: boleh, dengan penanda "belum lengkap").
4. Nomor FR final untuk fitur ini bila perlu FR baru.

## Laporan akhir (format singkat)
Completed · Files added/modified · Dependencies added · Validation (pest/tsc/lint/build: PASS/FAIL nyata) · Known issues · Pertanyaan terbuka.
