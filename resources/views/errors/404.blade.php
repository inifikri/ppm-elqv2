@extends('errors.minimal', [
    'code' => 404,
    'statusText' => 'Not Found',
    'title' => 'Halaman Tidak Ditemukan',
    'message' => $exception?->getMessage() ?: 'Tautan yang Anda tuju mungkin salah ketik, sudah dihapus, atau dipindahkan ke alamat lain.',
])

@section('icon')
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
    <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
    <path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"/>
    <path d="M12 17h.01"/>
</svg>
@endsection
