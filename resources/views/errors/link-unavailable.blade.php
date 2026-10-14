@extends('errors.minimal', [
    'code' => 404,
    'statusText' => 'Not Found',
    'title' => 'Tautan Tidak Tersedia',
    'message' => 'Tautan penilaian ini tidak valid, sudah kadaluarsa, atau telah dicabut oleh pengelola asesmen. Silakan hubungi peserta yang meminta penilaian untuk mendapatkan tautan undangan baru.',
])

@section('icon')
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
</svg>
@endsection
