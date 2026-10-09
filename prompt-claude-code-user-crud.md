# PROMPT UNTUK CLAUDE CODE (mulai dari sini)

## 1. Tujuan

Bangun modul **CRUD Pengguna** untuk Administrator: tabel dengan pencarian, pagination server-side 10 data per halaman, checkbox bulk action, kolom aksi (edit, hapus), dan form create/edit dengan checkbox hak akses. Untuk role Peserta, hak akses yang tampil hanya yang terkait assessment.

## 2. Sumber kebenaran

- Skema: `elq_schema_v2_1.dbml`. Tabel yang dipakai: `users`, `participant_profiles`, `companies`, tabel spatie permission, `activity_log`.
- Jika prompt ini bertentangan dengan DBML, DBML menang. Jika ambigu atau mustahil: berhenti dan ajukan SATU pertanyaan. Jangan mengarang.
- Konvensi framework: jangan mengandalkan memori. Verifikasi dengan Boost `search-docs` (satu pencarian per topik) untuk: Inertia v3 (Form, router, pagination), Wayfinder, Laravel 13 (authorization, validation, controller), shadcn/ui, Tailwind v4.

## 3. Keputusan desain (final, jangan diubah tanpa bertanya)

1. **Hak akses per pengguna = permission langsung (direct permission) spatie** dan menjadi sumber kebenaran. Role (`admin`, `participant`) TIDAK membawa permission default untuk peserta, supaya checkbox benar-benar bisa mencabut hak. Administrator memperoleh semua hak lewat `Gate::before` (bypass untuk role `admin`), bukan lewat checkbox.
2. **Peserta**: hanya grup permission "Assessment" yang tersedia: `raters.manage-own`, `assessment.fill-self`. Server MENOLAK permission lain untuk peserta. Pada form create, kedua permission ini tercentang default.
3. **Admin**: checkbox ditampilkan tercentang dan nonaktif (disabled), dengan teks "Administrator memiliki seluruh hak akses". Tidak dikirim ke server dan tidak disimpan.
4. **Role** dipilih saat create dan TIDAK dapat diubah saat edit (tampil read-only).
5. **Perusahaan** (khusus peserta): input teks dengan saran dari master `companies`; disimpan dengan `firstOrCreate` (trim).
6. **Akun yang dibuat admin** langsung terverifikasi (`email_verified_at = now()`). Saat update, `email_verified_at` tidak diubah.
7. **Bulk action** (hanya pada halaman aktif): Aktifkan, Nonaktifkan, Hapus (soft delete).
8. **Proteksi**: tidak boleh menghapus atau menonaktifkan diri sendiri; tidak boleh menghapus atau menonaktifkan admin aktif TERAKHIR. Pada bulk, item yang dilindungi dilewati dan hasilnya dilaporkan (berhasil/dilewati beserta alasan).
9. **Pencarian**: nama, email, telepon, nama perusahaan, jabatan.

## 4. Aturan hemat token (wajib)

- Jangan cetak isi file ke chat dan jangan menjelaskan kode yang baru ditulis. Laporan per fase maksimal 5 baris.
- Jangan baca ulang file yang sudah dibaca; jangan baca `vendor/` dan `node_modules/`.
- Gunakan `php artisan make:*` dengan `--no-interaction`.
- Jalankan test terarah saat bekerja; full suite hanya di Fase 3.
- Jangan `git commit` atau `git push`.

## 5. Aturan keras (anti-kesalahan)

