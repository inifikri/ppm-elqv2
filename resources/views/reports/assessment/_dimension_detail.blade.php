@foreach($data->dimensions as $dimIndex => $dim)
    <div class="page-break">
        {{-- Header Dimensi --}}
        <table style="width: 100%; border-bottom: 2px solid #1e40af; padding-bottom: 6px; margin-bottom: 12px;">
            <tr>
                <td style="vertical-align: middle;">
                    <div style="font-size: 8pt; color: #64748b; font-weight: bold; text-transform: uppercase;">
                        RINCIAN DIMENSI {{ $dimIndex + 1 }} DARI {{ count($data->dimensions) }}
                    </div>
                    <div style="font-size: 13pt; color: #1e40af; font-weight: bold; margin-top: 2px;">
                        {{ $dim['name'] }}
                    </div>
                </td>
                <td style="text-align: right; vertical-align: middle;">
                    <div style="display: inline-block; text-align: right;">
                        <span style="font-size: 8.5pt; color: #64748b; margin-right: 4px;">Rata-rata Dimensi:</span>
                        <span style="font-size: 13pt; font-weight: bold; color: #1e40af;">
                            {{ $dim['scores']['average'] !== null ? number_format($dim['scores']['average'], 2) : '-' }}
                        </span>
                        @if($dim['category'])
                            <span class="badge" style="background-color: {{ $dim['category']->bgHexColor() }}; color: {{ $dim['category']->hexColor() }}; margin-left: 6px;">
                                {{ $dim['category']->label() }}
                            </span>
                        @endif
                    </div>
                </td>
            </tr>
        </table>

        {{-- Grafik Horizontal Sub-Dimensi --}}
        @if(isset($subDimensionCharts[$dim['id']]))
            <div class="page-break-avoid" style="margin-bottom: 14px;">
                <div style="font-size: 9pt; font-weight: bold; color: #334155; margin-bottom: 4px; text-transform: uppercase;">
                    Grafik Perbandingan Sub-Dimensi
                </div>
                <div style="text-align: center; margin: 0 auto;">
                    {!! $subDimensionCharts[$dim['id']] !!}
                </div>
            </div>
        @endif

        {{-- Tabel Rincian Pertanyaan per Sub-Dimensi --}}
        <div style="margin-top: 10px;">
            <div style="font-size: 9pt; font-weight: bold; color: #334155; margin-bottom: 6px; text-transform: uppercase;">
                Tabel Evaluasi Butir Pertanyaan
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">No</th>
                        <th style="width: 22%; text-align: left;">Sub Dimensi</th>
                        <th style="width: 37%; text-align: left;">Butir Pertanyaan</th>
                        <th style="width: 9%;">Rata-rata</th>
                        <th style="width: 9%;">Diri Sendiri</th>
                        <th style="width: 9%;">Atasan</th>
                        <th style="width: 9%;">Bawahan</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($dim['sub_dimensions'] as $sub)
                        @php
                            $questionCount = count($sub['questions']);
                        @endphp

                        @foreach($sub['questions'] as $qIndex => $q)
                            <tr class="{{ $qIndex % 2 === 1 ? 'zebra' : '' }}">
                                <td class="text-center font-bold" style="color: #64748b;">
                                    {{ $q['no'] }}
                                </td>

                                {{-- Tampilkan nama sub dimensi pada baris pertama saja dengan rowspan --}}
                                @if($qIndex === 0)
                                    <td rowspan="{{ $questionCount }}" style="vertical-align: top; font-weight: bold; color: #0f172a; background-color: #f8fafc; border-right: 1.5px solid #cbd5e1;">
                                        {{ $sub['name'] }}
                                    </td>
                                @endif

                                <td style="color: #1e293b; line-height: 1.35;">
                                    {{ $q['text'] }}
                                </td>
                                <td class="text-center font-bold text-primary">
                                    {{ $q['scores']['average'] !== null ? number_format($q['scores']['average'], 2) : '-' }}
                                </td>
                                <td class="text-center">
                                    {{ $q['scores']['self'] !== null ? number_format($q['scores']['self'], 2) : '-' }}
                                </td>
                                <td class="text-center">
                                    {{ $q['scores']['boss'] !== null ? number_format($q['scores']['boss'], 2) : '-' }}
                                </td>
                                <td class="text-center">
                                    {{ $q['scores']['subordinate'] !== null ? number_format($q['scores']['subordinate'], 2) : '-' }}
                                </td>
                            </tr>
                        @endforeach

                        {{-- Baris Subtotal Rata-rata Sub Dimensi --}}
                        <tr class="subtotal-row">
                            <td colspan="3" style="text-align: right; padding-right: 12px; font-weight: bold; color: #0f172a;">
                                Rata-rata Sub-Dimensi ({{ $sub['name'] }}):
                            </td>
                            <td class="text-center font-bold text-primary">
                                {{ $sub['scores']['average'] !== null ? number_format($sub['scores']['average'], 2) : '-' }}
                            </td>
                            <td class="text-center font-bold">
                                {{ $sub['scores']['self'] !== null ? number_format($sub['scores']['self'], 2) : '-' }}
                            </td>
                            <td class="text-center font-bold">
                                {{ $sub['scores']['boss'] !== null ? number_format($sub['scores']['boss'], 2) : '-' }}
                            </td>
                            <td class="text-center font-bold">
                                {{ $sub['scores']['subordinate'] !== null ? number_format($sub['scores']['subordinate'], 2) : '-' }}
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
@endforeach
