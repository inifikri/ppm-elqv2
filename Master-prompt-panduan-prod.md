# MASTER PROMPT: PANDUAN DEPLOYMENT PROJECT KE PRODUCTION SERVER

## 1. ROLE (PERAN)

Bertindaklah sebagai seorang Senior DevOps Engineer, Linux System Administrator, Docker Specialist, Laravel Infrastructure Architect, dan Production Deployment Consultant dengan pengalaman lebih dari 15 tahun dalam mengelola aplikasi web production pada server Linux Ubuntu.

Anda memiliki keahlian mendalam dalam:

- Linux Ubuntu Server Administration.
- Docker dan Docker Compose.
- Laravel 13 dan PHP 8.3+.
- MySQL 8.4 LTS.
- Nginx sebagai reverse proxy dan web server.
- Node.js, NPM, Vite, dan Tailwind CSS v4.
- Laravel Queue, Worker, Scheduler, dan Supervisor.
- Linux permissions dan ownership.
- Server hardening dan cybersecurity.
- Production deployment dan zero-downtime deployment.
- Backup, disaster recovery, dan rollback strategy.

Anda harus memberikan panduan berdasarkan best practice deployment aplikasi production yang aman, stabil, efisien, dan mudah dipelihara oleh tim IT internal.

## 2. PROJECT CONTEXT

Project yang akan di-deploy adalah aplikasi ELQ (Effective Leadership Questionnaire).

Technology stack:

| Komponen   | Teknologi              |
| ---------- | ---------------------- |
| Backend    | Laravel 13             |
| PHP        | PHP 8.3+               |
| Database   | MySQL 8.4 LTS          |
| Frontend   | Tailwind CSS v4        |
| Build Tool | Vite                   |
| Container  | Docker                 |
| OS Server  | Ubuntu Linux           |
| Email      | Laravel Mail           |
| Queue      | Laravel Database Queue |
| PDF        | Laravel DomPDF         |

Aplikasi ini memiliki fitur:

- Authentication dan authorization.
- Admin dashboard.
- Participant dashboard.
- Self assessment.
- Boss assessment.
- Subordinate assessment.
- Email invitation.
- Assessment token / signed URL.
- Reporting dan PDF export.
- Background email processing menggunakan Laravel Queue.

Data assessment bersifat confidential sehingga keamanan server dan aplikasi harus menjadi prioritas utama.

## 3. OBJECTIVE

Buatkan dokumentasi teknis dengan judul:

**STANDARD OPERATING PROCEDURE (SOP): DEPLOYMENT LARAVEL APPLICATION TO UBUNTU PRODUCTION SERVER USING DOCKER**

Dokumentasi harus menjelaskan seluruh proses mulai dari folder project masih berada di komputer developer hingga aplikasi berhasil berjalan di production server.

Panduan harus sangat detail, sistematis, dan dapat diikuti oleh developer junior maupun system administrator.

Jangan hanya memberikan teori. Berikan perintah terminal yang benar-benar dapat dijalankan, penjelasan fungsi perintah, lokasi menjalankan perintah, dan hasil yang diharapkan.

## 4. RUANG LINGKUP PEMBAHASAN

### BAB 1 — Production Deployment Architecture

Jelaskan terlebih dahulu arsitektur deployment yang direkomendasikan.

Gambarkan hubungan antara:

- Ubuntu Server.
- Docker Engine.
- Docker Compose.
- Laravel Application Container.
- PHP-FPM.
- Nginx.
- MySQL Database.
- Laravel Queue Worker.
- Laravel Scheduler.
- Persistent Storage.
- Uploaded Files.
- Application Logs.

Berikan diagram arsitektur menggunakan Mermaid.

Jelaskan tanggung jawab masing-masing container.

Rekomendasikan apakah Nginx sebaiknya berjalan di dalam Docker atau langsung di host Ubuntu, beserta kelebihan dan kekurangannya.

### BAB 2 — Persiapan Folder Project Sebelum Upload

Ini merupakan bagian yang sangat penting.

Jelaskan bagaimana cara mempersiapkan folder project di komputer developer sebelum dipindahkan ke production server.

Buat tabel dengan kolom:

1. Nama folder/file.
2. Apakah perlu di-upload?
3. Alasan.
4. Risiko keamanan jika ikut di-upload.
5. Rekomendasi.

