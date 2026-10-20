<?php

namespace App\Enums;

enum EffectivenessCategory: string
{
    case HighlyEffective = 'highly_effective';
    case Effective = 'effective';
    case ModerateEffective = 'moderate_effective';
    case LeastEffective = 'least_effective';

    /**
     * Hitung kategori efektivitas dari nilai skor (skala 1 - 6).
     *
     * Asumsi C-1: Skor dibulatkan ke 1 desimal (round half up) sebelum dikategorikan
     * untuk mengeliminasi celah desimal (misal 5.65 -> 5.7, 4.45 -> 4.5, 3.55 -> 3.6).
     */
    public static function fromScore(?float $score): ?self
    {
        if ($score === null) {
            return null;
        }

        $rounded = round($score, 1, PHP_ROUND_HALF_UP);

        return match (true) {
            $rounded >= 5.7 => self::HighlyEffective,
            $rounded >= 4.5 => self::Effective,
            $rounded >= 3.6 => self::ModerateEffective,
            default => self::LeastEffective,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::HighlyEffective => 'Highly Effective',
            self::Effective => 'Effective',
            self::ModerateEffective => 'Moderate Effective',
            self::LeastEffective => 'Least Effective',
        };
    }

    /**
     * Rentang skor untuk legenda laporan.
     */
    public function scoreRange(): string
    {
        return match ($this) {
            self::HighlyEffective => '≥ 5.7',
            self::Effective => '4.5 – 5.6',
            self::ModerateEffective => '3.6 – 4.4',
            self::LeastEffective => '≤ 3.5',
        };
    }

    /**
     * Warna heksadesimal dominan untuk cetak & teks.
     */
    public function hexColor(): string
    {
        return match ($this) {
            self::HighlyEffective => '#166534', // Dark green
            self::Effective => '#1e40af',       // Dark blue
            self::ModerateEffective => '#b45309', // Dark amber
            self::LeastEffective => '#b91c1c',   // Dark red
        };
    }

    /**
     * Warna background badge (tint).
     */
    public function bgHexColor(): string
    {
        return match ($this) {
            self::HighlyEffective => '#dcfce7',
            self::Effective => '#dbeafe',
            self::ModerateEffective => '#fef3c7',
            self::LeastEffective => '#fee2e2',
        };
    }

    /**
     * Deskripsi interpretasi kategori untuk halaman penutup / legenda PDF.
     */
    public function description(): string
    {
        return match ($this) {
            self::HighlyEffective => 'Menunjukkan efektivitas kepemimpinan yang sangat tinggi dan konsisten melampaui ekspektasi standar organisasi.',
            self::Effective => 'Menunjukkan efektivitas kepemimpinan yang solid dan memenuhi seluruh kompetensi yang diharapkan.',
            self::ModerateEffective => 'Menunjukkan efektivitas kepemimpinan moderat; terdapat area penguatan kompetensi tertentu.',
            self::LeastEffective => 'Membutuhkan pendampingan dan program pengembangan kepemimpinan intensif pada aspek-aspek kunci.',
        };
    }
}
