# ELQ — Pemisahan Modul Users & Participants (Plan + Prompt)

Dokumen ini berisi (A) plan ringkas dan (B) prompt siap tempel untuk AI developer. Prompt B berdiri sendiri (provider-agnostic).

---

## A. PLAN

### A1. Kondisi → Target
| Aspek | Sekarang | Target |
|---|---|---|
| Menu **Users** | Menyatu dengan data peserta + tombol lihat hasil | Fokus **akses**: akun, role/hak akses, status aktif, reset password, activity log per user, data sampah. Tombol lihat hasil **dihapus** |
| Menu **Participants** (baru) | Belum ada | Data assessment: daftar, bulk action, detail, panel penilai, hasil, PDF |
| Detail penilai | Tersebar | Panel penilai di detail peserta (kirim ulang undangan, cabut link) |
| Akun peserta dibuat admin | Profil tidak jelas | Admin wajib isi `participant_profiles` (perusahaan, jabatan) saat membuat akun peserta |

### A2. Pembagian tanggung jawab
- **Users** = siapa yang boleh masuk dan apa yang boleh dilakukan.
- **Participants** = siapa yang dinilai dan bagaimana progres/hasilnya.
- Toggle aktif/nonaktif **hanya** di Users; di Participants tampil read-only + link ke Users.

### A3. Fase (tiap fase = 1 commit/branch, dapat di-rollback dengan `git revert`; tanpa migration destruktif)
1. **Audit & permission**: petakan route/controller/view yang mencampur user+peserta; rancang permission.
2. **Users dibersihkan**: hapus tombol & route lihat hasil dari Users, hapus kolom progres/penilai; tambah reset password, activity log per user, tab Data Sampah.
3. **Participants (read side)**: daftar server-side (cari/filter/sort/paginasi), detail, link ke hasil.
4. **Panel penilai**: kirim ulang undangan, cabut link.
5. **Bulk action** + aksi PDF.
6. **Pembuatan akun peserta oleh admin** + profil.
7. Test, regresi, redirect rute lama.

### A4. Proposal permission (usulan; tandai sebagai asumsi)
`users.view|create|update|delete|restore|reset-password|toggle-status`, `roles.manage` (FR-049), `activity.view`, `participants.view|update|bulk`, `results.view|export|share`, `raters.resend|revoke`. Role `admin` terkunci memiliki semua.

### A5. Requirement baru (nomor = usulan, belum ditetapkan Manager)
FR-052 Data Sampah Users (lihat & pulihkan soft delete) · FR-053 Admin memicu reset password (kirim tautan reset ke email user) · FR-054 Activity log per user · FR-055 Menu Participants · FR-056 Bulk action participants · FR-057 Kirim ulang undangan penilai oleh admin · FR-058 Cabut link penilai (ULID baru) · FR-059 Admin mengisi profil peserta saat membuat akun. FR-049 (hak akses role) bergantung butir Q-2 — pernyataan "Users fokus pada hak akses" dianggap menjawab Q-2 = dipertahankan; **konfirmasi**.

---

## B. PROMPT UNTUK AI DEVELOPER

### B0. Konteks (self-contained)
ELQ = sistem penilaian kepemimpinan 360° (self, atasan, bawahan; 39 butir; skala 1–6). Project SUDAH ada: **Laravel 13, PHP 8.3, React + Inertia, Tailwind v4, Vite, Fortify, MySQL 8.4, spatie/laravel-permission, spatie/laravel-activitylog, queue driver database**. Jangan buat ulang project, ganti stack, atau menambah package tanpa alasan tertulis. Standar: komponen kecil satu tanggung jawab, tanpa file raksasa, tanpa duplikasi, Form Request untuk validasi, Policy/permission untuk otorisasi (bukan `if admin`), Action/Service class untuk logika (bukan di controller), Eloquent/query builder berparameter (tanpa raw dari input user), Blade/React escaping, CSRF aktif, Pest untuk test, UI mobile-first (tabel → card di mobile, target sentuh ≥44px, WCAG 2.2 AA, dark mode, token desain yang sudah ada, ikon Font Awesome).

