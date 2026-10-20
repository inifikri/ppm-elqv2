<table class="score-card-table">
    <tr>
        {{-- Skor Keseluruhan (Utama) --}}
        <td class="score-card score-card-main" style="width: 31%;">
            <div class="score-title">Skor Keseluruhan</div>
            <div class="score-big">
                {{ $data->overallScore !== null ? number_format($data->overallScore, 2) : '-' }}
            </div>
            @if($data->overallCategory)
                <div style="margin-top: 4px;">
                    <span class="badge" style="background-color: {{ $data->overallCategory->bgHexColor() }}; color: {{ $data->overallCategory->hexColor() }};">
                        {{ $data->overallCategory->label() }}
                    </span>
                </div>
            @else
                <div style="font-size: 8pt; color: #94a3b8; margin-top: 4px;">Belum terkategori</div>
            @endif
            <div style="font-size: 7.5pt; color: #64748b; margin-top: 4px;">Skala Penilaian: 1.00 – 6.00</div>
        </td>

        {{-- Diri Sendiri (Self) --}}
        <td class="score-card" style="width: 23%;">
            <div class="score-title" style="color: #475569;">Diri Sendiri (Self)</div>
            <div class="score-big" style="color: #64748b;">
                {{ $data->roleOverallScores['self'] !== null ? number_format($data->roleOverallScores['self'], 2) : '-' }}
            </div>
            <div style="font-size: 7.5pt; color: #64748b; margin-top: 4px;">
                Status: {{ $data->answeredRaters['self']['submitted'] }}/{{ $data->answeredRaters['self']['total'] }}
                {{ $data->answeredRaters['self']['is_complete'] ? '✓' : '' }}
            </div>
        </td>

        {{-- Atasan (Boss) --}}
        <td class="score-card" style="width: 23%;">
            <div class="score-title" style="color: #0f766e;">Atasan (Boss)</div>
            <div class="score-big" style="color: #0d9488;">
                {{ $data->roleOverallScores['boss'] !== null ? number_format($data->roleOverallScores['boss'], 2) : '-' }}
            </div>
            <div style="font-size: 7.5pt; color: #64748b; margin-top: 4px;">
                Status: {{ $data->answeredRaters['boss']['submitted'] }}/{{ $data->answeredRaters['boss']['total'] }}
                {{ $data->answeredRaters['boss']['is_complete'] ? '✓' : '' }}
            </div>
        </td>

        {{-- Bawahan (Subordinate) --}}
        <td class="score-card" style="width: 23%;">
            <div class="score-title" style="color: #b45309;">Bawahan (Subordinate)</div>
            <div class="score-big" style="color: #d97706;">
                {{ $data->roleOverallScores['subordinate'] !== null ? number_format($data->roleOverallScores['subordinate'], 2) : '-' }}
            </div>
            <div style="font-size: 7.5pt; color: #64748b; margin-top: 4px;">
                Status: {{ $data->answeredRaters['subordinate']['submitted'] }}/{{ $data->answeredRaters['subordinate']['total'] }}
                {{ $data->answeredRaters['subordinate']['is_complete'] ? '✓' : '' }}
            </div>
        </td>
    </tr>
</table>
