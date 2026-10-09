<?php

namespace App\Models;

use Database\Factories\SettingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

#[Fillable(['name', 'value'])]
class Setting extends Model
{
    /** @use HasFactory<SettingFactory> */
    use HasFactory, LogsActivity;

    public static function get(string $name, ?string $default = null): ?string
    {
        return static::query()->where('name', $name)->value('value') ?? $default;
    }

    /**
     * Boolean disimpan sebagai '1'/'0'; casting lain dilakukan pemanggil.
     */
    public static function set(string $name, string|int|bool|null $value): self
    {
        return static::updateOrCreate(
            ['name' => $name],
            ['value' => is_bool($value) ? (string) (int) $value : ($value === null ? null : (string) $value)],
        );
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'value'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('settings');
    }
}
