# PROMPT UNTUK CLAUDE CODE (mulai dari sini)

## 1. Peran dan tujuan

Kamu Senior Laravel Engineer. Kerjakan HANYA lapisan data proyek ELQ (Effective Leadership Questionnaire, penilaian 360 derajat): migration, enum, model, factory, seeder, test Pest. Tulis kode lengkap dan siap jalan.

## 2. Sumber kebenaran

- Skema: `elq_schema_v2_1.dbml` (17 tabel). Baca SEKALI, termasuk komentar header dan Note tiap tabel (berisi aturan bisnis).
- Jika prompt ini bertentangan dengan DBML, DBML menang. Jika DBML ambigu atau mustahil diimplementasikan: berhenti dan ajukan SATU pertanyaan. Jangan mengarang.
- Jangan mengarang konten bisnis (teks pertanyaan, nama sub-dimensi, dll).
- Konvensi framework: jangan mengandalkan memori. Verifikasi dengan tool Boost `search-docs` (atau baca dokumentasi versi terpasang) untuk: Eloquent Laravel 13, spatie/laravel-permission, spatie/laravel-activitylog, Fortify. Cukup satu pencarian per topik.

## 3. Aturan hemat token (wajib)

- Jangan cetak isi file ke chat. Jangan menjelaskan kode yang baru kamu tulis. Laporan per fase maksimal 5 baris.
- Jangan baca ulang file yang sudah dibaca. Jangan membaca `vendor/` (pakai dokumentasi Boost).
- Gunakan `php artisan make:*` dengan `--no-interaction` (mis. `make:model X -mf`) lalu isi file; jangan menulis boilerplate dari nol.
- Jalankan test terarah (`vendor/bin/pest --filter=...` atau per file) saat bekerja. Full suite hanya di Fase 5.
- Jangan menjalankan npm, Vite, atau menyentuh frontend.
- Jangan `git commit` atau `git push`.

## 4. Aturan keras (anti-kesalahan)

1. Tabel dan migration bawaan starter kit/package JANGAN ditulis ulang atau diduplikasi: `users`, `password_reset_tokens`, `sessions`, `cache`, `jobs`, `failed_jobs`, `job_batches`, tabel spatie permission, dan `activity_log`. Hanya `users` yang diubah (lihat Fase 1).
2. Kolom `two_factor_*` dan trait `TwoFactorAuthenticatable` bawaan Fortify: JANGAN dihapus dan JANGAN diubah. Biarkan apa adanya (di luar lingkup).
3. Jangan mengubah `config/fortify.php`, `app/Actions/Fortify/*`, controller, route, view, atau halaman React. Cukup laporkan bila perlu.
4. Jangan menambah package baru, kecuali paket yang SUDAH disepakati dan ternyata belum ada di `composer.json`: `spatie/laravel-permission`, `spatie/laravel-activitylog`. Semua harus open-source. `laravel/breeze` tidak dipakai; jangan diinstal atau dipakai.
5. Jangan memanggil `env()` di luar folder `config/`. Nilai dari `.env` dibaca lewat `config()`.
6. Migration tidak boleh bergantung pada class aplikasi (enum, model). Tulis nilai literal di migration; sinkronisasi dengan enum dijaga oleh test.
7. `migrate:fresh` atau `migrate:reset` HANYA di database lokal (cek `APP_ENV=local` dan `DB_DATABASE` adalah DB dev). Jangan pernah di DB lain.
8. Jangan membuat model `Answer` dan `EmailLog` mencatat activity log. Nilai jawaban TIDAK BOLEH masuk activity log. Password, `remember_token`, token apapun, dan URL bertanda tangan TIDAK BOLEH masuk activity log.
9. `is_active` pada `User` TIDAK boleh masuk fillable (hanya diubah eksplisit oleh admin).
10. Jangan implementasikan logika bisnis (aturan submit final, ScoreCalculator, validasi 1 atasan + 3 bawahan). Itu tahap berikutnya.
11. Jangan membuat/instansiasi model di dalam `boot()`/`booted()` model (dilarang di Laravel 13).
12. Modul DISC (`peserta`, `kepribadian`, `kepribadian_groups`) dan `login_attempts` TIDAK dibuat.

