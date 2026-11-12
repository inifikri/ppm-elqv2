ROLE
Senior frontend engineer + UI/UX designer. Project: Laravel 13 + React + Inertia + Tailwind v4 + Vite (SUDAH ADA, jangan dibuat ulang).

TUJUAN
RESTYLE admin panel agar lebih minimalist, compact, clean. Ini reskin, BUKAN rewrite. Jangan ubah logika bisnis, nama route, props Inertia, auth (Fortify), atau kontrak backend, kecuali yang disebut eksplisit di bawah (shared prop badge).

LANGKAH 0 (WAJIB, sebelum mengubah file)
Audit lalu laporkan singkat: package.json (shadcn/Radix? icon lib apa?), resources/css/app.css, layout/sidebar/topbar/toast/table/breadcrumb/form yang ada, komponen mana yang dipakai ulang di banyak halaman. Tunggu laporan selesai baru eksekusi. Pertahankan library UI yang sudah ada; ubah lewat design token & komponen dasar agar perubahan menyebar otomatis ke semua halaman.

DAFTAR PERUBAHAN

1. IKON: REGULAR/OUTLINE, BUKAN SOLID
    - Ganti semua ikon solid ke gaya regular (Font Awesome "regular" jika dipakai; jika lib-nya Lucide, pakai outline dengan stroke tipis 1.5).
    - Bila ada ikon yang tidak punya versi regular di paket Free, JANGAN fallback ke solid diam-diam. Daftar ikon tsb di laporan dan usulkan padanan outline terdekat.
    - Satu set ikon saja. Ukuran ikon default 16px (sidebar 18px). Ikon-only button wajib aria-label.

2. BORDER-RADIUS DIKURANGI (token terpusat di @theme / CSS variable, jangan hardcode per komponen)
    - input/button/select/badge-kotak: 6px
    - card/table wrapper/dropdown: 8px
    - modal/dialog/sidebar floating: 12px
    - badge angka & avatar: tetap circle/pill
    - Hapus rounded-xl/2xl/3xl yang tersebar; arahkan ke token.

3. BADGE ANGKA PADA MENU SIDEBAR
    - Menu "Dimensi" (3), "Sub Dimensi" (5), "Pertanyaan" (39): badge circle/pill, background primary blue, teks putih, font 11px, min-width 20px, tinggi 20px.
    - Angka JANGAN hardcode. Ambil dari DB (count dimensions, sub_dimensions, questions yang tidak soft-deleted) via Inertia shared props (HandleInertiaRequests::share, gunakan lazy/closure + cache singkat bila perlu). Sidebar membaca dari props.
    - Saat sidebar collapsed: badge tampil sebagai dot kecil/angka mini di pojok ikon, dan angka juga ada di tooltip.
    - Badge punya aria-label, mis. "39 pertanyaan".
    - Gunakan istilah "Sub Dimensi" (bukan Sub Domains) di seluruh UI.

4. SIDEBAR MENGAMBANG (floating)
    - Background putih (dark mode: surface gelap semantik), border 1px, shadow kecil (shadow-sm), radius 12px.
    - Ada jarak (margin ±12px) dari tepi viewport kiri/atas/bawah; tinggi = viewport dikurangi margin; scroll internal.
    - Item aktif: background primary-50 + teks primary-700 (dark: semantik setara), tanpa blok biru pekat.
    - Collapsible (ikon + tooltip), mobile = drawer overlay dengan backdrop.
    - Hindari konten tertimpa: konten utama menyesuaikan lebar sidebar (expanded/collapsed).

5. TOP BAR: PROFILE
    - Hapus nama user dari topbar. Sisakan avatar/foto saja (ukuran 32px, circle) sebagai trigger dropdown.
    - Dropdown tetap menampilkan nama + email di dalam menu (supaya identitas tetap terbaca), plus Profil dan Logout.
    - Bila foto belum ada, fallback inisial. Trigger wajib button dengan aria-label "Menu pengguna" dan focus-visible jelas.

6. TOAST / NOTIFIKASI
    - Posisi top-center, stack vertikal, max 3 terlihat, auto-dismiss (success/info 4s, warning 6s, danger 8s atau manual), ada tombol close.
    - Varian warna semantik: success (hijau), danger (merah), warning (kuning/amber), info (biru). Gaya minimalist: background tint lembut + border tipis + ikon regular + teks gelap, bukan blok warna pekat. Pastikan kontras AA di light & dark.
    - role="status" (success/info) / role="alert" (danger/warning), aria-live, pause on hover, respect prefers-reduced-motion.
    - Satu API terpusat (hook/helper) yang sudah ada dipertahankan; hubungkan flash message Laravel (Inertia) ke toast agar semua halaman otomatis ikut.
    - Validasi field tetap inline, toast bukan satu-satunya tempat error validasi.