Fakta data (nama kolom ASLI harus dibaca dari migration; jangan menebak): `users` (+ soft delete, `is_active`, `email_verified_at`), `participant_profiles` (company, position), `companies`, `raters` (role self/boss/subordinate, ULID, `submitted_at`), `answers`, `email_logs`, `activity_log`. Relasi users–raters RESTRICT. Skor dihitung saat dibutuhkan, tidak disimpan. PDF tidak disimpan. Log tidak boleh memuat nilai jawaban, password, token, signed URL, isi PDF.

### B1. Langkah 0 — Audit singkat (maks 12 baris ringkasan sebelum coding)
Baca hanya: route + controller + halaman + policy untuk Users, hasil assessment, penilai/undangan; migration & model terkait; permission seeder; komponen DataTable/Dialog/Toast yang ada; Mail/Job undangan yang ada. Catat: apa yang dipindah, dihapus, dipakai ulang. Cek apakah `raters` punya mekanisme rotasi ULID dan job kirim undangan yang bisa dipanggil ulang.

### B2. Tugas

**1) Users (fokus akses)**
- Hapus tombol/route/kolom "lihat hasil" dan kolom progres/penilai dari Users. Beri redirect sementara dari rute lama bila ada link tersimpan.
- Daftar Users: cari (nama/email), filter role & status, paginasi server-side. Aksi baris: detail, ubah role/hak akses, aktif/nonaktif (konfirmasi), **reset password**, hapus (soft delete, konfirmasi).
- **Reset password oleh admin** = memicu email tautan reset (token sementara sekali pakai, lewat flow Fortify/FR-048) ke email user. Admin **tidak** mengetik/melihat password. Lewat queue + `email_logs` + `activity_log`. Rate limit.
- **Hak akses**: ubah role user; kelola permission role participant (FR-049); role admin terkunci & tidak bisa dicabut dari admin terakhir; admin tidak bisa menonaktifkan/menghapus dirinya sendiri.
- **Activity log per user**: tab pada detail user (read-only) memakai query `activity_log` terfilter (sebagai subjek **dan** sebagai pelaku), paginasi server-side, link ke halaman Audit Log penuh.
- **Data Sampah**: tab/tombol menampilkan user ber-soft-delete, aksi **Pulihkan** (konfirmasi) + bulk pulihkan. **Tidak ada hapus permanen** (lihat pertanyaan terbuka #1). Catat ke activity log.

**2) Participants (menu baru, grup Assessment)**
- Daftar server-side: kolom nama, perusahaan, jabatan, progres (self / atasan / bawahan n/3), status akun (read-only), diperbarui. Cari nama/email/perusahaan/jabatan (parameter binding), filter (perusahaan, status progres, status akun), sort, paginasi. Mobile: tampilan card.
- **Checkbox bulk action**: pilih per halaman + pilih semua di halaman; bar aksi muncul saat ada terpilih (sticky di mobile) dengan jumlah terpilih. Aksi bulk (usulan, lihat pertanyaan terbuka #4): **Kirim ulang undangan** (hanya penilai yang belum submit), **Kirim PDF hasil via email** (ke email akun peserta, via queue), **Ekspor daftar**. Server memvalidasi semua ID & otorisasi per item, batasi jumlah per request, jalankan lewat queue, kembalikan ringkasan (berhasil/dilewati/gagal + alasan). Konfirmasi dialog sebelum eksekusi.
- Aksi baris: Detail, **Lihat hasil assessment** (hanya jika ada rater submit & punya `results.view`), Unduh PDF, Kirim PDF. Halaman hasil sendiri mengikuti modul Result Review yang sudah ada — jangan dibuat ulang.
- **Detail peserta** (pusat operasional, read-only kecuali yang disebut): identitas & profil (perusahaan, jabatan — dapat diedit dengan `participants.update`), status akun (read-only + link ke Users), progres, **panel penilai** (kartu: atasan, 3 bawahan; email, status undangan, sudah/belum submit, waktu), timeline aktivitas peserta (activity log terfilter).
- **Panel penilai — kirim ulang undangan**: hanya untuk rater yang belum submit; memakai Job/Mail undangan yang ada; catat `email_logs` + `activity_log`; throttle per rater; tidak mengirim ke rater yang sudah submit.
- **Panel penilai — cabut link**: membuat **ULID baru** sehingga link lama tidak valid (FR-009); hanya untuk rater yang belum submit (assessment submit final tidak boleh berubah); konfirmasi dialog; opsi "kirim link baru sekarang"; catat activity log **tanpa** token/URL. Link lama harus menampilkan halaman "link tidak tersedia" (FR-041).

**3) Pembuatan akun peserta oleh admin**
- Di form Create User: pilih role; bila `participant`, tampil seksi profil **wajib** (perusahaan — pilih/tambah ke master `companies`, jabatan). Simpan user + profile + role dalam satu transaksi. Akun buatan admin dianggap langsung terverifikasi (asumsi Q-4, belum dikonfirmasi) dan tetap menerima email untuk set password lewat flow reset (bukan password dikirim lewat email).
- Participants tidak punya tombol "tambah" terpisah (satu sumber pembuatan akun) — lihat pertanyaan terbuka #3.

