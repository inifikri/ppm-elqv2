# ELQ Design System (ringkas)

Arah: modern, minimalis, flat, rounded, aksen biru. Struktur dari border, bukan shadow.

## Token (Tailwind v4, @theme + CSS variables, ganti nilai di .dark)

| Token                             | Light                            | Dark                 |
| --------------------------------- | -------------------------------- | -------------------- |
| background                        | slate-50                         | slate-950            |
| surface                           | white                            | slate-900            |
| surface-elevated                  | white                            | slate-800            |
| border                            | slate-200                        | slate-700            |
| text-primary                      | slate-900                        | slate-50             |
| text-secondary                    | slate-600                        | slate-300            |
| text-muted                        | slate-500                        | slate-400            |
| primary                           | blue-600 (hover 700, active 800) | blue-400 (hover 300) |
| ring                              | blue-500                         | blue-400             |
| success / warning / danger / info | green / amber / red / sky 600    | 400                  |

Aturan: biru hanya untuk aksi utama, item aktif, link. Jangan jadi latar halaman. Jangan hitam murni. Pakai token semantik, bukan warna mentah di komponen.

## Tipografi

Inter (self-host, fallback system-ui). Body admin 14px, assessment 16px.
H1 24–28, H2 20, H3 16–18, small 12–13. Angka tabel/skor pakai `tabular-nums`.

## Bentuk

Radius: input/button 8, card 12, modal 16, badge pill.
Border 1px. Shadow hanya untuk modal, dropdown, toast (tipis).
Spacing basis 4px; padding card 16 (mobile) / 24 (desktop).

## State komponen

| State           | Aturan                                                             |
| --------------- | ------------------------------------------------------------------ |
| Hover           | naik satu step warna; baris tabel bg-slate-50 (dark: slate-800)    |
| Focus           | ring 2px + offset 2px, selalu terlihat, jangan hapus outline       |
| Active          | satu step lebih gelap, tanpa animasi besar                         |
| Disabled        | opacity 50%, cursor-not-allowed, teks tetap terbaca                |
| Loading         | teks "Menyimpan…" + spinner, tombol disabled (cegah double submit) |
| Error           | border danger + ikon + pesan di bawah field                        |
| Success/Warning | ikon + teks, bukan warna saja                                      |

## Komponen

Dasar (shadcn): Button (primary, secondary, ghost, danger, icon), Input, Textarea, Select, Checkbox, Radio, Switch, Dialog, Drawer/Sheet, Dropdown, Tabs, Tooltip, Badge, Alert, Toast, Card, Progress, Skeleton, Breadcrumb.
Custom: DataTable, Pagination, PageHeader, EmptyState, ErrorState, ConfirmDialog, StatusBadge, StatCard, FilterBar.
ELQ: LikertScale (1–6), QuestionCard, AssessmentProgress, QuestionNavigator, ReviewList, EvaluatorCard, ScoreCard, charts.
Date picker: `input type="date"` yang di-style, bukan komponen custom.

## Layout

- **Admin**: sidebar collapsible (ikon + tooltip saat collapsed), topbar (user menu, toggle tema), breadcrumb, page header, footer. Konten max-w ±1536px; halaman form max ±720px.
- **Participant**: terpandu, tanpa sidebar admin (nav sederhana: Dashboard, Penilai, Self Assessment, Hasil, Profil).
- **Evaluator**: tanpa sidebar, satu kolom, fokus, via signed URL.

## Responsive

- ≥1280: sidebar penuh, tabel lengkap.
- 768–1279: sidebar collapsed, filter di drawer.
- <768: sidebar jadi drawer, tabel jadi card list, form satu kolom, filter bottom sheet, target sentuh ≥44px.
- Tidak boleh ada horizontal overflow di halaman. Tabel lebar scroll di dalam container sendiri.

## Data & state halaman

Loading = skeleton. Ada data = tabel. Kosong = EmptyState (penjelasan + aksi). Error = ErrorState + tombol coba lagi. Search/filter/sort/pagination di server (Inertia).
Toast: aksi sukses/gagal/info/pending. Validasi field selalu inline, bukan toast.
Dialog konfirmasi: hapus user, logout, submit assessment. **Pertanyaan: banner informasi, bukan konfirmasi** (D-7).

## Assessment UI

Satu soal per layar. Header: "Soal 12 dari 39" + progress bar (jangan bernuansa gamifikasi).
Opsi 1–6 sebagai radio besar (≥48px), label ujung "Sangat Tidak Setuju" … "Sangat Setuju".
Previous/Next menempel di bawah pada mobile. Halaman review menandai soal belum dijawab dan bisa diklik kembali. Submit lewat ConfirmDialog.

## Chart

Radar (ringkasan dimensi), grouped bar (Self vs Atasan vs Bawahan), horizontal bar (sub dimensi).
Wajib ada ringkasan teks/tabel alternatif. Jangan andalkan warna saja (pakai pola/label).

## Aksesibilitas (WCAG 2.2 AA)

HTML semantik, urutan heading benar, label di semua input, pesan error terhubung via aria-describedby, dialog dengan focus trap (Radix), kontras teks ≥4.5:1, ikon-only button wajib aria-label.

## Ikon

Font Awesome saja. Jangan campur sistem ikon.

## Halaman error/keamanan

403, 404, 419, 500: ramah, tanpa detail teknis, ada tombol aksi pemulihan.
Tautan penilai tidak valid / assessment selesai: pesan netral, arahkan hubungi peserta pengundang.
Lupa password: pesan netral (tidak membocorkan email terdaftar).

## PDF

Template Blade terpisah (dompdf tanpa flex/grid/CSS variables). Salin token sebagai nilai statis. Chart dirender SVG server-side. Jangan menargetkan PDF identik dengan halaman web.