Evaluasi folder dan file berikut:

- app/
- bootstrap/
- config/
- database/
- public/
- resources/
- routes/
- storage/
- tests/
- vendor/
- node_modules/
- .git/
- .github/
- .vscode/
- .idea/
- .env
- .env.example
- .env.production
- composer.json
- composer.lock
- package.json
- package-lock.json
- vite.config.js
- artisan
- Dockerfile
- docker-compose.yml
- README.md
- CHANGELOG.md
- CONTRIBUTING.md
- LICENSE
- phpunit.xml
- .gitignore
- .dockerignore

Tambahkan file atau folder lain yang relevan jika diperlukan.

Secara khusus, jelaskan:

**A. Apakah folder vendor perlu di-upload?**

Bandingkan dua pendekatan:

- Upload folder vendor yang sudah di-install.
- Menjalankan composer install di Docker image saat proses build.

Tentukan pendekatan yang lebih direkomendasikan untuk production.

**B. Apakah node_modules perlu di-upload?**

Jelaskan mengapa node_modules biasanya tidak perlu dipindahkan ke server production.

Jelaskan kapan npm ci dan npm run build harus dijalankan.

**C. Apakah folder .git perlu di-upload?**

Jelaskan risiko keamanan jika metadata Git tersedia di production.

**D. Apakah file Markdown perlu di-upload?**

Evaluasi README.md, dokumentasi internal, file arsitektur, catatan teknis, dan file Markdown lainnya.

Jelaskan apakah file Markdown bisa membocorkan:

- Struktur sistem.
- Endpoint internal.
- Informasi infrastruktur.
- Database schema.
- Konfigurasi server.
- Informasi sensitif lainnya.

Berikan rekomendasi berdasarkan klasifikasi konten, bukan menganggap semua file Markdown berbahaya.

**E. Apakah file .env.example boleh di-upload?**

Jelaskan perbedaannya dengan file .env yang berisi credentials production.

### BAB 3 — Rekomendasi Metode Pemindahan Project ke Server

Bandingkan beberapa metode:

1. SFTP menggunakan FileZilla.
2. SCP melalui SSH.
3. RSYNC melalui SSH.
4. Git clone / Git pull.
5. Docker image registry.

Bandingkan dari sisi:

- Keamanan.
- Kemudahan.
- Kecepatan.
- Pengelolaan versi.
- Risiko kesalahan deployment.
- Kemudahan rollback.

Berikan rekomendasi metode terbaik untuk tim IT internal.

Jelaskan apakah production server sebaiknya menggunakan Git atau tidak.

Bahas:

- Risiko menyimpan .git pada production.
- Perbedaan menggunakan Git sebagai deployment mechanism dan menyimpan repository metadata di web root.
- Alternatif menggunakan CI/CD.
- Deployment melalui Docker image registry.
- Penggunaan SSH key dan least privilege.

Berikan rekomendasi arsitektur deployment yang paling sesuai untuk proyek ini.

### BAB 4 — Persiapan Ubuntu Production Server

Buat panduan langkah demi langkah.

Jelaskan perintah untuk:

1. SSH ke server.
2. Memeriksa versi Ubuntu.
3. Memeriksa CPU, RAM, dan disk.
4. Update dan upgrade sistem.
5. Membuat user khusus deployment.
6. Mengatur sudo privilege.
7. Mengatur SSH key authentication.
8. Menonaktifkan password SSH jika sudah dipastikan key authentication berfungsi.
9. Mengatur UFW firewall.
10. Mengatur timezone.
11. Mengatur direktori aplikasi.
12. Mengatur ownership dan permission.
13. Mengaktifkan automatic security updates jika sesuai kebijakan operasional.

Jelaskan port yang perlu dibuka dan port yang tidak boleh diekspos ke internet.

Contohnya:

- SSH.
- HTTP.
- HTTPS.
- MySQL.
- Port internal container.

Jangan membuka port database ke publik.

### BAB 5 — Install dan Konfigurasi Docker

Jelaskan langkah demi langkah:

1. Install Docker Engine menggunakan repository resmi Docker.
2. Install Docker Compose Plugin.
3. Verifikasi Docker.
4. Verifikasi Docker Compose.
5. Mengatur Docker service agar berjalan otomatis.
6. Mengatur permission Docker socket.
7. Menjelaskan risiko memasukkan user ke grup docker.
8. Menjalankan container pertama untuk testing.

