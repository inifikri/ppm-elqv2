@extends('errors.minimal', [
    'code' => 403,
    'statusText' => 'Forbidden',
    'title' => 'Akses Dibatasi',
    'message' => $exception?->getMessage() ?: 'Akun Anda tidak memiliki izin untuk melihat atau menjalankan tindakan pada halaman ini.',
])

@section('icon')
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    <path d="m14.5 9-5 5"/>
    <path d="m9.5 9 5 5"/>
</svg>
@endsection