1. **Jangan mengubah struktur yang ada.** Jangan memindah, mengganti nama, atau merefactor file bawaan. Struktur baru harus mengikuti konvensi resmi Laravel 13, Inertia v3, React 19, shadcn/ui, dan Tailwind v4, serta pola yang SUDAH dipakai starter kit di project ini (periksa dulu di Fase 0).
2. **Tidak ada migration baru.** Skema sudah lengkap. Jika merasa perlu mengubah skema: berhenti dan tanya.
3. **Jangan menambah dependensi** composer atau npm. Satu-satunya pengecualian: komponen shadcn/ui yang belum ada boleh ditambahkan HANYA lewat CLI resmi (`npx shadcn@latest add <komponen>`) bila `components.json` ada; sebutkan di laporan. Jangan membuat primitif UI manual. Jangan memakai DataTables, TanStack Table, atau library tabel lain.
4. Jangan mengubah `config/fortify.php`, `app/Actions/Fortify/*` (boleh DIBACA untuk reuse aturan password), migration, atau modul DISC.
5. File hasil generate Wayfinder (`resources/js/actions`, `resources/js/routes`, `resources/js/wayfinder` atau sejenisnya) JANGAN diedit manual. Regenerasi dengan cara yang dipakai starter kit (cek `vite.config.ts`/`package.json`/perintah `wayfinder:generate`).
6. Dilarang `dangerouslySetInnerHTML`, raw SQL dari input, `any`, `@ts-ignore`, dan `window.confirm`.
7. Dilarang `->update()`/`->delete()` massal lewat query builder untuk bulk action: itu melewati event model sehingga tidak tercatat di activity log. Proses per model (maksimal 100 id per request) di dalam `DB::transaction`.
8. Jangan `env()` di luar `config/`. Jangan mengekspos `password`, `remember_token`, atau `two_factor_*` ke frontend.
9. `is_active` tidak fillable: set eksplisit di Action. Jangan membuat/instansiasi model di `boot()` model.
10. Aturan otorisasi: gunakan `Gate::authorize(...)` atau middleware `can:` (jangan middleware alias `role:`/`permission:` spatie, karena alias belum tentu terdaftar di Laravel 13).

## 6. FASE 0: Inspeksi (output ringkas, maks 12 baris)

Periksa dan rangkum:

- Versi: `laravel/framework`, `inertiajs/inertia-laravel`, `@inertiajs/react`, `react`, `tailwindcss`, `laravel/wayfinder`, spatie permission/activitylog; `php -v`.
- `package.json` (scripts lint/types/build/format), `vite.config.ts`, `components.json`, `resources/js/app.tsx` (pola resolve halaman dan huruf besar/kecil nama folder).
- Komponen di `resources/js/components/ui` yang sudah ada; layout (`resources/js/layouts`), navigasi sidebar, tipe di `resources/js/types`, pola flash message/toast, pola halaman form (mis. settings/profile), `HandleInertiaRequests::share`.
- Backend: `routes/web.php` (apakah ada pola `require __DIR__.'/settings.php'`), `app/Http/Controllers`, `app/Enums/PermissionName.php`, `RolePermissionSeeder`, model `User`, `bootstrap/app.php`, ada/tidaknya `Gate::before` di `AppServiceProvider`.
- Aturan password Fortify yang bisa dipakai ulang (mis. trait `PasswordValidationRules`).
- Apakah `Model::shouldBeStrict` aktif (berarti lazy loading melempar error; WAJIB eager load).

BERHENTI dan laporkan bila: prasyarat lapisan data belum ada (enum `PermissionName`, role/permission ter-seed, `users.is_active`); Inertia bukan v3 atau React bukan 19; atau starter kit tidak memakai pola yang disebut di sini sehingga perlu keputusan Anda.

## 7. FASE 1: Backend

### 7.1 Penyesuaian kecil pada yang sudah ada (tanpa mengubah struktur)

- `PermissionName`: tambahkan metode `group()` dan `label()` (Bahasa Indonesia), serta metode statis yang mengembalikan permission untuk role: `forRole(UserRole)` (admin = semua; participant = grup Assessment saja) dan `defaultsFor(UserRole)` (participant = `raters.manage-own`, `assessment.fill-self`).
- `RolePermissionSeeder`: hapus pemberian permission default pada role `participant` (keputusan desain 1). Role `admin` tetap `syncPermissions(semua)`. Perbarui test seeder lapisan data yang terdampak.
- `AppServiceProvider::boot()`: bila belum ada, tambahkan `Gate::before(fn (User $user) => $user->hasRole(UserRole::Admin->value) ? true : null)`.
- `HandleInertiaRequests::share`: tambahkan flag kecil `auth.can.manage_users` (bool) untuk menampilkan menu; perbarui tipe TS terkait. Tidak ada perubahan lain pada `share`.

### 7.2 Struktur baru (sesuai konvensi Laravel 13)

- Routes: file `routes/admin.php` (ikuti pola `settings.php` bila starter punya; jika tidak, taruh di `routes/web.php`). Grup: `middleware(['auth','verified','can:users.manage'])->prefix('admin')->name('admin.')`. Daftarkan `users/bulk` SEBELUM resource agar tidak bentrok dengan `{user}`:
  `Route::post('users/bulk', UserBulkController::class)->name('users.bulk');`
  `Route::resource('users', UserController::class)->except(['show']);`
