# Prompt Claude Code: Redesign Halaman Login & Register (ELQ Assessment 360)

## Catatan sebelum dijalankan

1. **Fortify tetap dipakai.** Route `login` dan `register` tidak diubah. Tab toggle dibuat sebagai navigasi antar dua route (Inertia `Link`), jadi redirect, validasi server, dan error bag Fortify tetap berfungsi tanpa hack.
2. **Field register mengikuti FR-003**: nama, email, perusahaan, jabatan, password (plus konfirmasi password bila sudah ada di form saat ini). Tidak ada field baru.
3. **Logo**: jangan memakai logo PPM Manajemen kecuali file aslinya disediakan. Default: wordmark teks "ELQ" + ikon sederhana buatan sendiri.
4. **Setelah registrasi** peserta wajib verifikasi email (FR-004). Halaman verifikasi email di luar daftar ini; cukup dilaporkan bila gayanya tidak konsisten.
5. **Pesan error login/lupa password** harus tetap netral (tidak mengungkap apakah email terdaftar).

## Prompt

```text
ROLE
Senior frontend engineer + UI/UX designer. Project: Laravel 13 + React + Inertia + Tailwind v4 + Vite + Fortify (SUDAH ADA). Ini RESTYLE halaman auth, bukan rewrite. Jangan ubah route Fortify, logika autentikasi, validasi server, rate limiting, atau kontrak backend.

LANGKAH 0 (WAJIB, sebelum mengubah file)
Audit singkat lalu laporkan: halaman Auth yang ada (Login, Register, Forgot/Reset Password, Verify Email), layout auth yang dipakai, komponen Input/Button/Checkbox/Toggle tema yang sudah ada, token warna/radius/ukuran compact di app.css, cara tema light/dark disimpan. Tunggu laporan selesai baru eksekusi. Pakai ulang komponen dan token yang sudah ada.

TUJUAN
Redesign visual Login dan Register: minimalist, modern, clean, konsisten dengan admin panel (token compact, radius kecil, ikon regular/outline, aksen primary yang berlaku).

STRUKTUR HALAMAN
Buat satu <AuthLayout> reusable (dipakai Login, Register, dan halaman auth lain) dengan 3 bagian:

A. TOP BAR
   - Kiri: wordmark kecil "ELQ Assessment 360" (opsional, tersembunyi di desktop bila kartu brand sudah menampilkannya).
   - Kanan: toggle tema Light/Dark. Pakai ulang mekanisme tema yang sudah ada (jangan buat yang baru). Berupa button ikon (matahari/bulan regular) dengan aria-label "Ganti tema", focus-visible jelas.
   - Tanpa border; menyatu dengan latar halaman.

B. DUA KARTU (desktop: berdampingan, dibungkus container terpusat, max-width ±880px)
   Kartu 1: BRAND / GRAPHIC (lebar kecil, ±300-340px)
     - Background gradasi halus dari token primary (50-100 di light, versi gelap semantik di dark) atau pola geometris sederhana (SVG inline / CSS, tanpa gambar eksternal berat).
     - Isi: ikon/wordmark ELQ, nama sistem "ELQ Assessment 360", tagline satu kalimat singkat (mis. "Umpan balik kepemimpinan 360 derajat"), dan 2-3 poin singkat bergaya minimalist (ikon + teks) tentang self, atasan, bawahan. Jangan mengarang klaim fitur di luar dokumen.
     - Dekoratif: aria-hidden pada elemen grafis; teks tetap terbaca (kontras AA).
     - Mobile (<768px): kartu ini berubah jadi header ringkas di atas kartu form (hanya wordmark + tagline), bukan disembunyikan total dan tidak memakan tinggi layar.
   Kartu 2: FORM (lebar utama, ±420-460px)
     - Di bagian atas: TAB TOGGLE "Masuk | Daftar" bergaya segmented control: wadah pill/rounded kecil background netral, segmen aktif background surface + border tipis + shadow sangat kecil, teks aktif kuat, non-aktif muted. Transisi halus (hormati prefers-reduced-motion).
     - Implementasi: dua Inertia <Link> ke route login dan register (bukan state palsu), segmen aktif ditentukan route saat ini, aria-current="page". Bungkus <nav aria-label="Pilih Masuk atau Daftar">. Navigasi tab tidak boleh mereset tema dan harus mempertahankan scroll di atas.
     - Di bawah tab: judul kecil + deskripsi singkat sesuai tab aktif, lalu form.

C. FOOTER
   - Teks tengah, kecil (12px), muted: "© 2026 ELQ Assessment". Tahun jangan hardcode: ambil dari new Date().getFullYear() atau shared prop, dengan teks "ELQ Assessment".
   - Tanpa border atas yang tebal; menempel di bawah (sticky footer via layout, bukan position absolute yang menimpa konten di layar kecil).

FORM LOGIN
   - Field: Email (ikon amplop), Password (ikon gembok + tombol tampil/sembunyikan password dengan ikon mata, aria-label dan aria-pressed), checkbox "Ingat saya" (bila Fortify sudah mendukung), link "Lupa password?" (rata kanan di dekat field password, ke route Fortify yang ada).
   - Tombol utama "Masuk" full-width, ikon panah/masuk regular di kiri label, state loading ("Memproses...") dan disabled saat submit (cegah double submit).
   - Error validasi inline di bawah field dengan role="alert"/aria-describedby; pesan gagal login tetap netral.

FORM REGISTER
   - Field sesuai yang sudah ada: Nama lengkap (ikon user), Email (ikon amplop), Perusahaan (ikon gedung), Jabatan (ikon tas kerja/briefcase), Password (ikon gembok + toggle mata), Konfirmasi password bila sudah ada.
   - Layout: satu kolom di mobile; di desktop Perusahaan dan Jabatan boleh berdampingan (dua kolom) agar kartu tidak terlalu tinggi.
   - Tombol "Daftar" full-width dengan ikon (mis. user-plus) dan state loading.
   - Teks bantu kecil: setelah mendaftar, tautan verifikasi akan dikirim ke email (sesuai FR-004). Jangan menjanjikan hal lain.

INPUT DENGAN IKON (komponen reusable)
   - Perluas komponen Input yang ada dengan prop opsional `icon` (leading) dan `trailing` (mis. toggle password). Jangan membuat komponen input kedua. Ikon di dalam input sebelah kiri, aria-hidden, warna muted, berubah ke primary saat focus-within; padding kiri menyesuaikan.
   - Ukuran/radius mengikuti token compact (tinggi 36px desktop, min 40-44px di mobile). Ikon regular/outline, 16px. Jangan fallback ke ikon solid; laporkan bila ada ikon tanpa versi regular.
   - Pemakaian prop ini juga memudahkan admin form lain di masa depan, tetapi JANGAN mengubah form admin di tugas ini.

RESPONSIF & TEMA
   - Desktop: dua kartu berdampingan, terpusat vertikal/horizontal. Tablet: kartu brand lebih sempit atau di atas. Mobile: header brand ringkas + kartu form, tanpa overflow horizontal.
   - Dark mode intentional: kartu brand dan kartu form memakai surface semantik, bukan invert dan bukan hitam pekat. Cek kontras teks, ikon, tab aktif, dan placeholder di kedua tema.
   - Tema awal mengikuti preferensi tersimpan/sistem tanpa flash tema salah saat load (gunakan mekanisme yang sudah ada).

AKSESIBILITAS (WCAG 2.2 AA)
   - Semantic HTML (<main>, <form>, <label> terhubung ke input, heading hierarchy: satu h1 per halaman).
   - Urutan tab logis: toggle tema, tab Masuk/Daftar, field, tombol. Focus-visible jelas di semua kontrol.
   - Autocomplete attribute benar (email, current-password, new-password, name, organization, organization-title).
   - Tidak ada clickable div; ikon-only button wajib aria-label.

ATURAN UMUM
   - Satu file = satu tanggung jawab. Komponen baru yang diharapkan: AuthLayout, AuthTopbar, AuthBrandCard, AuthTabs, (Input diperluas), serta halaman Login/Register yang tinggal menyusun komponen. Tidak ada file raksasa atau markup duplikat antara Login dan Register.
   - Semua warna lewat token semantik; jangan hardcode hex. Jangan tambah dependency tanpa alasan tertulis; jangan pakai Bootstrap; jangan ganti React/Inertia/Fortify.
   - Jangan menambah fitur (social login, captcha, dll.) di luar daftar.
   - Halaman auth lain (Lupa/Reset Password, Verifikasi Email, Konfirmasi Password) HARUS ikut memakai AuthLayout agar konsisten, tetapi tanpa tab toggle. Laporkan bila ada yang butuh penyesuaian lebih.
   - Perubahan inkremental dan reversible; jangan overwrite file tak terkait.

URUTAN FASE (berhenti dan lapor tiap fase, tunggu saya bilang lanjut)
Fase 1: Audit + AuthLayout (top bar tema, dua kartu, footer) + AuthBrandCard + AuthTabs.
Fase 2: Input dengan prop icon/trailing + form Login baru.
Fase 3: Form Register baru + terapkan AuthLayout ke halaman auth lain + cek responsif dan dark mode.

SETIAP FASE
Jalankan lint, typecheck, build (dan test bila ada). Jangan klaim PASS bila belum dijalankan. Format laporan:
Selesai / File ditambah / File diubah / Catatan arsitektur / Dependency ditambah / Validasi / Risiko & isu / Langkah berikutnya.

MULAI
Fase 1. Audit dulu dan laporkan sebelum mengubah file.
```

## Checklist verifikasi manual (setelah Fase 3)

- [ ] Login benar dan salah (pesan error netral), loading state tidak bisa double submit.
- [ ] Register sukses mengarah ke alur verifikasi email; error validasi muncul inline.
- [ ] Pindah tab Masuk/Daftar lewat klik dan keyboard; URL berubah sesuai route.
- [ ] Toggle tema light/dark berfungsi, tersimpan setelah refresh, tanpa flash.
- [ ] Tampilan di 3 lebar: desktop, tablet, mobile (375px) tanpa scroll horizontal.
- [ ] Kontras teks dan ikon di light dan dark; focus ring terlihat.
- [ ] Footer menampilkan "© 2026 ELQ Assessment" dan tidak menimpa konten di layar pendek.
- [ ] Lupa/Reset Password dan Verifikasi Email konsisten dengan layout baru.

## Tips

- Satu fase per sesi, commit git tiap fase supaya mudah rollback.
- Kalau aksen warna diganti (teal/indigo), cukup ubah token `--color-primary-*`; kartu brand otomatis mengikuti.