## 5. FASE 0: Inspeksi (output ringkas, maks 12 baris)

Jalankan dan rangkum dalam satu tabel pendek:

- `php -v`; versi terpasang (`composer show`) untuk: `laravel/framework`, `laravel/fortify`, `inertiajs/inertia-laravel`, `spatie/laravel-permission`, `spatie/laravel-activitylog`, `pestphp/pest`.
- Daftar isi: `database/migrations`, `app/Models`, `database/factories`, `database/seeders`, `tests`.
- Baca: model `User`, `UserFactory`, `DatabaseSeeder`, `phpunit.xml`, `tests/Pest.php`, bagian `features` di `config/fortify.php`, `config/database.php` (bagian mysql: charset/collation).
- Dari `.env` hanya baca `DB_CONNECTION` dan `DB_DATABASE` (jangan cetak rahasia).
- Gaya properti model bawaan (`#[Fillable]`/`#[Hidden]` atau `$fillable`/`$hidden`): ikuti gaya yang SUDAH dipakai `User`, konsisten di semua model baru.
- Apakah `Schema::Blueprint` versi terpasang punya cara native untuk CHECK constraint (cek dokumentasi). Bila ada, pakai; bila tidak, pakai `DB::statement` (Fase 1).
- Cek koneksi: `php artisan migrate:status` berhasil ke MySQL.

BERHENTI dan laporkan bila: PHP < 8.3; MySQL tidak terhubung; DB test sama dengan DB dev; versi spatie permission/activitylog tidak kompatibel dengan Laravel 13 terpasang; atau `users` sudah berisi data yang bukan data awal starter kit.

Catatan versi: `spatie/laravel-activitylog` v5 mensyaratkan PHP 8.4+, memakai namespace berbeda dari v4 (trait di `Spatie\Activitylog\Models\Concerns`, `LogOptions` di `Spatie\Activitylog\Support`), dan menyimpan perubahan atribut di kolom `attribute_changes`. Ikuti API versi YANG TERPASANG; jangan mencampur gaya v4 dan v5. Tabel `activity_log` mengikuti migration hasil publish package (boleh berbeda dari gambaran di DBML).

## 6. FASE 1: Migration

### 6.1 Prasyarat package

- Jika spatie permission/activitylog belum terpasang: `composer require` keduanya.
- Publish migration package sesuai dokumentasi versi terpasang (activitylog: tag `activitylog-migrations`). Jangan publish config bila tidak perlu diubah. Setelah publish, pastikan prefix timestamp migration package tidak mengacaukan urutan.

### 6.2 Ubah migration `users` bawaan (jangan buat migration baru yang duplikat)

Karena project masih baru, ubah migration pembuat `users`. Hasil akhir tabel `users` sesuai DBML: `name`, `email` (unique), `phone` (null, 20), `password`, `email_verified_at` (null), `remember_token`, `is_active` boolean default true (+ index bernama `users_is_active_idx`), `last_login_at` (timestamp null), `timestamps`, `softDeletes`. Biarkan `password_reset_tokens` dan `sessions` apa adanya. Jangan sentuh migration two-factor.

### 6.3 Tabel kustom (satu migration per tabel)

Urutan (sesuai dependensi): `companies`, `participant_profiles`, `dimensions`, `sub_dimensions`, `questions`, `raters`, `answers`, `settings`, `email_logs`.

Gunakan `php artisan make:migration create_xxx_table` secara berurutan. Pastikan prefix timestamp UNIK dan urut sesuai dependensi (rename bila ada yang sama), lalu cek dengan `php artisan migrate:status`.

Aturan implementasi DBML ke Laravel:

