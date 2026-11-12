<div class="page-break-avoid" style="margin-top: 10px; margin-bottom: 12px;">
    <div class="section-header">
        <div class="section-title">GRAFIK PERBANDINGAN TINGKAT DIMENSI</div>
    </div>
    <div style="text-align: center; margin: 4px auto 8px auto;">
        @if(!empty($dimensionBarChartDataUri))
            <img src="{{ $dimensionBarChartDataUri }}" width="640" style="width: 100%; max-width: 640px; height: auto;" alt="Grafik Perbandingan Dimensi" />
        @else
            {!! $dimensionBarChartSvg !!}
        @endif
    </div>
</div>