7. UKURAN DIPERKECIL (compact), atur via token
    - Body 13px (label/teks sekunder 12px, caption 11px), judul halaman 20px semibold, judul card 14px semibold.
    - Button: tinggi 32px (sm 28px), teks 13px, padding-x 12px. Input/select: tinggi 36px, teks 13px. Checkbox/radio 16px. Table cell padding vertikal dikurangi (row ±40px).
    - Mobile (<768px): tombol & input tetap min-height 40-44px, area tap checkbox diperluas (label/padding) walau visual 16px.
    - Spasi grid 4px; kurangi padding card ke 16px.

8. BULK ACTION BAR (checkbox tabel)
    - Saat ≥1 baris dicentang, muncul bar melayang di bottom-center (fixed, margin bawah ±24px), gaya pop-up: background hitam/slate-900 (dark mode: tetap gelap tapi dibedakan dengan border tipis), teks putih, radius 10px, shadow kecil, animasi masuk/keluar halus (hormati reduced-motion).
    - Isi minimalis: "N dipilih" · tombol aksi (mis. Hapus, Nonaktifkan, sesuai konteks tabel; aksi destruktif memakai konfirmasi dialog) · tombol "Batal pilih" (X).
    - Jadikan SATU komponen reusable (BulkActionBar) yang menerima selectedCount + actions via props, dipakai semua tabel. Jangan duplikasi per halaman.
    - Aksesibilitas: role="region" aria-label="Aksi massal", aria-live untuk jumlah terpilih, bisa dijangkau keyboard, Esc untuk batal pilih. Di mobile, bar tidak menutupi pagination (beri padding bawah pada konten).
    - Hanya tampilkan aksi yang diizinkan permission user; otorisasi tetap di backend.

9. BREADCRUMB
    - Perbaiki: satu komponen reusable <Breadcrumb items=[{label, href?}]>; item terakhir = halaman aktif (bukan link, aria-current="page").
    - Pemisah chevron regular (bukan "/"), teks 12px muted, hover/focus jelas, truncate item panjang dengan title, di mobile tampilkan 2 level terakhir (atau collapse ke "…").
    - Dibungkus <nav aria-label="Breadcrumb"> + <ol>. Terletak konsisten di atas Page Header di semua halaman via layout/PageHeader, bukan ditulis ulang per halaman.
    - Label memakai istilah UI sesuai navigasi (Dimensi, Sub Dimensi, Pertanyaan, Peserta, dst.).

10. TOMBOL KEMBALI DI SETIAP FORM

- Buat komponen <BackButton href fallbackHref> (ghost button, ikon panah kiri regular + teks "Kembali"), ditempatkan konsisten di kiri atas form/Page Header untuk semua halaman Create/Edit/Detail-form.
- Tujuan: href eksplisit ke halaman index terkait (named route). Jangan pakai window.history.back() sebagai satu-satunya mekanisme; boleh dipakai bila ada riwayat, dengan fallback ke route index.
- Bila form "dirty" (ada perubahan belum disimpan), tampilkan konfirmasi sebelum keluar. Tombol "Batal" di footer form tetap ada dan perilakunya sama.
- Terapkan ke SEMUA form yang ada. Daftar halaman yang sudah diterapkan di laporan akhir.

ATURAN UMUM

- Satu file = satu tanggung jawab; tidak ada file raksasa/markup duplikat. Ekstrak komponen bila pola muncul ≥2 kali.
- Semua warna lewat token semantik (background, surface, border, text, text-muted, primary). Dark mode intentional, bukan invert, bukan hitam pekat.
- State komponen lengkap: default, hover, focus-visible (jelas), active, disabled, loading, error.
- Aksesibilitas WCAG 2.2 AA: semantic HTML, label, kontras, keyboard nav, tanpa clickable div.
- Jangan tambah dependency baru tanpa alasan tertulis; jangan pakai Bootstrap; jangan ganti React/Inertia/Fortify.
- Jangan menambah fitur/halaman baru di luar daftar. Jika menemukan inkonsistensi (mis. menu Role Groups/Companies yang tidak ada di dokumen v2.1), LAPORKAN, jangan putuskan sendiri.
- Perubahan inkremental dan reversible. Jangan overwrite file tak terkait.

URUTAN FASE (berhenti & lapor tiap fase, tunggu saya bilang lanjut)
Fase 1: Audit + design tokens (radius, ukuran font, ukuran kontrol, warna toast, dark mode) + ikon regular.
Fase 2: Komponen dasar (Button, Input, Select, Checkbox, Badge, Card, Modal, Table) mengikuti token baru.
Fase 3: App shell: Sidebar floating + badge angka (+ shared props backend), Topbar (avatar-only), Breadcrumb.
Fase 4: Toast top-center + BulkActionBar + BackButton, lalu terapkan ke semua halaman/form.

SETIAP FASE
Jalankan lint, typecheck, build (dan test bila ada). Jangan klaim PASS bila belum dijalankan. Format laporan:
Selesai / File ditambah / File diubah / Catatan arsitektur / Dependency ditambah / Validasi / Risiko & isu / Langkah berikutnya.

MULAI
Fase 1. Lakukan audit dulu dan laporkan sebelum mengubah file.