- PK/FK: `id()` dan `foreignId()` (BIGINT UNSIGNED). `varchar(n)` ke `string('col', n)`. `char(26)` untuk `raters.ulid` ke `ulid('ulid')->unique()`. `boolean` ke `boolean()`. `smallint` ke `smallInteger()`. `tinyint` ke `tinyInteger()`, kecuali `email_logs.attempts` ke `unsignedTinyInteger()`. `text` ke `text()`.
- Ikuti persis: tipe, panjang, nullability, default, unique, nama index, nama unique yang tertulis di DBML.
- `answers` TIDAK memakai `timestamps()` (DBML tidak punya `created_at/updated_at`).
- `created_at/updated_at` pada tabel lain: `timestamps()`. `deleted_at`: `softDeletes()` hanya pada `users`, `sub_dimensions`, `questions`.
- Perilaku hapus FK sesuai bagian `Ref` di DBML, tulis eksplisit: `cascadeOnDelete()`, `restrictOnDelete()`, `nullOnDelete()`.
- Hindari index redundan: bila sebuah index/unique composite sudah memiliki kolom FK sebagai prefix kiri, deklarasikan index tersebut SEBELUM definisi foreign key agar MySQL tidak membuat index otomatis tambahan. Verifikasi dengan `php artisan db:table <tabel>`.
- `down()` wajib benar pada setiap migration kustom.

### 6.4 CHECK constraint (nama constraint eksplisit, di migration yang sama setelah tabel dibuat)

Jalankan hanya bila driver `mysql`/`mariadb` (bungkus dengan pengecekan `DB::getDriverName()`). Bila Blueprint versi terpasang punya cara native, pakai itu; bila tidak, `DB::statement`:

| Tabel      | Nama constraint              | Ekspresi                                                                            |
| ---------- | ---------------------------- | ----------------------------------------------------------------------------------- |
| raters     | `raters_role_check`          | `role IN ('self','boss','subordinate')`                                             |
| raters     | `raters_email_by_role_check` | `(role = 'self' AND email IS NULL) OR (role <> 'self' AND email IS NOT NULL)`       |
| answers    | `answers_value_range_check`  | `value BETWEEN 1 AND 6`                                                             |
| email_logs | `email_logs_type_check`      | `type IN ('rater_invitation','email_verification','password_reset','result_share')` |
| email_logs | `email_logs_status_check`    | `status IN ('queued','sent','failed')`                                              |

`down()`: `ALTER TABLE <tabel> DROP CHECK <nama>` sebelum drop tabel.

Selesai Fase 1: `php artisan migrate:fresh` (lokal) harus bersih. Laporkan 1 baris.

## 7. FASE 2: Enum dan Model

### 7.1 Enum (`app/Enums`, string-backed)

- `UserRole`: `Admin='admin'`, `Participant='participant'`.
- `RaterRole`: `SelfRater='self'`, `Boss='boss'`, `Subordinate='subordinate'` (jangan memakai nama case `Self`, kata cadangan PHP).
- `EmailLogType`: `rater_invitation`, `email_verification`, `password_reset`, `result_share`.
- `EmailLogStatus`: `queued`, `sent`, `failed`.
- `PermissionName`: daftar permission (lihat 8.2).

### 7.2 Model (`app/Models`)

Aturan umum: tipe return pada semua relasi; casts memakai cara yang dipakai `User` bawaan; fillable eksplisit (jangan unguard); `HasFactory`.

