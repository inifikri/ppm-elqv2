<div class="page-break-avoid" style="margin-top: 8px; margin-bottom: 12px;">
    <div class="section-header">
        <div class="section-title">KATEGORI EFEKTIVITAS KEPEMIMPINAN (ELQ EFFECTIVENESS CATEGORY)</div>
    </div>
    <table class="data-table" style="margin-top: 6px; margin-bottom: 8px;">
        <thead>
            <tr>
                <th style="width: 15%;">Rentang Skor</th>
                <th style="width: 25%;">Kategori</th>
                <th style="width: 60%; text-align: left;">Deskripsi &amp; Interpretasi</th>
            </tr>
        </thead>
        <tbody>
            @foreach(\App\Enums\EffectivenessCategory::cases() as $idx => $cat)
                <tr class="{{ $idx % 2 === 1 ? 'zebra' : '' }}">
                    <td class="text-center font-bold" style="color: #0f172a; font-size: 8pt;">
                        {{ $cat->scoreRange() }}
                    </td>
                    <td class="text-center">
                        <span class="badge" style="background-color: {{ $cat->bgHexColor() }}; color: {{ $cat->hexColor() }};">
                            {{ $cat->label() }}
                        </span>
                    </td>
                    <td style="color: #334155; font-size: 7.5pt; line-height: 1.35;">
                        {{ $cat->description() }}
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>
