@extends('errors.minimal', [
    'code' => 404,
    'statusText' => 'Not Found',
    'title' => 'Tautan Penilaian Tidak Tersedia',
    'message' => 'Tautan penilaian ini tidak valid, sudah kedaluwarsa, atau telah diperbarui dengan tautan baru oleh pengelola asesmen. Jika Anda menerima email undangan baru baru-baru ini, silakan gunakan tautan pada email terakhir, atau hubungi peserta yang dinilai / panitia asesmen untuk mendapatkan tautan undangan aktif.',
])

@section('icon')
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
</svg>
@endsection