- `User` (ubah yang ada, pertahankan trait/fillable/hidden bawaan termasuk atribut two-factor): tambahkan `HasRoles` (spatie), `SoftDeletes`, `LogsActivity`, dan `implements MustVerifyEmail`. Tambah `phone` ke fillable. Relasi: `participantProfile()` hasOne, `raters()` hasMany (FK `participant_id`), `emailLogs()` hasMany. Scope `active()`. Cast `is_active` boolean, `last_login_at` datetime.
- `Company`: hasMany `participantProfiles`.
- `ParticipantProfile`: belongsTo `user`, `company`.
- `Dimension`: hasMany `subDimensions`, hasManyThrough `questions`; cast `is_active`; scope `active()` dan `ordered()` (sort_order).
- `SubDimension`: SoftDeletes; belongsTo `dimension`; hasMany `questions`; scope `ordered()`. Nama tabel `sub_dimensions` (cek konvensi, set eksplisit bila perlu).
- `Question`: SoftDeletes; belongsTo `subDimension`; hasMany `answers`; scope `ordered()`.
- `Rater`: PK tetap `id` auto-increment; kolom `ulid` dibuat otomatis lewat `HasUlids` dengan override `uniqueIds()` mengembalikan `['ulid']` (verifikasi pola ini di dokumentasi; bila tidak sesuai, isi ulid di event `creating`). `getRouteKeyName()` = `'ulid'`. Cast `role` ke `RaterRole`, `submitted_at` datetime. Relasi: `participant()` belongsTo `User` (FK `participant_id`), `answers()`, `emailLogs()`. Scope `submitted()`, `pending()`, `forRole(RaterRole)`. Method `isSubmitted()`. Jangan menaruh aturan immutability di model.
- `Answer`: `$timestamps = false`; belongsTo `rater`, `question`. TIDAK memakai LogsActivity.
- `Setting`: kolom `name` unik, `value` text. Helper static `get(string $name, mixed $default = null)` dan `set(string $name, mixed $value)`. Boolean disimpan sebagai `'1'`/`'0'`, null sebagai NULL; dokumentasikan di komentar singkat.
- `EmailLog`: belongsTo `rater` dan `user` (keduanya nullable); cast `type` ke `EmailLogType`, `status` ke `EmailLogStatus`, `queued_at/sent_at/failed_at` datetime. TIDAK memakai LogsActivity.
- `Role`/`Permission`: pakai model bawaan spatie (tidak dibuat ulang).

### 7.3 Activity log

Pasang `LogsActivity` HANYA pada: `User`, `ParticipantProfile`, `Company`, `Dimension`, `SubDimension`, `Question`, `Setting`, `Rater`. Konfigurasi per model: `logOnly([...])` atribut aman, hanya yang berubah (dirty), tanpa log kosong, nama log per domain (`users`, `master`, `questionnaire`, `settings`, `raters`).

- `User`: log hanya `name`, `email`, `phone`, `is_active`. DILARANG: `password`, `remember_token`, atribut `two_factor_*`.
- `Question`: log `text` dan `sub_dimension_id` (nilai lama dan baru).
- `Rater`: log `role`, `email`, `submitted_at`.
- `Setting`: log `name`, `value`.

### 7.4 Provider

Di `AppServiceProvider::boot()` tambahkan `Model::shouldBeStrict(! app()->isProduction())`. Setelah itu jalankan test bawaan starter kit. Jika kode starter kit melanggar mode strict, JANGAN ubah kode starter kit: turunkan cakupan (aktifkan hanya `Model::preventLazyLoading(...)`), lalu laporkan. JANGAN memakai morph map pada tahap ini.

## 8. FASE 3: Factory dan Seeder

### 8.1 Factory

- `UserFactory` (ubah yang ada): sesuaikan kolom baru (`phone`, `is_active=true`); pertahankan pola password ter-cache dan state `unverified()` bawaan. Tambah state `inactive()`, `admin()`, `participant()` (assign role dengan `Role::findOrCreate`, guard `web`; role dibuat bila belum ada). `withProfile()` untuk membuat `ParticipantProfile` terkait.
- Factory baru: `Company`, `ParticipantProfile`, `Dimension`, `SubDimension`, `Question`, `Rater`, `Answer`, `EmailLog`, `Setting`.
- `Rater` states: `selfRater()`, `boss()`, `subordinate()`, `submitted()`. Data WAJIB lolos CHECK (self tanpa email; boss/subordinate dengan email). Default factory membuat email unik per peserta.
- `Answer`: `value` acak 1 sampai 6.
- `EmailLog` states: `queued()`, `sent()`, `failed()` (status, attempts, timestamp, error_message konsisten).
- Teks `Question` di factory adalah PLACEHOLDER dev/test; beri komentar singkat bahwa bukan konten asli.

### 8.2 Seeder (semua idempotent: aman dijalankan berulang)

Seeder mengisi hanya data referensi dan data awal; jangan menimpa perubahan yang sudah dibuat admin.

