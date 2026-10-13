# PROMPT: Modul Login 2 Tahap — ELQ Revamp

Peran: Senior Laravel + React engineer, security-minded. Tulis kode lengkap, ikuti konvensi repo, jangan mengarang requirement. Label setiap keputusan non-dokumen sebagai **ASUMSI** di laporan akhir.

## 0. Aturan hemat token (WAJIB)
- Jangan baca ulang seluruh file/folder. Pakai `grep`/`glob` lalu baca hanya bagian relevan.
- Baca `CLAUDE.md` dan, jika ada, `.ai/rules/index.md` + hanya rule yang glob-nya cocok dengan path yang disentuh.
- Jangan menulis dokumentasi tambahan, jangan membuat skrip tinker/verifikasi (test sudah cukup).
- Jalankan test **sempit** saja (`php artisan test --compact --filter=Login`), lalu `vendor/bin/pint --dirty --format agent`.
- Laporan akhir ≤ 25 baris; jangan menempel ulang kode, cukup path.

## 1. Pre-flight (ringkas, ≤ 10 langkah)
1. `composer show --direct` & `package.json`: catat versi Laravel, Fortify/Breeze/Inertia, spatie permission/activitylog, Pest, React, Tailwind, shadcn/Radix.
2. Tentukan pola SPA yang **sudah dipakai** (Inertia, atau API + Sanctum/session). **Ikuti pola itu**; jangan memperkenalkan pola baru.
3. `php artisan route:list --except-vendor --path=login` dan cari controller/Action/halaman login yang ada (`grep -ril login app resources routes`).
4. Cek komponen UI yang ada (button, input, card, label, alert) dan token warna biru. **Pakai ulang.**
5. Cek tabel `users` (`is_active`, `email_verified_at`), `activity_log`, dan driver cache (`config:show cache.default`).
Tulis rencana file (≤ 10 baris) lalu kerjakan.

## 2. Requirement
**Fakta dokumen (v2.1):** FR-001 login: batasi percobaan, validasi kredensial, periksa verifikasi email & status akun (nonaktif ditolak), session terenkripsi, redirect sesuai role. FR-043 pesan gagal. FR-044 log aktivitas (tanpa password/token). Bagian 8: rate limiting login, percobaan gagal dicatat ke activity_log. Hash bcrypt legacy tetap valid & di-rehash otomatis.

**Permintaan user (baru):**
1. Login **2 tahap**: (a) input email → cek terdaftar; (b) jika terdaftar → input password.
2. **3 kesempatan** password. Setelah kesempatan habis → **countdown 30 detik**. Jika **salah ke-4 kali** → sistem **memerintahkan reset password**.
3. UI/UX modern & minimalis.

### 2.1 Aturan percobaan (state mesin, server-side sebagai sumber kebenaran)
| Kejadian (per kunci `email+IP`) | Hasil |
|---|---|
| Salah ke-1, ke-2 | Pesan gagal + sisa kesempatan ("Sisa 2 kesempatan") |
| Salah ke-3 | Kunci **30 detik** (`locked_until`); server menolak semua percobaan, **termasuk password benar**, dengan HTTP 429 + `retry_after` |
| Setelah 30 detik, salah ke-4 | Respons `reset_required`: UI menampilkan instruksi reset + tombol ke halaman lupa password (email terisi otomatis). Login password untuk kunci itu **diblokir** sampai reset berhasil atau `LOGIN_HARD_LOCK_MINUTES` berlalu |
| Login sukses | Counter & kunci dihapus, session di-regenerate |

**ASUMSI (konfirmasi di laporan):** "kesempatan habis" = 3 kegagalan; kegagalan ke-4 terjadi pada percobaan pertama setelah countdown. Durasi blokir keras = `LOGIN_HARD_LOCK_MINUTES` (default 15, di config). Jendela hitung kegagalan 15 menit tanpa aktivitas (counter kedaluwarsa).

### 2.2 Tahap 1 — cek email
- `POST /login/identify` {email} → `{ registered: bool }`. Throttle ketat (mis. 10/menit/IP), POST (bukan GET), email di-trim+lowercase, query Eloquent binding.
- Risiko *user enumeration* diterima karena kebutuhan bisnis; mitigasi: throttle, pesan netral, tidak mencatat email ke access log. **Status akun (nonaktif/belum verifikasi) TIDAK diungkap di tahap 1**; hanya `registered`.
- Email tidak terdaftar → pesan "Email belum terdaftar" + tautan Daftar. Tidak lanjut ke tahap 2.

