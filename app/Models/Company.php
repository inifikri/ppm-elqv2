<?php

namespace App\Models;

use Database\Factories\CompanyFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Str;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

#[Fillable(['name'])]
class Company extends Model
{
    /** @use HasFactory<CompanyFactory> */
    use HasFactory, LogsActivity;

    protected static function booted(): void
    {
        static::saving(fn (self $company) => $company->name_normalized = self::normalize($company->name));
    }

    /** Rapikan spasi (trim + lipat spasi ganda). */
    public static function tidy(string $name): string
    {
        return trim((string) preg_replace('/\s+/u', ' ', $name));
    }

    /** Kunci pembanding: abaikan kapitalisasi, titik/tanda baca, dan spasi ganda ("PT.Jaya" = "PT. Jaya" = "pt jaya"). */
    public static function normalize(string $name): string
    {
        return self::tidy((string) preg_replace('/[^\p{L}\p{N}]+/u', ' ', Str::lower($name)));
    }

    /** Cari-atau-buat berdasarkan nama ternormalisasi; aman terhadap balapan (unique-violation). */
    public static function findOrCreateByName(string $name): self
    {
        $key = self::normalize($name);

        if ($found = self::where('name_normalized', $key)->first()) {
            return $found;
        }

        try {
            return self::create(['name' => self::tidy($name)]);
        } catch (UniqueConstraintViolationException) {
            return self::where('name_normalized', $key)->firstOrFail();
        }
    }

    public function participantProfiles(): HasMany
    {
        return $this->hasMany(ParticipantProfile::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('master');
    }
}
