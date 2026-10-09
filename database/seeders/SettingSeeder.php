<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Nilai awal purge nonaktif (Q-5). Nilai yang sudah diubah admin tidak ditimpa.
     *
     * @var array<string, string|null>
     */
    private const DEFAULTS = [
        'activity_log_purge_enabled' => '0',
        'activity_log_retention_days' => null,
        'email_log_purge_enabled' => '0',
        'email_log_retention_days' => null,
    ];

    public function run(): void
    {
        foreach (self::DEFAULTS as $name => $value) {
            Setting::firstOrCreate(['name' => $name], ['value' => $value]);
        }
    }
}
