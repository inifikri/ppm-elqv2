# ELQ — UI/UX Fix: Participant & Rater (provider-agnostic)

## 0. Konteks (self-contained; kamu belum mengenal project ini)
ELQ = sistem penilaian kepemimpinan 360° (self, atasan, bawahan), kuesioner 39 butir, skala 1–6. Project SUDAH ada: **Laravel 13, PHP 8.3, React + Inertia.js, Tailwind CSS v4 (config berbasis CSS), Vite, Laravel Fortify, MySQL**. Jangan buat ulang project, jangan ganti/menambah framework (tanpa Bootstrap/Vue/UI kit lengkap), jangan ubah auth, jangan ubah logika bisnis/backend kecuali disebut. Tambah package hanya bila benar-benar perlu dan jelaskan alasannya.

Pengalaman terkait:
- **Participant** (login): form penilai (1 atasan + 3 bawahan) → self-assessment → halaman status. Tanpa sidebar, hanya top bar.
- **Rater** (atasan/bawahan, tanpa login, via signed URL): Intro → Panduan → Kuesioner → Review → Submit → Selesai. Tanpa sidebar, tanpa menu admin.

Standar kode (wajib): komponen fungsional kecil, satu tanggung jawab per file, tanpa file raksasa, tanpa duplikasi (cek komponen yang sudah ada dulu), TypeScript bila project memakainya (hindari `any`), HTML semantik, WCAG 2.2 AA, target sentuh ≥44px, focus ring jelas, dark mode semantik (bukan hitam pekat), token desain konsisten (biru sebagai aksen, radius 8/12/16, border halus, shadow sangat ringan, font Inter, ikon Font Awesome bila sudah terpasang — jangan campur icon set). Gunakan route helper bernama, `useForm`/`router` Inertia. Validasi tetap server-side; client hanya UX.

## 1. Langkah 0 — Audit singkat (maks 10 baris ringkasan sebelum coding)
Baca hanya: `AdminLayout` + `Topbar` admin, `ParticipantLayout`, `EvaluatorLayout` (atau layout rater), halaman Participant (Evaluators/Setup, Assessment/Run, dashboard), halaman Rater, komponen `Components/UI` (Button, Input, Modal/Dialog, Toast, Skeleton, Progress), CSS token Tailwind. Catat apa yang dipakai ulang vs diubah. Jangan baca seluruh repo.

## 2. Tugas

### 2.1 Top bar disamakan dengan admin
- Ambil gaya top bar admin sebagai sumber kebenaran: background transparan + `backdrop-blur`, **tanpa garis pembatas (tanpa border-b / shadow tegas)**.
- Ekstrak gaya/struktur yang sama ke komponen bersama (mis. `Components/Layout/TopbarShell`) yang dipakai AdminLayout, ParticipantLayout, dan layout rater — jangan menyalin class ke tiga tempat.
- Sticky di atas, tinggi konsisten, `padding-top: env(safe-area-inset-top)`. Konten di bawahnya diberi offset agar tidak tertutup. Pastikan teks tetap terbaca di light & dark saat konten ter-scroll di bawah blur (cek kontras).
- Participant: logo/nama ELQ kiri, menu avatar kanan (profil, dark mode, logout dengan konfirmasi). Rater: hanya brand (+ toggle tema bila admin punya), tanpa menu akun.

### 2.2 Wizard bertahap yang tidak menumpuk (mobile-first)
Masalah sekarang: alur Informasi → Panduan → klik Mulai → input atasan → input 3 bawahan tampil menumpuk/terlalu padat. Ganti menjadi **wizard satu langkah per layar**.

Asumsi struktur langkah (tandai di laporan bila diubah):
- Participant (setup penilai): 1 Informasi → 2 Panduan → 3 Atasan → 4 Bawahan 1 → 5 Bawahan 2 → 6 Bawahan 3 → 7 Tinjau & Kirim.
- Rater: Intro → Panduan → Kuesioner (satu pertanyaan per layar) → Tinjau → Submit → Selesai.

Komponen reusable terpisah: `WizardShell`, `WizardProgress` (mis. "Langkah 3 dari 7", bar tipis), `WizardStep` (judul, deskripsi singkat, 1 fokus), `WizardActionBar`.
Aturan:
- Satu fokus per layar: maksimal 1 judul, 1 kalimat bantu, 1 kelompok input. Tidak ada dua card besar bertumpuk.
- Panduan ringkas (poin pendek, bukan paragraf panjang); tombol utama "Mulai" jelas.
- Validasi per langkah sebelum "Lanjut" (format email, tidak kosong, tidak duplikat, bukan email peserta sendiri); error inline di bawah field. Saat server mengembalikan error, kembalikan user ke langkah yang berisi field bermasalah.
- State seluruh wizard dalam satu `useForm`; tombol Kembali tidak menghilangkan data. Tombol kembali browser/HP berperilaku wajar (langkah sebelumnya, bukan keluar halaman) — sinkronkan langkah dengan history/query bila praktis.
- Transisi antar langkah halus (fade/slide ringan), hormati `prefers-reduced-motion`.
- Langkah terakhir: ringkasan semua email + dialog konfirmasi sebelum kirim (undangan tidak bisa ditarik); tombol loading dan cegah double submit.
- Kuesioner mempertahankan perilaku yang sudah ada (autosave, resume, validasi 39 terjawab) — jangan ubah logikanya, hanya tampilan.

