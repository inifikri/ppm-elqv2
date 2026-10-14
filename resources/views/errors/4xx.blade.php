@extends('errors.minimal', [
    'code' => $exception?->getStatusCode() ?? 400,
    'statusText' => 'Client Error',
    'title' => 'Permintaan Tidak Dapat Diproses',
    'message' => $exception?->getMessage() ?: 'Terjadi kendala pada permintaan Anda. Silakan periksa kembali tautan atau masukan Anda.',
])

@section('icon')
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
</svg>
@endsection