1. `RolePermissionSeeder`:
    - Awali dengan reset cache permission spatie (`PermissionRegistrar::forgetCachedPermissions()`).
    - `findOrCreate` role `admin` dan `participant` (guard `web`) dan semua permission dari enum `PermissionName`.
    - `admin` SELALU `syncPermissions(semua)`. `participant` hanya diberi permission default bila role baru saja dibuat (jangan timpa pengaturan admin).
    - Permission USULAN (satu tempat di enum, mudah diubah): `users.manage`, `roles.permissions.manage`, `dimensions.manage`, `sub-dimensions.manage`, `questions.manage`, `participants.view`, `results.view`, `results.share`, `results.export`, `activity-log.view`, `email-log.manage`, `settings.manage`, `raters.manage-own`, `assessment.fill-self`. Default `participant`: `raters.manage-own`, `assessment.fill-self`.
2. `SettingSeeder`: `firstOrCreate` empat kunci (tidak menimpa): `activity_log_purge_enabled='0'`, `activity_log_retention_days=NULL`, `email_log_purge_enabled='0'`, `email_log_retention_days=NULL`.
3. `QuestionnaireSeeder`: jangan mengisi konten sendiri. Baca `database/seeders/data/questionnaire.json`. Buat juga `questionnaire.example.json` (placeholder) dan dokumentasi format singkat di komentar seeder:
   `{"dimensions":[{"name":"","sort_order":1,"sub_dimensions":[{"name":"","sort_order":1,"questions":[{"text":"","sort_order":1}]}]}]}`
    - Jalankan HANYA bila tabel `questions` kosong (impor awal) agar tidak menggandakan atau menimpa hasil edit admin. Bila `questionnaire.json` tidak ada: lewati dengan pesan jelas di console.
4. `AdminUserSeeder`: kredensial dari `config('elq.admin.name|email|password')`; buat `config/elq.php` yang membaca `env('ADMIN_NAME')`, `env('ADMIN_EMAIL')`, `env('ADMIN_PASSWORD')`, dan tambahkan ketiga key (tanpa nilai) ke `.env.example`. Jangan hardcode kredensial. Bila kosong: lewati dengan peringatan. Karena `is_active` dan `email_verified_at` tidak fillable, gunakan `User::firstOrNew(['email'=>...])->forceFill([...])->save()` (bukan `firstOrCreate`, yang akan membuang atribut non-fillable atau melempar error pada mode strict). Admin: `is_active=true`, `email_verified_at` terisi, role `admin`.
5. `DemoSeeder` (HANYA environment `local`/`testing`; di luar itu keluar tanpa efek): beberapa perusahaan, peserta berprofil, set penilai lengkap per peserta (1 self, 1 boss, 3 subordinate) dengan sebagian `submitted` dan jawaban lengkap untuk semua pertanyaan yang ada, beberapa `email_logs` berstatus berbeda. Bila belum ada pertanyaan, buat sedikit placeholder lewat factory.
6. `DatabaseSeeder`: ganti isi bawaan starter kit (user "Test User"); panggil berurutan: `RolePermissionSeeder`, `SettingSeeder`, `QuestionnaireSeeder`, `AdminUserSeeder`, `DemoSeeder`.

## 9. FASE 4: Test Pest (`tests/Feature/Data/`)

- Test memakai MySQL (CHECK, collation, FK spesifik MySQL). Jika `phpunit.xml` memakai SQLite, ubah ke `DB_CONNECTION=mysql` dan `DB_DATABASE=<db test>` (pastikan BERBEDA dari DB dev), dan laporkan perubahan itu. Test bawaan starter kit harus tetap lulus.
- Gunakan `RefreshDatabase`, `expect()`, dataset Pest bila membantu, nama test deskriptif berbahasa Indonesia. Uji constraint lewat `DB::table()->insert()` (melewati guard model) dan `expect(fn () => ...)->toThrow(QueryException::class)`.

Cakupan minimum:

