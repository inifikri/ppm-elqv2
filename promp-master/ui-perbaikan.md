ROLE
Senior frontend engineer + UI/UX designer. Project: Laravel 13 + React + Inertia + Tailwind v4 + Vite (SUDAH ADA). Ini lanjutan restyle: BUKAN rewrite. Jangan ubah logika bisnis, nama route, auth (Fortify), atau kontrak backend, kecuali yang disebut eksplisit.

LANGKAH 0 (WAJIB, sebelum mengubah file)
Audit singkat lalu laporkan: komponen Topbar, Breadcrumb, PageHeader, SearchInput/kolom search yang ada (berapa lokasi), badge sidebar (cari akar masalah warna teks), halaman Pertanyaan (tabel & BulkActionBar), halaman Pengguna (index/create/edit), komponen Button, FormCard/Field yang ada. Tunggu laporan selesai baru eksekusi. Pakai ulang komponen & token yang sudah ada.

DAFTAR PERUBAHAN

1. BREADCRUMB PINDAH KE TOPBAR
    - Hapus breadcrumb dari area atas konten/PageHeader. Render di Topbar, sisi kiri (setelah tombol toggle sidebar/hamburger).
    - Tetap satu komponen <Breadcrumb> reusable, data dari satu sumber (mis. prop/layout), bukan ditulis ulang per halaman.
    - Pertahankan aturan: <nav aria-label="Breadcrumb"><ol>, item terakhir aria-current="page" bukan link, chevron regular, teks 12-13px, truncate + title.
    - Mobile: tampilkan 2 level terakhir atau hanya judul halaman + tombol kembali agar topbar tidak sesak. Tidak boleh overflow horizontal.
    - PageHeader tinggal berisi judul, deskripsi singkat, dan aksi.

2. TOPBAR TANPA BORDER
    - Hapus border-bottom (dan border lain) pada topbar. Pisahkan visual dari konten lewat background yang menyatu dengan latar halaman (bukan blok putih bergaris). Jika konten di-scroll di bawah topbar sticky, boleh pakai background tembus pandang/blur halus atau shadow sangat tipis HANYA saat scroll; default tanpa garis.
    - Pastikan di light & dark mode tetap terbaca dan kontras AA.

3. SEMUA KOLOM SEARCH BERIKON SEARCH
    - Buat/ratakan satu komponen <SearchInput> (ikon search regular/outline di kiri dalam input, padding kiri menyesuaikan, opsional tombol clear "x" di kanan saat ada isi, aria-label jelas, type="search").
    - Ganti SEMUA kolom pencarian yang ada (tabel, filter, dsb.) agar memakai komponen ini. Laporkan daftar lokasi yang diganti. Jangan duplikasi markup.
    - Ukuran/radius mengikuti token compact yang sudah ada. Ikon dekoratif aria-hidden.

4. CHECKBOX DI HALAMAN PERTANYAAN
    - Tambahkan kolom checkbox (header: pilih semua di halaman ini, state indeterminate; tiap baris: checkbox) pada tabel Pertanyaan, memakai komponen Checkbox + BulkActionBar yang sudah ada. JANGAN buat bar baru.
    - Aksi bulk yang tersedia: Hapus (soft delete, sesuai FR-027). Tampilkan hanya jika user punya permission; otorisasi tetap di backend.
    - Alert pada perubahan/hapus pertanyaan bersifat INFORMASI (keputusan D-7), bukan konfirmasi yang memblokir. Jangan mengubah perilaku ini. Bila backend untuk bulk delete belum ada, buat endpoint terfokus (FormRequest + authorization + soft delete + activity log), jangan fake.
    - Seleksi dipertahankan hanya di halaman aktif; reset saat pindah halaman/filter berubah. Tombol Esc dan "Batal pilih" mengosongkan seleksi. Area tap checkbox diperluas di mobile.

5. PERBAIKI BADGE ANGKA PADA MENU SIDEBAR
    - Masalah: pada light mode teks badge hitam, seharusnya putih. Cari AKAR masalah (token foreground yang salah / kelas warna teks tertimpa / urutan CSS) dan perbaiki di satu tempat. Jangan menimpa per komponen dengan !important.
    - Spesifikasi: background primary blue, teks putih di light & dark mode, font 11px, min-width 20px, tinggi 20px, circle/pill. Cek kontras teks putih di atas biru terhadap AA.
    - Item menu aktif (background primary-50) juga harus tetap terbaca badge-nya. Verifikasi di keadaan expanded, collapsed, hover, dan aktif.

