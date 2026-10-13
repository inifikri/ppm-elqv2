# ELQ — Participant Experience (Claude Code CLI)

Project Laravel 13 + React + Inertia + Tailwind v4 + Fortify sudah ada. Jangan buat ulang project / ganti auth / tambah package tanpa alasan. Ikuti CLAUDE.md & ELQ_AI_CLI_Implementation_Prompt.md (komponen kecil, satu tanggung jawab per file, tanpa file raksasa). Kerjakan HANYA pengalaman role **participant**.

## Langkah 0 — Audit singkat (maks 10 baris ringkasan)
Baca hanya: migration & model `raters`, `answers`, `questions`, `sub_dimensions`, `dimensions`, `users`, `participant_profiles`; route/middleware participant; komponen `Components/UI` yang bisa dipakai ulang; `ParticipantLayout` jika ada. Pakai nama kolom ASLI, jangan menebak.

## Fakta bisnis (dokumen v2.1)
- Login Fortify; email harus terverifikasi, akun harus aktif (sudah diatur, jangan diubah).
- Peserta wajib isi 1 email atasan + 3 email bawahan (FR-006/007). Validasi: format valid, tidak kosong, tidak duplikat (FR-008), + tidak boleh email peserta sendiri. Keunikan per peserta juga di DB.
- Setelah tersimpan: buat rater (ULID) atasan & bawahan, kirim undangan lewat queue (FR-009/010, catat di `email_logs`). Row rater `self` untuk peserta dibuat bersamaan.
- Self-assessment 39 pertanyaan, skala 1–6 (FR-011). Setelah submit tidak bisa diubah (FR-016). Semua pertanyaan wajib dijawab saat submit (FR-014).
- Peserta hanya boleh: dashboard, isi email penilai, self-assessment (FR-039). **Peserta TIDAK melihat skor/hasil** (matriks hak akses v2.1); jangan buat halaman hasil.

## Alur (state ditentukan server, bukan client)
Buat `App\Services\Participant\ParticipantFlowResolver` yang mengembalikan state, dan satu controller tipis `ParticipantHomeController` yang me-redirect/menampilkan halaman sesuai state:
1. **Belum ada rater atasan/bawahan** → halaman `Evaluators/Setup` (form).
2. **Rater lengkap, self belum submit** → halaman `Assessment/Run`, lanjut dari pertanyaan pertama yang belum dijawab.
3. **Self sudah submit** → halaman `Dashboard` status: self selesai, status undangan/pengisian atasan & bawahan (sudah/belum, tanpa nilai), tanpa tombol ubah.
Route lain di luar state yang valid di-redirect ke state yang benar (cegah lompat langkah via URL). Middleware/Policy: hanya role participant, hanya data milik sendiri (jangan percaya ID dari client).

## Resume progres (butuh perubahan perilaku — lihat butir terbuka #1)
- Simpan jawaban **per pertanyaan (autosave)** ke `answers` untuk rater self selama `submitted_at` masih NULL (upsert berdasarkan rater_id + question_id; pastikan unique index ada, tambahkan migration bila belum).
- Validasi server: nilai 1–6, question_id valid, rater milik peserta login, rater belum submitted. Tolak bila sudah submit.
- Submit final: validasi 39 terjawab → set `submitted_at` dalam satu transaksi + catat activity log (peristiwa saja, tanpa nilai). Cegah double submit.
- Saat login ulang, resolver menghitung jumlah terjawab dan membuka pertanyaan pertama yang belum dijawab; jawaban lama terisi.
- Gunakan `Action` class (`SaveAnswer`, `SubmitSelfAssessment`, `StoreEvaluators`), bukan logika di controller.

## UI/UX — mobile-first, minimalis, modern
- **Tanpa sidebar.** `ParticipantLayout` hanya top bar tipis: logo/nama ELQ di kiri, menu avatar di kanan (Profil, Dark mode, Logout dengan konfirmasi). Konten satu kolom, max-width sekitar 640px di desktop, dipusatkan.
- Palet: biru sebagai aksen, permukaan netral terang, dark mode semantik (bukan hitam pekat), radius 8/12px, border halus, bayangan sangat ringan, font Inter. Ikon Font Awesome (cek yang sudah terpasang). Target sentuh ≥44px, tanpa horizontal overflow, focus ring jelas, WCAG-oriented.
- **Evaluators/Setup:** stepper ringan atau kartu terpisah "Atasan (1/1)" dan "Bawahan (n/3)", tiap penilai satu kartu dengan input email, error inline, penghitung progres, tombol sticky di bawah di mobile ("Simpan & Kirim Undangan") dengan loading state, dialog konfirmasi singkat sebelum kirim (undangan tidak bisa ditarik kembali; lihat butir #2).
- **Assessment/Run:** satu pertanyaan per layar. Header: "Pertanyaan 12 dari 39" + progress bar tipis + persen (tenang, tidak bergaya game). Label dimensi/sub-dimensi kecil di atas pertanyaan. Skala 1–6 sebagai opsi vertikal berukuran besar (radio accessible, label 1 Sangat Tidak Setuju … 6 Sangat Setuju — cek teks label di source/legacy, jangan mengarang). Tombol Sebelumnya/Berikutnya sticky di bawah; indikator "Tersimpan" setelah autosave; tangani gagal simpan dengan retry yang jelas. Dukungan keyboard (1–6, panah).
- **Review & Submit:** daftar ringkas 39 butir (✓ / belum dijawab), klik untuk lompat; submit nonaktif selama ada yang kosong; dialog konfirmasi ("jawaban tidak bisa diubah"); setelah itu layar selesai.
- State umum: skeleton, empty/error state, toast untuk hasil aksi, tanpa spinner layar penuh.
- Komponen reuse di `Components/Assessment/` (QuestionCard, LikertScale, AssessmentProgress, QuestionNavigator, EvaluatorCard) dan `Components/UI`; jangan duplikasi.

## Test (Pest)
- Resolver: tiga state benar; redirect saat akses langkah salah.
- StoreEvaluators: validasi (format, kosong, duplikat, email sendiri), jumlah 1+3, undangan ter-queue, `email_logs` terisi, tidak bisa disimpan dua kali.
- Autosave & resume: jawaban tersimpan, login ulang melanjutkan di pertanyaan pertama kosong; nilai di luar 1–6 ditolak; tidak bisa mengubah rater orang lain.
- Submit: gagal bila <39, sukses sekali, setelah itu semua perubahan ditolak.
- Akun nonaktif/belum verifikasi tetap ditolak (regresi); peserta tidak bisa membuka halaman admin maupun hasil.

## Aturan eksekusi (hemat token)
Jangan cetak ulang isi file; laporkan path saja. Jalankan `pest`, `tsc --noEmit`, lint, `npm run build` dan laporkan hasil nyata. Tanpa dokumentasi tambahan. Mock data hanya jika terisolasi.

## Jangan mengarang — tanyakan/tandai di akhir
1. Autosave jawaban draft ke `answers` mengubah FR-015 (yang menyimpan jawaban + submitted_at dalam satu transaksi) — butuh persetujuan & nomor FR.
2. Apakah email penilai boleh diubah/kirim ulang setelah disimpan (usulan: terkunci untuk peserta; perubahan lewat admin).
3. Peserta boleh melihat status pengisian atasan/bawahan di dashboard? (usulan: ya, status saja).
4. Fitur "Result" pada menu participant di prompt implementasi bertentangan dengan matriks v2.1 → tidak dibuat.

## Laporan akhir
Completed · Files added/modified · Dependencies · Validation (PASS/FAIL nyata) · Known issues · Pertanyaan terbuka.