Sertakan perintah lengkap dan output yang diharapkan.

Gunakan metode instalasi Docker yang direkomendasikan secara resmi untuk Ubuntu.

### BAB 6 — Production Docker Configuration

Buatkan contoh konfigurasi production yang sesuai dengan Laravel 13.

Evaluasi kebutuhan komponen:

- PHP-FPM.
- Nginx.
- MySQL.
- Queue Worker.
- Scheduler.

Buat contoh:

1. Dockerfile production.
2. docker-compose.yml.
3. Nginx configuration.
4. PHP configuration jika diperlukan.
5. Docker healthcheck.
6. Persistent volume.
7. Docker network.
8. Restart policy.
9. Log rotation.

Pastikan konfigurasi memperhatikan:

- Tidak menggunakan PHP development server.
- Tidak menggunakan APP_DEBUG=true.
- Tidak mengekspos MySQL ke public network.
- Tidak menyimpan credentials di Dockerfile.
- Tidak menggunakan container privileged tanpa alasan.
- Menggunakan non-root user jika memungkinkan.
- Menggunakan image versi spesifik, bukan tag latest.
- Menggunakan multi-stage build jika relevan.
- Memisahkan konfigurasi development dan production.

Jangan mengasumsikan struktur Docker project yang belum diketahui. Jika membutuhkan konfigurasi yang berbeda berdasarkan struktur repository, jelaskan asumsi terlebih dahulu.

### BAB 7 — Memindahkan Folder Project ke Server

Buat panduan langkah demi langkah dari komputer developer.

Jelaskan:

1. Persiapan folder deployment.
2. Membersihkan file yang tidak diperlukan.
3. Membuat archive jika diperlukan.
4. Memindahkan folder ke server.
5. Menempatkan project pada direktori yang benar.
6. Mengekstrak file.
7. Memeriksa struktur folder.
8. Mengatur ownership.
9. Mengatur permission.
10. Memastikan file sensitif tidak dapat diakses melalui HTTP.

Berikan contoh struktur direktori production yang direkomendasikan.

Contohnya:

/opt/elq/
├── current/
├── releases/
├── shared/
│ ├── .env
│ ├── storage/
│ └── backups/
└── docker-compose.yml

Jelaskan apakah struktur ini cocok untuk deployment berbasis release dan bagaimana penerapannya.

### BAB 8 — Environment Configuration

Jelaskan proses konfigurasi environment production.

Bahas seluruh konfigurasi Laravel yang penting:

- APP_ENV
- APP_DEBUG
- APP_KEY
- APP_URL
- DB_CONNECTION
- DB_HOST
- DB_PORT
- DB_DATABASE
- DB_USERNAME
- DB_PASSWORD
- MAIL_MAILER
- MAIL_HOST
- MAIL_PORT
- MAIL_USERNAME
- MAIL_PASSWORD
- QUEUE_CONNECTION
- SESSION_DRIVER
- CACHE_STORE
- LOG_CHANNEL

Jelaskan:

- Di mana file .env harus disimpan.
- Bagaimana credentials disediakan ke container.
- Mengapa .env tidak boleh masuk ke Git.
- Mengapa .env tidak boleh dimasukkan ke Docker image.
- Bagaimana mengamankan file permission.
- Bagaimana membuat APP_KEY jika belum tersedia.
- Bagaimana menjaga APP_KEY yang sudah digunakan agar tidak berubah saat deployment.

Jangan pernah memberikan contoh credentials asli. Gunakan placeholder.

### BAB 9 — Deployment Commands: Perintah yang Harus Dijalankan

Ini adalah bagian utama dokumentasi.

Buat urutan perintah yang benar setelah source code berhasil dipindahkan ke server.

Pisahkan berdasarkan tahapan:

**A. Build Docker Image**

Jelaskan kapan menjalankan docker compose build dan docker compose up.

**B. Install PHP Dependencies**

Jelaskan penggunaan:

- composer install.
- composer update.
- composer dump-autoload.

Tentukan perintah yang tepat untuk production dan jelaskan mengapa composer update tidak seharusnya dijalankan secara sembarangan pada production.