**4) Navigasi**
Sidebar admin: Assessment → **Participants**, Assessment Results (jika sudah ada); Administration → **Users** (+ Role/Hak akses, Activity Log, Mail Log). Item menu muncul sesuai permission.

### B3. Batasan
- Jangan ubah skema secara destruktif; migration baru hanya bila benar-benar perlu (mis. permission seeder, index), disertai `down()`. Tidak ada penghapusan data permanen.
- Jangan ubah alur assessment, perhitungan skor, atau halaman hasil.
- Frontend hanya menyembunyikan UI; otorisasi tetap di backend (Policy/permission).
- Jangan hard-code data produksi; jangan tinggalkan `console.log`.
- Ambigu/berdampak bisnis → catat di "Pertanyaan terbuka", jangan diasumsikan diam-diam.

### B4. Test (Pest)
- Permission: tanpa izin → 403 untuk tiap aksi baru; peserta tidak bisa mengakses Users/Participants.
- Users: tombol/route hasil sudah hilang; reset password mengirim email via queue & token sekali pakai, admin tidak pernah menerima password; soft delete + pulihkan; admin terakhir/diri sendiri tidak bisa dinonaktifkan/dihapus.
- Create user participant: profil wajib, transaksi atomik (gagal profil → user tidak terbentuk), company dibuat bila belum ada.
- Participants: pencarian aman (input berisi karakter SQL tidak merusak query), filter, paginasi.
- Bulk: ID tidak valid/tak berwenang dilewati dengan laporan; batas jumlah; rater submitted tidak dikirimi undangan; email_logs terisi.
- Resend/Revoke: ULID berubah, link lama ditolak (FR-041), rater submitted ditolak, activity log tanpa token/URL.

### B5. Cara kerja & validasi
Kerjakan sesuai fase A3, berhenti per fase sampai hijau. Jalankan type-check, lint, `pest`, build; **jangan klaim PASS bila tidak dijalankan**. Hemat output: laporkan path, jangan cetak ulang isi file.

### B6. Laporan akhir (singkat)
Completed · Files added/modified/removed · Route yang dihapus/di-redirect · Permission baru · Dependencies (idealnya none) · Validation (PASS/FAIL nyata) · Langkah rollback · Known issues · Pertanyaan terbuka.

### B7. Pertanyaan terbuka (jangan diasumsikan; sertakan di laporan akhir)
1. Data Sampah: apakah perlu hapus permanen? (default: tidak; retensi/purge user ditunda per v2.1, dan hapus permanen butuh backup manual.)
2. FR-049/Q-2 dianggap dipertahankan — konfirmasi.
3. Pembuatan akun peserta hanya via Users? (usulan: ya.)
4. Daftar bulk action final (usulan: kirim ulang undangan, kirim PDF, ekspor daftar). Unduh PDF massal tidak dibuat karena PDF tidak disimpan dan berat; ZIP massal perlu keputusan.
5. Cabut link: perlu catatan alasan? Perlu notifikasi ke peserta? (default: tidak.)
6. Nomor FR-052–059 hanya usulan.