- Controller (`app/Http/Controllers/Admin`): `UserController` (index, create, store, edit, update, destroy) dan `UserBulkController` (invokable). Controller tipis: validasi lewat FormRequest, otorisasi lewat `Gate::authorize`, logika di Action.
- FormRequest (`app/Http/Requests/Admin`): `IndexUserRequest` (`search` nullable string max 100; `page` integer min 1), `StoreUserRequest`, `UpdateUserRequest`, `BulkUserRequest`.
    - `name` required string max 255; `email` required `email:rfc` max 255, di-lowercase dan di-trim di `prepareForValidation`, unik (abaikan diri sendiri saat update; catat bahwa unique juga menghitung user soft-deleted); `phone` nullable string max 20 dengan pola angka, spasi, `+`, `-`, `(`, `)`.
    - `password`: wajib saat create; opsional saat update (kosong = tidak berubah); pakai aturan password yang sama dengan registrasi Fortify (reuse) + `confirmed`.
    - `role` hanya saat create: `Rule::enum(UserRole::class)`.
    - `is_active` boolean.
    - `company_name` (required jika role participant, string max 255) dan `position` (required jika participant, string max 100); diabaikan untuk admin.
    - `permissions`: array, setiap item `Rule::in(PermissionName::forRole($role))`, distinct. Untuk admin: abaikan/kosongkan.
    - `BulkUserRequest`: `action` in `activate|deactivate|delete`; `ids` array 1 sampai 100, tiap item integer distinct.