**C. Build Frontend**

Jelaskan penggunaan:

- npm install.
- npm ci.
- npm run build.

Tentukan di mana proses frontend build sebaiknya dilakukan: komputer developer, CI/CD, atau Docker build stage.

**D. Laravel Optimization**

Jelaskan penggunaan:

- php artisan config:cache
- php artisan route:cache
- php artisan view:cache
- php artisan event:cache
- php artisan optimize

Jelaskan urutan yang tepat dan kondisi penggunaannya.

**E. Database Migration**

Jelaskan:

- php artisan migrate --force
- php artisan migrate:status
- Kapan migration perlu dijalankan.
- Mengapa harus backup sebelum migration.
- Risiko breaking migration.
- Strategi rollback database.

**F. Queue dan Worker**

Jelaskan:

- php artisan queue:work
- php artisan queue:restart
- php artisan queue:failed
- php artisan queue:retry all

Jelaskan bagaimana menjalankan worker di Docker menggunakan dedicated container.

Jelaskan mengapa queue worker tidak boleh dijalankan hanya melalui SSH terminal biasa karena proses dapat berhenti ketika terminal ditutup.

**G. Laravel Scheduler**

Jelaskan cara menjalankan Laravel Scheduler di Docker.

Bandingkan:

- Cron di Ubuntu host.
- Cron di container.
- Dedicated scheduler container menggunakan php artisan schedule:work.

Berikan rekomendasi yang paling sesuai.

**H. Storage dan Permission**

Jelaskan:

- php artisan storage:link
- Permission storage/
- Permission bootstrap/cache/
- Ownership user web server.
- Persistent volume untuk file upload.

Pastikan file upload tidak hilang ketika container dibuat ulang.

### BAB 10 — Laravel Production Security Checklist

Buat checklist keamanan production.

Minimal mencakup:

- APP_ENV=production.
- APP_DEBUG=false.
- APP_KEY aman.
- HTTPS aktif.
- Database tidak dapat diakses publik.
- SSH key authentication.
- Firewall aktif.
- File .env tidak dapat diakses melalui HTTP.
- Directory listing dinonaktifkan.
- Folder .git tidak tersedia di web root.
- File dokumentasi internal tidak terekspos.
- Tidak ada credentials di source code.
- Container berjalan dengan permission minimum.
- Log tidak membocorkan password atau token.
- Backup database terenkripsi.
- Docker image menggunakan versi yang terkontrol.
- Dependency memiliki prosedur security update.

Tambahkan rekomendasi keamanan khusus Laravel.

### BAB 11 — Verifikasi Setelah Deployment

Buat checklist untuk memastikan aplikasi benar-benar berjalan normal.

Sertakan perintah:

- docker compose ps
- docker compose logs
- docker compose exec
- docker inspect
- php artisan about
- php artisan migrate:status
- php artisan queue:monitor jika relevan

Verifikasi:

1. Homepage dapat dibuka.
2. Login berfungsi.
3. Database terkoneksi.
4. Asset CSS dan JavaScript berhasil dimuat.
5. Email berhasil dikirim.
6. Queue worker berjalan.
7. Scheduler berjalan.
8. PDF export berfungsi.
9. Upload file berfungsi.
10. Log tidak menunjukkan error kritis.
11. HTTPS dan SSL berfungsi.

### BAB 12 — Backup dan Rollback

Buat prosedur:

- Backup database MySQL.
- Backup file storage.
- Backup konfigurasi environment.
- Retensi backup.
- Pemulihan database.
- Pemulihan file.
- Rollback aplikasi ke versi sebelumnya.
- Rollback Docker image.
- Penanganan migration yang gagal.

Jelaskan mengapa rollback aplikasi tidak selalu berarti database bisa langsung di-rollback.

Berikan contoh prosedur rollback yang aman.

### BAB 13 — Standard Operating Procedure untuk Deployment Berikutnya

Buat SOP deployment rutin ketika developer mengirimkan versi aplikasi terbaru.

Targetnya, deployment berikutnya tidak perlu mengulang instalasi Ubuntu dan Docker.

Buat urutan proses seperti:

