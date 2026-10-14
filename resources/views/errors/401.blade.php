@extends('errors.minimal', [
    'code' => 401,
    'statusText' => 'Unauthorized',
    'title' => 'Sesi Belum Terautentikasi',
    'message' => 'Anda perlu masuk ke akun terlebih dahulu untuk mengakses halaman ini.',
])

@section('icon')
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    <path d="m9 12 2 2 4-4"/>
</svg>
@endsection

@section('action-secondary')
<a href="/login" class="btn btn-outline">Masuk ke Akun</a>
@endsection
