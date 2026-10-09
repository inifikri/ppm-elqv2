# PROMPT: Revisi Modul Registrasi — 3 Tahap (Data diri → Akun → Selesai)

Peran: Senior Laravel + React engineer, security-minded. Ini **revisi** modul registrasi yang sudah ada, bukan penulisan ulang. Jangan mengarang requirement; tandai keputusan di luar permintaan sebagai **ASUMSI**.

## 0. Hemat token (WAJIB)
- Modifikasi file yang ada; **jangan** membuat ulang yang sudah benar. Cari dengan `grep`/`glob`, baca hanya bagian relevan (bukan seluruh file/folder).
- Baca `CLAUDE.md` dan hanya rule `.ai/rules` yang glob-nya cocok. Pakai ulang komponen UI (shadcn/Radix, button, input, card) dan pola SPA yang sudah dipakai repo (Inertia/API) — jangan perkenalkan pola baru.
- Tanpa dokumentasi tambahan, tanpa skrip tinker. Test sempit: `php artisan test --compact --filter=Register`, lalu `vendor/bin/pint --dirty --format agent`.
- Laporan akhir ≤ 20 baris, tanpa menempel ulang kode.

## 1. Pre-flight (singkat)
1. Temukan halaman register React, Action/FormRequest, endpoint `check-email` & `companies/suggest`, komponen password-strength/combobox yang sudah ada, dan test Register yang ada.
2. Catat selisih antara kondisi sekarang vs requirement di bawah, lalu tulis rencana perubahan (≤ 10 baris) dan kerjakan.

## 2. Requirement perubahan

### 2.1 Placeholder (field wajib punya placeholder; label tetap ada)
| Field | Placeholder |
|---|---|
| Nama lengkap | `Masukkan nama lengkap Anda` |
| Password | `Minimal 8 karakter` |
| Konfirmasi password | `Ulangi password Anda` |
Periksa juga field lain agar konsisten (email: `nama@perusahaan.com`, jabatan: `Contoh: Manajer HR`). Teks lewat file lang/konstanta yang sudah dipakai repo.

### 2.2 Wizard 3 tahap (satu POST final)
| Tahap | Isi | Tombol |
|---|---|---|
| 1 · Data diri | Nama lengkap, Perusahaan, Jabatan | Lanjut |
| 2 · Akun | Email, Password, Konfirmasi password, Captcha | Kembali · Daftar |
| 3 · Selesai | Layar sukses: instruksi cek email verifikasi, email disamarkan (`jo***@mail.com`), tombol Kirim ulang (cooldown, throttle yang sudah ada), tautan ke Login | — |

- State semua tahap disimpan di client (satu form state); data **tidak hilang** saat Kembali/Lanjut. **Satu** request `POST /register` di akhir tahap 2; tahap 3 tampil hanya setelah server sukses.
- "Lanjut" ditolak (tombol disabled + pesan jelas) sampai field tahap itu valid. Server **tetap memvalidasi semua field**; bila error milik tahap sebelumnya, pindahkan user ke tahap tersebut dan fokus ke field error.
- **ASUMSI:** email ditempatkan di tahap "Akun" (grouping Akun = email + kredensial). Mudah dipindah bila ingin di tahap 1.
- Stepper minimalis modern: 3 titik/segmen + label, tahap aktif aksen biru, tahap selesai bertanda centang, teks "Langkah X dari 3" (`aria-current="step"`). Transisi halus antar tahap, hormati `prefers-reduced-motion`. Fokus dipindah ke judul/field pertama tiap tahap. Enter = aksi utama tahap. Mobile-first, tap target sesuai kelas touch yang ada.

### 2.3 Perusahaan & Jabatan
- Dua field **masing-masing satu baris penuh** (hapus grid 2 kolom).
- Perusahaan: sesuaikan dengan spesifikasi sebelumnya — combobox autocomplete (shadcn `Popover`+`Command` atau komponen combobox yang sudah ada), ≥2 karakter, debounce 300 ms, `AbortController`, cache per-term di client, maks. 8 saran, sorot teks cocok tanpa HTML mentah, opsi `Gunakan "<teks>" sebagai perusahaan baru`, keyboard & ARIA lengkap. Server: `GET companies/suggest` prefix-match pada `name_normalized` (ter-index, `%`/`_` di-escape, binding), `Cache-Control: private, max-age=60`, throttle; saat submit cari-atau-buat via `name_normalized` dalam transaksi + tangani unique-violation. Jika sudah ada dan sesuai, **cukup rapikan**, jangan tulis ulang.