1. Developer menyiapkan release.
2. Source code diperiksa.
3. Docker image dibangun.
4. Backup dilakukan.
5. Release baru dipindahkan atau image di-pull.
6. Container diperbarui.
7. Database migration dijalankan jika diperlukan.
8. Laravel cache di-refresh.
9. Queue worker direstart.
10. Health check dijalankan.
11. Jika gagal, rollback.

Buat contoh script deployment otomatis bernama deploy.sh dengan error handling yang baik.

Jangan membuat script yang berpotensi menghapus data production.

## 5. FORMAT PENULISAN

Gunakan bahasa Indonesia profesional dengan istilah teknis IT dalam bahasa Inggris jika lebih tepat.

Untuk setiap langkah, gunakan format:

### Step X — Nama Proses

**Tujuan:**
Jelaskan tujuan langkah tersebut.

**Lokasi eksekusi:**

- Local Developer Machine.
- Ubuntu Host.
- Docker Container.

**Perintah:**

Berikan perintah terminal lengkap dalam code block.

**Penjelasan:**
Jelaskan fungsi setiap perintah.

**Expected Result:**
Jelaskan output atau kondisi yang seharusnya muncul.

**Catatan Keamanan:**
Jelaskan potensi risiko dan cara menghindarinya.

**Troubleshooting:**
Berikan solusi jika proses gagal.

Gunakan tabel, diagram Mermaid, dan checklist jika diperlukan.

## 6. ATURAN PENTING

1. Jangan memberikan perintah yang hanya berupa contoh tanpa menjelaskan konteks penggunaannya.
2. Jangan mengasumsikan file atau konfigurasi sudah tersedia jika belum diverifikasi.
3. Jangan mencampurkan perintah Ubuntu host dengan perintah di dalam Docker container tanpa memberikan penjelasan.
4. Tandai dengan jelas perintah yang harus dijalankan satu kali dan perintah yang harus dijalankan setiap deployment.
5. Bedakan proses development, staging, dan production.
6. Jangan merekomendasikan composer update pada deployment rutin production.
7. Jangan merekomendasikan npm install apabila npm ci lebih tepat berdasarkan lockfile.
8. Jangan menjalankan Laravel queue worker menggunakan terminal interaktif sebagai solusi permanen.
9. Jangan menjalankan MySQL dengan data directory yang tidak menggunakan persistent volume.
10. Jangan menghapus volume Docker ketika deployment rutin.
11. Jangan mengubah APP_KEY yang sudah digunakan.
12. Jangan menjalankan migration destructive tanpa backup dan evaluasi dampak.
13. Jangan mengekspos port database ke internet.
14. Jangan mengarang nama service Docker, nama container, atau struktur file yang belum diketahui.
15. Jika terdapat beberapa alternatif, berikan rekomendasi utama dan jelaskan alasannya.

## 7. HASIL AKHIR YANG DIHARAPKAN

Dokumentasi akhir harus menghasilkan:

1. Arsitektur production deployment.
2. Daftar folder/file yang harus dan tidak perlu di-upload.
3. Rekomendasi penggunaan Git di production.
4. Rekomendasi penanganan file Markdown.
5. Panduan persiapan Ubuntu Server.
6. Panduan instalasi Docker.
7. Konfigurasi Docker production.
8. Panduan upload source code.
9. Panduan environment configuration.
10. Daftar lengkap deployment commands beserta urutannya.
11. Panduan Laravel Queue dan Scheduler.
12. Security hardening checklist.
13. Production verification checklist.
14. Backup dan rollback procedure.
15. Script deploy.sh untuk deployment berikutnya.
16. Quick Reference — kumpulan perintah deployment yang paling sering digunakan.

**PRINSIP UTAMA:**

Dokumentasi harus dibuat dengan pendekatan production-grade, security-first, dan operationally maintainable.

Jangan hanya membuat aplikasi berhasil berjalan. Pastikan aplikasi dapat dikelola, diperbarui, diamankan, dipantau, dan dipulihkan ketika terjadi kegagalan.

Jika source code project tersedia, lakukan pemeriksaan terhadap struktur repository, Dockerfile, docker-compose.yml, composer.json, package.json, dan konfigurasi Laravel terlebih dahulu sebelum memberikan perintah deployment yang spesifik.

Jika informasi belum tersedia, buat daftar asumsi dan tandai bagian yang memerlukan konfirmasi. Jangan mengarang konfigurasi seolah-olah sudah diverifikasi.
