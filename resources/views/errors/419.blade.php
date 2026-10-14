@extends('errors.minimal', [
    'code' => 419,
    'statusText' => 'Page Expired',
    'title' => 'Sesi Halaman Berakhir',
    'message' => 'Sesi keamanan Anda telah kadaluarsa karena tidak ada aktivitas. Silakan muat ulang halaman untuk melanjutkan.',
])

@section('icon')
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
</svg>
@endsection

@section('action-secondary')
<button type="button" onclick="window.location.reload()" class="btn btn-outline">
    Muat Ulang Halaman
</button>
@endsection