### 2.4 Email: tidak bisa lanjut jika tidak valid / tidak ditemukan
- Cek via `POST register/check-email` (CSRF aktif, throttle ketat), dipicu saat blur (dan debounce setelah format valid). Respons `{ status: "ok" | "invalid" | "domain_not_found" | "taken" }`.
  - `invalid`: format salah. `domain_not_found`: domain email tidak punya MX/A (tidak ditemukan). `taken`: sudah terdaftar (alert + tautan Login).
- Tombol **Daftar disabled** selama status ≠ `ok` (juga saat cek sedang berjalan). Pesan inline berbeda per status, `role="alert"`.
- Server memakai **logika yang sama** di FormRequest (rule/class `EmailDomainChecker`): tidak bisa dilewati dengan memanggil POST langsung. Cache hasil DNS per domain (mis. 24 jam), timeout pendek, dapat dimatikan via config `REGISTER_EMAIL_DNS_CHECK` (server on-premise bisa tanpa DNS keluar). Bungkus dalam class agar test bisa di-fake tanpa jaringan.
- **ASUMSI:** "tidak ditemukan" = domain email tidak ada. Keberadaan mailbox **tidak dapat** diverifikasi andal; bukti sebenarnya adalah email verifikasi. Cantumkan di laporan.

### 2.5 Password (sama dengan spesifikasi sebelumnya)
- Aturan: min 8, huruf besar + kecil + angka (konstanta/aturan **satu sumber** dipakai client dan `Password::min(8)->letters()->mixedCase()->numbers()` di server; `uncompromised()` hanya bila config aktif).
- Indikator kekuatan (bar 4 segmen + label) dan checklist aturan live; tombol tampil/sembunyi (`aria-pressed`); konfirmasi: blokir paste/drop/klik-kanan, `autocomplete="off"`, status cocok real-time. Password tidak pernah di-log/di-flash. "Daftar" disabled sampai password valid & cocok.
- Jangan tambah dependency (mis. zxcvbn) tanpa persetujuan — berhenti dan ajukan.

## 3. Keamanan (cek, jangan lemahkan)
CSRF di semua request AJAX · output ter-escape · tanpa raw query dari input · mass assignment aman · throttle `register`, `check-email`, `companies/suggest`, captcha, resend · captcha+honeypot+min-time tetap diverifikasi di server · registrasi tetap atomik dalam transaksi (Action) · activity log tanpa password/token · tidak ada email/password di URL atau access log.

## 4. Test (Pest; perbarui yang ada, tambah seperlunya, jangan hapus)
- Register valid → akun dibuat, email verifikasi diantre, `email_verified_at` null.
- Email: `invalid`, `domain_not_found` (checker di-fake), `taken` (beda kapitalisasi) → ditolak di endpoint **dan** di `POST /register`; `ok` lolos; throttle → 429.
- Password lemah / tidak cocok → ditolak server; password ter-hash.
- Error milik field tahap 1 dari server dikembalikan dengan key field yang benar (agar UI bisa pindah tahap).
- Perusahaan: tidak duplikat untuk beda kapitalisasi/spasi; suggest ≥2 karakter, maks 8, `%`/`_` ter-escape.
- Jika repo punya test frontend (Vitest/RTL): wizard tidak lanjut saat invalid, state bertahan saat Kembali. Jika tidak ada, jangan menambah tooling.

## 5. Batasan
Tanpa dependency baru tanpa persetujuan · jangan sentuh modul login/DISC · jangan nonaktifkan CSRF/escaping · migration (jika perlu) wajib `down()` + catatan backup/rollback · bila perubahan UI tak tampak, minta user menjalankan `npm run dev`/`build`.

## 6. Laporan akhir (≤ 20 baris)
1) Ringkasan · 2) file diubah (path + 1 baris) · 3) **Fakta / Rekomendasi / Asumsi** · 4) hasil test + Pint · 5) risiko & rollback · 6) keputusan user: posisi email di tahap, arti "tidak ditemukan", `REGISTER_EMAIL_DNS_CHECK` untuk server on-premise · 7) langkah uji manual (daftar 3 tahap → Mailtrap → verifikasi).
