# ELQ PPM Manajemen 360 — Project Rules

## Stack (final)

Laravel 13, PHP 8.3, MySQL 8.4, React + TypeScript, Inertia, Tailwind v4, Vite,
Fortify (auth), shadcn/ui (Radix) sebagai basis komponen, Font Awesome icons.
Jangan ganti stack, jangan tambah UI framework lain, jangan pakai Bootstrap/Vue.
Semua dependency harus open-source gratis, deploy on-premise.

## Aturan umum

- Audit struktur yang ada dulu; refactor, jangan buat ulang dari nol.
- Satu file satu tanggung jawab. Dilarang file raksasa.
- Logika bisnis (skor 360, undangan) di Service/Action class, bukan di controller/komponen.
- Validasi di FormRequest; otorisasi di Policy/permission (spatie). UI hanya menyembunyikan.
- Eloquent/query builder saja, tanpa raw query dari input user. CSRF aktif.
- Jangan menaruh nilai jawaban, password, token, signed URL di log.
- Font self-host (Inter). Jangan load aset dari CDN eksternal.
- Jangan mengarang requirement: tandai "ASUMSI" bila tidak ada di FR.

## Kamus istilah

UI (Indonesia): Dimensi, Sub Dimensi, Pertanyaan, Peserta, Penilai, Hasil Assessment.
Kode/route/tabel (Inggris): dimensions, sub_dimensions, questions, participants, raters.

## Out of scope (jangan dibuat tanpa persetujuan)

DISC/Personality, CRUD Group, 2FA, session timeout UX, purge pengguna, versioning kuesioner.
Pending keputusan: menu Companies (FR-050 bilang tanpa CRUD), Hak Akses Role (Q-2).

## Tiga pengalaman terpisah

Admin (sidebar, dense) · Participant (terpandu) · Evaluator (tanpa sidebar, fokus, via signed URL).

## Desain

Rujuk docs/design-system.md. PDF memakai template Blade terpisah (dompdf tidak
mendukung flex/grid/CSS variables); chart PDF dirender server-side sebagai SVG.

## Selesai berarti

Build, lint, typecheck, test lulus. Laporkan hanya hasil yang benar-benar dijalankan.