1. Skema: semua tabel ada; `peserta`, `kepribadian`, `kepribadian_groups`, `login_attempts` tidak ada; `users` punya `is_active`, tidak punya `status`/`expired`; tabel `answers` tanpa `created_at`.
2. CHECK: `raters` (self dengan email ditolak; boss tanpa email ditolak; role tak dikenal ditolak), `answers` (0 dan 7 ditolak; 1 dan 6 diterima), `email_logs` (type/status tak dikenal ditolak). Sinkronisasi enum: setiap case `RaterRole`, `EmailLogType`, `EmailLogStatus` DITERIMA oleh CHECK terkait.
3. Unique dan FK: `(participant_id, email)`, `(rater_id, question_id)`, `ulid`, `legacy_code`; FK orphan ditolak.
4. Perilaku hapus: hapus `Rater` meng-cascade `answers`; hapus `User` yang masih punya `Rater` ditolak (restrict); hapus `Dimension` yang punya `SubDimension` ditolak; hapus `Rater` men-set NULL `email_logs.rater_id`; soft delete bekerja pada `users`, `sub_dimensions`, `questions`.
5. Model: relasi, cast enum, ulid otomatis terisi (26 karakter) sementara PK tetap integer auto-increment, route key = ulid, scope, `is_active` default true, `is_active` tidak mass-assignable, password ter-hash.
6. Activity log: ubah `Question` mencatat nilai lama dan baru; perubahan `User` tidak memuat `password`, `remember_token`, atau `two_factor_*` pada data log (periksa seluruh baris log yang dihasilkan secara version-agnostic, mis. serialisasi JSON baris `Activity`); membuat `Answer` dan `EmailLog` tidak menghasilkan log.
7. Factory: semua state menghasilkan data valid (termasuk lolos CHECK).
8. Seeder: dijalankan dua kali menghasilkan jumlah baris sama; admin tidak dibuat bila config kosong; role `admin` memiliki semua permission; permission `participant` tidak tertimpa pada seed kedua; `QuestionnaireSeeder` tidak menggandakan data; `DemoSeeder` tidak berjalan pada environment production.

## 10. FASE 5: Verifikasi dan laporan

Jalankan dan pastikan semuanya hijau:

1. `php artisan migrate:fresh --seed` (lokal)
2. `php artisan migrate:status` (semua Ran; tidak ada tabel bawaan duplikat)
3. `php artisan db:table raters` dan `db:table answers`, `db:table email_logs` (cek index, FK, tanpa index redundan; CHECK constraint ada)
4. `php artisan migrate:reset` lalu `php artisan migrate` (menguji `down()` seluruh migration)
5. `vendor/bin/pest` (full suite, termasuk test bawaan starter kit)
6. `vendor/bin/pint --dirty`

Laporan akhir (maksimal 25 baris, tanpa mengulang kode):

1. Daftar file dibuat/diubah, dikelompokkan per jenis.
2. Hasil enam langkah verifikasi di atas (lulus/gagal per baris).
3. Versi terpasang yang relevan (Laravel, Fortify, spatie permission, spatie activitylog, PHP) dan keputusan yang bergantung pada versi.
4. Penyimpangan dari DBML atau prompt beserta alasannya (termasuk bila mode strict diturunkan atau `phpunit.xml` diubah).
5. Temuan di starter kit yang perlu keputusan Anda (mis. status fitur two-factor dan email verification di `config/fortify.php`, `CreateNewUser` belum menerima perusahaan dan jabatan).
6. Asumsi yang dipakai: permission usulan (Q-2), admin langsung terverifikasi (Q-4), purge log awal nonaktif (Q-5).
7. TODO tahap berikutnya (jangan dikerjakan sekarang): pencatatan activity log untuk login/logout/role-permission/kirim email, event listener `last_login_at`, ScoreCalculator, aturan submit final dan validasi 1 atasan + 3 bawahan, registrasi dengan perusahaan dan jabatan, Signed URL penilai, antrean email, migrasi data legacy, ekspor `questionnaire.json` dari legacy.

## 11. Di luar lingkup (jangan dikerjakan)

Controller, route, FormRequest, Policy, Job, Mail, Notification, Service/Action, halaman React/Inertia, perubahan Fortify, migrasi data legacy, modul DISC, morph map, dan commit git.