6. LIHAT DETAIL PENGGUNA (DRAWER KANAN)
    - Di tabel Pengguna tambahkan aksi "Lihat detail" (ikon eye regular + tooltip/aria-label "Lihat detail") pada menu aksi baris atau tombol ikon. Klik nama juga boleh membuka detail.
    - Komponen reusable <Drawer side="right"> (atau pakai Sheet shadcn bila sudah ada): slide-in dari kanan, lebar ±400px (mobile: hampir full width), backdrop halus, radius sisi kiri sesuai token, shadow kecil, animasi halus (hormati reduced-motion).
    - Aksesibilitas: role="dialog" aria-modal, aria-labelledby, focus trap, Esc menutup, fokus kembali ke pemicu, scroll lock pada body.
    - Isi (read-only, gaya minimalist): header dengan avatar/inisial, nama, email, badge role, badge status (Aktif/Nonaktif); lalu section kecil berlabel muted: Informasi akun (email terverifikasi/belum, login terakhir, dibuat pada), Profil (perusahaan, jabatan, telepon), Hak akses (role). Footer: tombol "Edit" (ke halaman edit via named route) dan "Tutup".
    - JANGAN menampilkan password, hash, token, atau data sensitif. Data detail diambil dari server lewat Inertia (partial reload/prop terfokus atau endpoint kecil dengan authorization), bukan memuat seluruh data pengguna ke klien. Tampilkan skeleton saat memuat, dan error state bila gagal.
    - Gunakan label "Peserta/Administrator" sesuai istilah dokumen; format tanggal konsisten (locale id-ID).

7. PERBAIKI SEMUA HALAMAN FORM (modern & minimalist)
    - Buat pola form konsisten: komponen <FormCard> (judul 14px semibold, deskripsi 12px muted, isi grid field, border tipis, radius token card) dan <FormField> (label, hint, error inline, required marker). Gunakan layout satu kolom di mobile, dua kolom di desktop bila field pendek.
    - Footer form seragam: tombol Simpan (primary), Batal, dan Reset bila relevan, rata kanan; di mobile menempel/rapi dan tidak menutupi konten. Tombol Kembali tetap ada seperti ketentuan sebelumnya.
    - KHUSUS halaman Create (dan Edit) Pengguna: pisahkan menjadi 2 card terpisah:
      Card 1 "Profil Pengguna": nama, email, telepon, perusahaan, jabatan, password (sesuai field yang sudah ada di form saat ini; jangan menambah field baru).
      Card 2 "Hak Akses": pemilihan role (admin / participant) dan status akun aktif/nonaktif (boolean, sesuai keputusan D-1/D-6).
      ASUMSI (nyatakan di laporan): "hak akses" = role + status akun. Pemilihan permission per pengguna TIDAK dibuat karena belum diputuskan (FR-049 / Q-2 masih terbuka).
    - Terapkan pola yang sama ke seluruh form lain yang ada (Dimensi, Sub Dimensi, Pertanyaan, Profil, Pengaturan, dst.). Laporkan daftar halaman yang sudah diterapkan.
    - Validasi tetap inline + server-side; state loading/disabled saat submit mencegah double submit; peringatan keluar bila form dirty tetap berfungsi.

8. IKON PADA TOMBOL
    - Sisipkan ikon regular/outline di kiri label untuk tombol aksi umum: Simpan (floppy/check), Batal (x), Reset (rotate/undo), Tambah (plus), Hapus (trash), Kembali (arrow-left), Edit (pen), Cari bila relevan.
    - Implementasi lewat prop `icon` pada komponen Button (bukan menyisipkan manual per halaman); ikon aria-hidden, jarak 6px dari label; saat loading ikon diganti spinner dan teks tetap ("Menyimpan...").
    - Satu set ikon yang sama dengan sebelumnya. Bila ada ikon tanpa versi regular, daftarkan di laporan, jangan fallback ke solid diam-diam.

ATURAN UMUM

- Satu file = satu tanggung jawab; ekstrak komponen bila pola muncul ≥2 kali; tidak ada file raksasa.
- Warna lewat token semantik; dark mode intentional (bukan invert, bukan hitam pekat). Radius & ukuran tetap mengikuti token compact yang sudah ditetapkan.
- State komponen lengkap: default, hover, focus-visible jelas, active, disabled, loading, error.
- WCAG 2.2 AA: semantic HTML, label, kontras, keyboard nav, tanpa clickable div. Mobile: touch target ≥ 40-44px.
- Jangan tambah dependency tanpa alasan tertulis; jangan ganti React/Inertia/Fortify; jangan pakai Bootstrap.
- Jangan menambah fitur/halaman di luar daftar. Temuan inkonsistensi dengan dokumen v2.1 (mis. menu Role Groups/Companies) LAPORKAN, jangan putuskan sendiri.
- Perubahan inkremental & reversible; jangan overwrite file tak terkait.

URUTAN FASE (berhenti & lapor tiap fase, tunggu saya bilang lanjut)
Fase 1: Audit + perbaikan badge sidebar (akar masalah) + Topbar tanpa border + Breadcrumb pindah ke Topbar.
Fase 2: SearchInput berikon (ganti semua lokasi) + Button dengan prop icon (terapkan ke tombol Simpan/Batal/Reset/dll).
Fase 3: Komponen Drawer + Detail Pengguna (kanan) + checkbox & bulk action di halaman Pertanyaan.
Fase 4: Pola FormCard/FormField + redesign semua form (Create/Edit Pengguna 2 card) + footer form seragam.

SETIAP FASE
Jalankan lint, typecheck, build (dan test bila ada). Jangan klaim PASS bila belum dijalankan. Format laporan:
Selesai / File ditambah / File diubah / Catatan arsitektur / Dependency ditambah / Validasi / Risiko & isu / Langkah berikutnya.

MULAI
Fase 1. Audit dulu dan laporkan sebelum mengubah file.
