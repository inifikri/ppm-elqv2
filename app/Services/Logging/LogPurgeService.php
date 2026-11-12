<?php

namespace App\Services\Logging;

use App\Models\EmailLog;
use App\Models\Setting;
use App\Models\User;
use Carbon\Carbon;
use Spatie\Activitylog\Models\Activity;

class LogPurgeService
{
    /**
     * Ambil data statistik dan konfigurasi saat ini untuk ditampilkan di UI.
     *
     * @return array<string, mixed>
     */
    public function getStats(): array
    {
        $actPurgeEnabled = (bool) (int) Setting::get('activity_log_purge_enabled', '0');
        $actRetentionDays = Setting::get('activity_log_retention_days');
        $actRetentionDays = $actRetentionDays !== null ? (int) $actRetentionDays : null;

        $emailPurgeEnabled = (bool) (int) Setting::get('email_log_purge_enabled', '0');
        $emailRetentionDays = Setting::get('email_log_retention_days');
        $emailRetentionDays = $emailRetentionDays !== null ? (int) $emailRetentionDays : null;

        $actTotal = Activity::count();
        $actOldest = Activity::min('created_at');
        $actEligible = ($actRetentionDays && $actRetentionDays > 0)
            ? Activity::where('created_at', '<', now()->subDays($actRetentionDays))->count()
            : 0;

        $emailTotal = EmailLog::count();
        $emailOldest = EmailLog::min('created_at');
        $emailEligible = ($emailRetentionDays && $emailRetentionDays > 0)
            ? EmailLog::where('created_at', '<', now()->subDays($emailRetentionDays))->count()
            : 0;

        // Ambil riwayat pembersihan log terakhir dari activity_log
        $lastPurgeActivity = Activity::where('log_name', 'system')
            ->where('event', 'logs_purged')
            ->latest('id')
            ->first();

        $lastPurge = null;
        if ($lastPurgeActivity) {
            $lastPurge = [
                'at' => $lastPurgeActivity->created_at?->toIso8601String(),
                'causer_name' => $lastPurgeActivity->causer?->name ?? 'Sistem Terjadwal',
                'description' => $lastPurgeActivity->description,
                'properties' => $lastPurgeActivity->properties?->toArray() ?? [],
            ];
        }

        return [
            'activity_log' => [
                'total' => $actTotal,
                'oldest_at' => $actOldest ? Carbon::parse($actOldest)->toIso8601String() : null,
                'purge_enabled' => $actPurgeEnabled,
                'retention_days' => $actRetentionDays,
                'eligible_count' => $actEligible,
            ],
            'email_logs' => [
                'total' => $emailTotal,
                'oldest_at' => $emailOldest ? Carbon::parse($emailOldest)->toIso8601String() : null,
                'purge_enabled' => $emailPurgeEnabled,
                'retention_days' => $emailRetentionDays,
                'eligible_count' => $emailEligible,
            ],
            'last_purge' => $lastPurge,
        ];
    }

    /**
     * Hapus record activity_log yang lebih tua dari retensi yang ditentukan.
     */
    public function purgeActivityLogs(?int $retentionDays = null): int
    {
        if ($retentionDays === null) {
            $days = Setting::get('activity_log_retention_days');
            $retentionDays = $days !== null ? (int) $days : null;
        }

        if ($retentionDays === null || $retentionDays <= 0) {
            return 0;
        }

        $cutoff = now()->subDays($retentionDays);

        return Activity::where('created_at', '<', $cutoff)->delete();
    }

    /**
     * Hapus record email_logs yang lebih tua dari retensi yang ditentukan.
     */
    public function purgeEmailLogs(?int $retentionDays = null): int
    {
        if ($retentionDays === null) {
            $days = Setting::get('email_log_retention_days');
            $retentionDays = $days !== null ? (int) $days : null;
        }

        if ($retentionDays === null || $retentionDays <= 0) {
            return 0;
        }

        $cutoff = now()->subDays($retentionDays);

        return EmailLog::where('created_at', '<', $cutoff)->delete();
    }

    /**
     * Jalankan proses pembersihan log otomatis atau manual, dan catat audit log.
     *
     * @return array{activity_purged: int, email_purged: int}
     */
    public function purgeAll(bool $forceAll = false, ?User $causer = null, ?string $target = 'all'): array
    {
        $activityPurged = 0;
        $emailPurged = 0;

        $purgeActivity = in_array($target, ['all', 'activity'], true);
        $purgeEmail = in_array($target, ['all', 'email'], true);

        if ($purgeActivity) {
            $enabled = (bool) (int) Setting::get('activity_log_purge_enabled', '0');
            if ($forceAll || $enabled) {
                $activityPurged = $this->purgeActivityLogs();
            }
        }

        if ($purgeEmail) {
            $enabled = (bool) (int) Setting::get('email_log_purge_enabled', '0');
            if ($forceAll || $enabled) {
                $emailPurged = $this->purgeEmailLogs();
            }
        }

        if ($activityPurged > 0 || $emailPurged > 0 || $causer !== null) {
            $activity = activity('system')
                ->event('logs_purged')
                ->withProperties([
                    'target' => $target,
                    'activity_purged' => $activityPurged,
                    'email_purged' => $emailPurged,
                    'forced' => $forceAll,
                ]);

            if ($causer) {
                $activity->causedBy($causer);
            }

            $activity->log(
                "Pembersihan log selesai: {$activityPurged} log aktivitas dan {$emailPurged} log email dibersihkan."
            );
        }

        return [
            'activity_purged' => $activityPurged,
            'email_purged' => $emailPurged,
        ];
    }
}
