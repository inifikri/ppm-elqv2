<div class="page-break-avoid" style="margin-bottom: 16px;">
    <div class="section-header">
        <div class="section-title">2. TABEL REKAPITULASI RATA-RATA PER DIMENSI</div>
    </div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 38%; text-align: left;">Dimensi Kepemimpinan</th>
                <th style="width: 12%;">Rata-rata</th>
                <th style="width: 12%;">Diri Sendiri</th>
                <th style="width: 12%;">Atasan</th>
                <th style="width: 12%;">Bawahan</th>
                <th style="width: 14%;">Kategori</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data->dimensions as $dIndex => $dim)
                <tr class="{{ $dIndex % 2 === 1 ? 'zebra' : '' }}">
                    <td style="font-weight: bold; color: #0f172a;">
                        {{ $dim['name'] }}
                    </td>
                    <td class="text-center font-bold text-primary" style="font-size: 9.5pt;">
                        {{ $dim['scores']['average'] !== null ? number_format($dim['scores']['average'], 2) : '-' }}
                    </td>
                    <td class="text-center">
                        {{ $dim['scores']['self'] !== null ? number_format($dim['scores']['self'], 2) : '-' }}
                    </td>
                    <td class="text-center">
                        {{ $dim['scores']['boss'] !== null ? number_format($dim['scores']['boss'], 2) : '-' }}
                    </td>
                    <td class="text-center">
                        {{ $dim['scores']['subordinate'] !== null ? number_format($dim['scores']['subordinate'], 2) : '-' }}
                    </td>
                    <td class="text-center">
                        @if($dim['category'])
                            <span class="badge" style="background-color: {{ $dim['category']->bgHexColor() }}; color: {{ $dim['category']->hexColor() }};">
                                {{ $dim['category']->label() }}
                            </span>
                        @else
                            <span style="color: #94a3b8;">-</span>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>
