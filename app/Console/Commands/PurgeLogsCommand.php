<?php

namespace App\Console\Commands;

use App\Services\Logging\LogPurgeService;
use Illuminate\Console\Command;

class PurgeLogsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logs:purge 
                            {--target=all : Target pembersihan (all, activity, email)} 
                            {--force : Paksa pembersihan walau auto-purge nonaktif di pengaturan}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Bersihkan record log aktivitas dan log email yang telah melebihi batas masa retensi';

    public function handle(LogPurgeService $service): int
    {
        $target = (string) $this->option('target');
        $force = (bool) $this->option('force');

        if (! in_array($target, ['all', 'activity', 'email'], true)) {
            $this->error("Target tidak valid: '{$target}'. Pilihan yang valid: all, activity, email.");

            return self::FAILURE;
        }

        $this->info("Menjalankan pembersihan log (Target: {$target}, Force: ".($force ? 'Ya' : 'Tidak').')...');

        $result = $service->purgeAll(forceAll: $force, causer: null, target: $target);

        $this->table(
            ['Jenis Log', 'Jumlah Baris Dihapus'],
            [
                ['Activity Log', $result['activity_purged']],
                ['Email Log', $result['email_purged']],
                ['Total', $result['activity_purged'] + $result['email_purged']],
            ]
        );

        $this->info('Pembersihan log berhasil diselesaikan.');

        return self::SUCCESS;
    }
}