### 2.3 Tahap 2 — password
- Submit `POST /login` {email, password} (+ CSRF/session sesuai pola SPA). Validasi ulang email di server (jangan percaya tahap 1).
- Urutan cek di server: lock/hard-lock aktif? → kredensial → jika benar: akun nonaktif → pesan umum "Akun tidak dapat digunakan, hubungi admin" (tanpa membuka bahwa password benar secara eksplisit selain itu); belum verifikasi → arahkan ke halaman verifikasi email; sukses → `session()->regenerate()` + redirect sesuai role (admin/participant).
- Email tak terdaftar yang dikirim langsung ke `/login` diperlakukan **sama** (hitung counter, pesan sama) agar tidak jadi oracle tambahan.
- Counter via service `LoginAttemptLimiter` (cache atomik: `Cache::lock`/`increment`), kunci `hash(email|ip)`, **bukan** logika di controller. Tambah throttle global per-IP pada `/login` (mis. 20/menit) terhadap credential stuffing lintas email.
- Respons error terstruktur: `{ message, attempts_left?, retry_after?, reset_required? }`; `retry_after` dalam detik dari server.
- activitylog: `login_success`, `login_failed`, `login_locked`, `login_reset_required`. **Dilarang** mencatat password/token. Gunakan mekanisme log yang sudah ada.
- Pesan Bahasa Indonesia lewat file lang.

## 3. UI/UX (React + Tailwind v4 + komponen shadcn/Radix yang ada)
- Satu kartu terpusat, latar lembut, aksen biru (token yang sudah ada), ruang putih lega, satu tombol primer.
- **Tahap 1:** logo, judul "Masuk", field email (autofocus, `autocomplete="username"`, `inputmode="email"`), tombol "Lanjut", tautan "Daftar".
- **Tahap 2:** transisi halus (hormati `prefers-reduced-motion`); email tampil sebagai chip + tombol "Ganti" (kembali ke tahap 1, password dikosongkan); field password (`autocomplete="current-password"`, tombol tampil/sembunyi berlabel + `aria-pressed`, autofocus), tombol "Masuk", tautan "Lupa password".
- Info sisa kesempatan di bawah field (teks, bukan hanya warna).
- **Countdown:** hitung mundur dari `retry_after` server (bukan timer klien sebagai sumber kebenaran; tetap benar setelah refresh karena status diambil dari server), indikator progres tipis, tombol Masuk `disabled` selama hitung, otomatis aktif di 0. Update teks ke `aria-live="polite"` per kelipatan 5 detik (jangan tiap detik).
- **reset_required:** panel jelas + tombol "Reset password" (route lupa password, email dibawa); form password disembunyikan/disable.
- State lengkap: loading (cegah double submit), error, 429 umum, jaringan gagal. Fokus dikelola saat pindah tahap/error. Tap target pakai kelas touch yang sudah ada (`pointer-coarse:h-touch` bila ada). Mobile-first, kontras ≥ 4.5:1, `aria-invalid`/`aria-describedby`.
- Jangan menambah dependency baru tanpa persetujuan (berhenti dan ajukan).

## 4. Keamanan (checklist)
CSRF aktif · tanpa raw query dari input · output ter-escape · session terenkripsi + regenerate saat login · tidak ada password di log/flash/response · rate limit identify, login, per-IP global · counter atomik (tahan race/paralel) · password benar saat terkunci tetap ditolak · rehash otomatis bcrypt legacy tetap berfungsi · tidak ada pembukaan status akun sebelum password benar.

## 5. Test Pest (factory; `Cache` bersih per test; `Carbon::setTestNow`/travel untuk waktu)
- Identify: terdaftar→true, tidak→false, format invalid→422, throttle→429, tanpa CSRF ditolak.
- 2 salah → `attempts_left` menurun; salah ke-3 → 429 + `retry_after≈30`.
- Saat terkunci: password benar tetap 429.
- Setelah 30 dtk: salah ke-4 → `reset_required`, dan percobaan berikutnya (walau benar) ditolak sampai hard-lock habis/reset.
- Sukses mereset counter & session id berubah; redirect sesuai role.
- Nonaktif & belum verifikasi (password benar) → perlakuan sesuai 2.3; password salah tidak membocorkan status.
- Email tak terdaftar ke `/login` → respons/counter setara.
- Activity log terisi dan tidak memuat password.
- Hash bcrypt legacy tetap bisa login & ter-rehash bila cost beda.

## 6. Batasan
Jangan ubah stack/dependency, jangan nonaktifkan CSRF/escaping, jangan menyentuh modul register/DISC, jangan hapus test. Migration (bila perlu, mis. kolom/tabel pendukung) wajib punya `down()` dan catatan rollback + backup; **pilih cache dulu, hindari migration jika memungkinkan.** Jika frontend tak berubah, minta user menjalankan `npm run dev`/`build`.

## 7. Laporan akhir (≤ 25 baris)
1) Ringkasan hasil · 2) daftar file (path + 1 baris) · 3) **Fakta dokumen / Rekomendasi / Asumsi** (3 daftar) · 4) hasil test + Pint · 5) risiko & rollback · 6) hal yang perlu keputusan user (arti "kesempatan ke-4", durasi hard-lock, konflik v2.1 vs React SPA) · 7) langkah uji manual.