- Policy `UserPolicy` (auto-discovery): `viewAny/create/update/delete` memeriksa `users.manage`; `delete` menolak target = diri sendiri. Aturan "admin aktif terakhir" ditegakkan di Action (bukan di Policy) agar tidak ada query per baris.
- Actions (`app/Actions/Users`), semua write di `DB::transaction`:
    - `ListUsers`: `User::query()->with(['roles','participantProfile.company'])`, pencarian dengan parameter binding dan **escape karakter LIKE** (`\`, `%`, `_`) pada kata kunci, `orWhereHas` untuk perusahaan/jabatan, urutan stabil `created_at desc, id desc`, `paginate(10)->withQueryString()`.
    - `CreateUser`: buat user (password lewat cast `hashed`, jangan hash ganda), set `is_active`, `email_verified_at = now()`, assign role; bila participant: `firstOrCreate` company + buat `ParticipantProfile`; sinkronkan permission langsung (peserta saja).
    - `UpdateUser`: update field; password hanya bila diisi; update profil peserta; `syncPermissions` untuk peserta; role tidak berubah; tolak menonaktifkan diri sendiri dan admin aktif terakhir.
    - `DeleteUsers` dan `SetUsersActive`: dipakai oleh destroy tunggal DAN bulk; proses per model; kembalikan ringkasan `{berhasil, dilewati[alasan]}`.
    - Setelah perubahan permission, catat satu entri activity log eksplisit (`activity('users')->performedOn($user)->withProperties(['permissions' => [...nama...]])->log(...)`); jangan menyertakan data sensitif.
- Controller `index` mengirim props Inertia: `users` (paginator hasil `->through(...)`, hanya field: `id, name, email, phone, is_active, role, company, position, email_verified (bool)`, `can_delete` (id != user login)), `filters` (`search`), dan hanya untuk create/edit: `permissionGroups` (katalog grup + label), `companies` (daftar nama dari master), serta untuk edit data user + permission langsung. Gunakan partial reload (`only`) di sisi klien.
- Flash message mengikuti pola yang sudah ada di starter kit (jangan menambah library toast).

### 7.3 Test Pest (`tests/Feature/Admin/Users/`)

Gunakan `assertInertia` untuk komponen dan props. Cakupan minimum:

1. Akses: tamu diarahkan ke login; peserta mendapat 403; admin lolos. User belum verified ditolak.
2. Index: 25 user menghasilkan 10 pada halaman 1 dan 5 pada halaman 3; urutan stabil; `search` menemukan berdasarkan nama, email, telepon, perusahaan, jabatan; `%` dan `_` diperlakukan literal (tidak mencocokkan semua baris); tidak ada lazy loading (mode strict aktif).
3. Store: admin dan peserta berhasil; email di-lowercase; password ter-hash dan `email_verified_at` terisi; peserta wajib perusahaan dan jabatan; perusahaan dibuat `firstOrCreate` (nama sama beda huruf tidak menggandakan); peserta menolak permission di luar grup Assessment; admin tidak menyimpan permission langsung; email duplikat ditolak.
4. Update: password kosong tidak mengubah hash; role tidak berubah; `syncPermissions` benar (mencabut dan menambah); tidak bisa menonaktifkan diri sendiri; `email_verified_at` tidak berubah.
5. Destroy: soft delete; tidak bisa menghapus diri sendiri; tidak bisa menghapus admin aktif terakhir.
6. Bulk: aktifkan/nonaktifkan/hapus pada campuran id; item terlindungi dilewati dan ringkasan benar; lebih dari 100 id ditolak; id tidak ada ditolak.
7. Activity log: create/update/delete user tercatat; perubahan permission tercatat; tidak ada `password`, `remember_token`, atau `two_factor_*` pada data log.
8. Otorisasi permission: peserta dengan `raters.manage-own` tidak bisa mengakses `admin/users`.

Jalankan `vendor/bin/pest tests/Feature/Admin/Users` hingga hijau sebelum lanjut.

## 8. FASE 2: Frontend (React 19 + TypeScript + Tailwind v4)

### 8.1 Struktur dan konvensi

- Halaman di folder yang sesuai pola `resolve` starter kit (cek huruf besar/kecil; nama komponen pada `Inertia::render` harus identik dengan path file). Usulan: `pages/admin/users/index.tsx`, `create.tsx`, `edit.tsx`, dan komponen bersama `pages/admin/users/components/` (`user-form.tsx`, `users-table.tsx`, `pagination.tsx`, `bulk-actions-bar.tsx`, `permission-checkboxes.tsx`, `delete-dialog.tsx`) atau lokasi komponen yang dipakai starter kit.
- Gunakan layout aplikasi dan breadcrumbs starter kit; tambahkan satu item menu "Pengguna" pada konfigurasi navigasi sidebar yang sudah ada, tampil hanya bila `auth.can.manage_users`.
- Tipe di `resources/js/types` (mis. `user-management.ts`): `ManagedUser`, `Paginated<T>` (pakai tipe yang sudah ada bila ada), `PermissionGroup`, `UserFilters`. TypeScript strict, tanpa `any`.
- Semua URL lewat helper Wayfinder; jangan hardcode path. Gunakan `<Form>` Inertia v3 dengan objek Wayfinder (`action={store()}`) mengikuti pola halaman form starter kit; pakai `useForm` hanya bila memang diperlukan.
- Teks UI Bahasa Indonesia.

### 8.2 Halaman index

- Tabel semantik memakai komponen `Table` shadcn (`th scope="col"`, `aria-label` pada setiap checkbox). Kolom: checkbox, Nama, Email, Role (badge), Perusahaan/Jabatan (sembunyikan di layar kecil: `hidden md:table-cell`), Status (badge Aktif/Nonaktif), Aksi.
- Kontainer tabel `overflow-x-auto`; tata letak mobile-first.
- Pencarian: input dengan debounce 300 ms (tanpa lodash; bersihkan timer di cleanup effect; jangan memicu request saat mount). Gunakan `router.get` dengan `preserveState`, `preserveScroll`, `replace`, `only: ['users','filters']`. Perubahan kata kunci mereset ke halaman 1 (jangan kirim `page`).
- Pagination: bangun dari meta paginator (`current_page`, `last_page`, `from`, `to`, `total`, `prev_page_url`, `next_page_url`) dengan jendela halaman dan elipsis. JANGAN merender `links[].label` (berisi entitas HTML). Gunakan `Link` Inertia dengan `preserveScroll`. Tampilkan "Menampilkan X sampai Y dari Z".
- Indikator loading ringan saat kunjungan Inertia berlangsung (mis. kurangi opasitas baris); jangan memblokir layar.
- Keadaan kosong yang informatif.
- Seleksi: `Set<number>` di state lokal; checkbox header dengan status `indeterminate`; seleksi HANYA untuk halaman aktif. Reset seleksi saat halaman atau pencarian berubah dengan memberi `key` pada komponen isi tabel (jangan menyinkronkan state dengan `useEffect`). Jangan menyalin data server ke state.
- Bar bulk muncul bila ada seleksi: "N dipilih" + tombol Aktifkan, Nonaktifkan, Hapus. Hapus memakai `AlertDialog` shadcn (konfirmasi). Kirim dengan `router.post(bulk.url(), {action, ids}, {preserveScroll: true, onSuccess: kosongkan seleksi})`. Tampilkan ringkasan dilewati/berhasil dari flash.
- Kolom aksi: tombol ikon Edit (`Link`) dan Hapus (membuka `AlertDialog`), keduanya dengan `aria-label`; tombol Hapus nonaktif bila `can_delete` false.
- Key baris = `id`, bukan index.

### 8.3 Form create/edit

- Field: nama, email, telepon, password dan konfirmasi (edit: opsional dengan petunjuk "kosongkan bila tidak diubah"), switch status aktif (nonaktif untuk diri sendiri), role (create: pilihan; edit: teks read-only), perusahaan (input teks + `datalist` dari `companies`) dan jabatan hanya bila role peserta, kemudian bagian Hak Akses.
- Bagian Hak Akses: grup permission dengan checkbox bernama `permissions[]`. Peserta: hanya grup Assessment, default tercentang pada create. Admin: seluruh checkbox tercentang dan `disabled` + teks informasi (nilai tidak terkirim). Pergantian role pada create menampilkan bagian yang sesuai; field yang tidak relevan tidak dirender atau `disabled` supaya tidak terkirim.
- Tampilkan error validasi per field (`aria-invalid`, `aria-describedby`), state `processing` pada tombol submit, dan tombol Batal.

### 8.4 Tailwind v4 dan UI

- Konfigurasi Tailwind v4 berbasis CSS yang sudah ada; JANGAN membuat atau mengubah `tailwind.config.js` dan JANGAN mengubah tema. Gunakan token semantik starter kit (`bg-background`, `text-muted-foreground`, `bg-primary`, dst.) agar dark mode tetap benar; hindari warna hardcode. Gunakan helper `cn()` bawaan.
- Gunakan utilitas v4; hindari utilitas v3 yang dihapus/diganti (`bg-opacity-*`, `text-opacity-*`, `flex-shrink-*`, `flex-grow-*`, `overflow-ellipsis`, `outline-none` diganti `outline-hidden`). Bila ragu, cek dokumentasi lewat Boost.
- Tanpa style inline dan tanpa `@apply` baru.

### 8.5 React 19

- Function component saja, props bertipe eksplisit, tanpa efek untuk state turunan, tanpa `useMemo`/`useCallback` kecuali ada alasan jelas (periksa apakah React Compiler aktif di starter kit; bila aktif, jangan memoize manual). Ikuti ESLint/Prettier project.

## 9. FASE 3: Verifikasi dan laporan

Jalankan dan pastikan hijau (gunakan nama script yang ADA di `package.json`):

1. `vendor/bin/pint --dirty`
2. `vendor/bin/pest` (full suite, termasuk test bawaan starter kit dan test lapisan data)
3. Lint dan format frontend (script lint/format starter kit)
4. Type check TypeScript (script types starter kit atau `npx tsc --noEmit`)
5. `npm run build` (memastikan Wayfinder dan Vite berhasil)
6. `php artisan route:list --path=admin/users` (periksa 7 route: index, create, store, edit, update, destroy, bulk)

Laporan akhir (maksimal 25 baris, tanpa mengulang kode):

1. File dibuat/diubah, dikelompokkan backend, frontend, test.
2. Hasil enam langkah verifikasi.
3. Komponen shadcn yang ditambahkan lewat CLI (bila ada).
4. Penyimpangan dari prompt beserta alasan.
5. Asumsi/keputusan desain yang dipakai (nomor 1 sampai 9 pada bagian 3) dan dampaknya pada FR-049 (Kelola Hak Akses Role): checkbox per pengguna menggantikan matriks per role; perlu konfirmasi.
6. Catatan: unique email tetap berlaku untuk user soft-deleted; registrasi mandiri (Fortify `CreateNewUser`) belum memberi permission default peserta secara langsung.
7. TODO tahap berikutnya (jangan dikerjakan sekarang): pemberian permission default pada registrasi mandiri, halaman pengelolaan data penilai, penyesuaian tema biru PPM Manajemen, tampilan pengguna terhapus (trash) bila diperlukan.

## 10. Di luar lingkup (jangan dikerjakan)

Migration, perubahan Fortify, registrasi mandiri, CRUD role/group, matriks permission per role, halaman peserta/hasil/laporan, impor-ekspor pengguna, filter lanjutan dan sorting kolom, tampilan trash, dan commit git.