### 2.3 Tidak ada elemen menumpuk di mobile (viewport 320–430px)
Teks, input, card, button, toast, dan modal tidak boleh saling menutupi atau overflow horizontal.
- Gunakan `dvh` (bukan `vh`), padding aman `env(safe-area-inset-*)`, satu skala spacing konsisten, panjang teks dibatasi (judul 1–2 baris, deskripsi ≤2 baris, `text-balance`).
- **Action bar sticky bawah**: tombol utama full-width (tombol sekunder di atasnya atau sebagai ghost kecil), area konten diberi `padding-bottom` setinggi bar agar tidak tertutup. Saat keyboard terbuka, field aktif tetap terlihat (`scroll-margin`, `scrollIntoView`) dan action bar tidak menutup input.
- **Input**: label di atas field (bukan placeholder-only), tinggi ≥44px, `inputMode="email"`, `autoComplete`, `autoCapitalize="none"`, font ≥16px agar iOS tidak zoom, pesan error satu baris di bawah field.
- **Card**: padding konsisten, tanpa nested card; satu aksi utama per card.
- **Toast**: maksimal 1 tampil (antrean untuk berikutnya), posisi atas-tengah di bawah top bar, lebar `calc(100% - 2rem)`, auto-dismiss, `role="status"`/`aria-live`, tidak menutupi action bar. Error validasi field tetap inline, bukan hanya toast.
- **Modal/dialog**: di mobile tampil sebagai **bottom sheet** (maks tinggi ~85dvh, scroll di dalam, handle visual opsional), di ≥768px jadi dialog tengah. Tombol aksi ditumpuk vertikal full-width di mobile (aksi utama di atas), focus trap, tutup dengan Esc/klik backdrop (kecuali aksi kritis), kembalikan fokus ke pemicu, scroll latar terkunci.
- Tetapkan skala `z-index` lewat token (topbar < action bar < toast < modal) agar tidak berebut.
- Verifikasi visual di 320, 375, 414, 768px (light & dark). Tidak ada horizontal scroll.

### 2.4 Loading data pertanyaan — animatif & informatif
Saat memuat daftar pertanyaan (dan jawaban tersimpan untuk resume), tampilkan layar loading yang menenangkan:
- Komponen `QuestionsLoader`: animasi halus (mis. tiga titik berdenyut / ring tipis berputar, CSS-only, tanpa library animasi) + teks utama **"Sebentar lagi, mohon tunggu…"** dan subteks kecil **"Menyiapkan pertanyaan untuk Anda"**. Jika memuat lanjutan progres: **"Memuat jawaban Anda sebelumnya"**.
- Untuk pemuatan lebih dari ~3 detik tambahkan subteks sekunder ("Masih memproses, mohon jangan tutup halaman"). Jika gagal/timeout: state error ramah dengan tombol "Coba lagi" (tanpa detail teknis).
- Hindari kedip: tampilkan loader hanya bila pemuatan >~200ms, lalu minimal tampil ~400ms. Skeleton kartu pertanyaan sebagai transisi ke konten.
- Aksesibilitas: `role="status"`, `aria-live="polite"`, `aria-busy` pada wadah; animasi dimatikan/disederhanakan untuk `prefers-reduced-motion`.
- Teknis: gunakan mekanisme Inertia yang sudah ada (deferred props/`<Deferred>` atau partial reload) bila tersedia di versi terpasang; jika tidak, loading state lokal. Jangan memuat ulang seluruh daftar tiap pindah pertanyaan — muat sekali, simpan di state halaman.

## 3. Batasan
- Jangan ubah route, controller, model, migration, kebijakan akses, atau aturan bisnis (1 atasan + 3 bawahan, skala 1–6, submit final tidak bisa diubah, peserta tidak melihat hasil).
- Jangan menambah fitur baru di luar daftar di atas.
- Jangan hard-code data produksi; mock hanya terisolasi.
- Jangan tinggalkan `console.log`.
- Bila ada yang ambigu atau berpotensi mengubah bisnis, jangan diasumsikan diam-diam: catat di "Pertanyaan terbuka".

## 4. Cara kerja & validasi
Kerjakan bertahap dan berhenti di tiap tahap sampai hijau: (1) TopbarShell → (2) komponen Wizard + Participant setup → (3) fondasi anti-menumpuk (action bar, toast, bottom-sheet modal) → (4) QuestionsLoader → (5) terapkan ke alur Rater.
Jalankan yang tersedia: type-check, lint, build, test. **Jangan klaim PASS bila tidak dijalankan.** Hemat output: jangan cetak ulang isi file, cukup path.

## 5. Laporan akhir (singkat)
Completed · Files added/modified · Dependencies added (idealnya none) · Validation (type-check/lint/build/test: PASS/FAIL nyata) · Hasil cek visual per lebar layar · Asumsi struktur langkah wizard · Known issues · Pertanyaan terbuka.
