<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionName;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateLogRetentionRequest;
use App\Models\Setting;
use App\Services\Logging\LogPurgeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class LogRetentionController extends Controller
{
    public function index(Request $request, LogPurgeService $service): Response
    {
        Gate::authorize(PermissionName::SettingsManage->value);

        return Inertia::render('admin/settings/retention', [
            'stats' => $service->getStats(),
        ]);
    }

    public function update(UpdateLogRetentionRequest $request): RedirectResponse
    {
        Gate::authorize(PermissionName::SettingsManage->value);

        $validated = $request->validated();

        Setting::set('activity_log_purge_enabled', $validated['activity_log_purge_enabled']);
        Setting::set('activity_log_retention_days', $validated['activity_log_retention_days'] ?? null);

        Setting::set('email_log_purge_enabled', $validated['email_log_purge_enabled']);
        Setting::set('email_log_retention_days', $validated['email_log_retention_days'] ?? null);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pengaturan retensi log berhasil disimpan.',
        ]);

        return redirect()->route('admin.settings.retention.index');
    }

    public function purge(Request $request, LogPurgeService $service): RedirectResponse
    {
        Gate::authorize(PermissionName::SettingsManage->value);

        $request->validate([
            'target' => ['required', 'in:all,activity,email'],
        ]);

        $target = (string) $request->input('target', 'all');
        $result = $service->purgeAll(forceAll: true, causer: $request->user(), target: $target);

        $msg = match ($target) {
            'activity' => "Pembersihan selesai: {$result['activity_purged']} log aktivitas berhasil dihapus.",
            'email' => "Pembersihan selesai: {$result['email_purged']} log email berhasil dihapus.",
            default => "Pembersihan selesai: {$result['activity_purged']} log aktivitas dan {$result['email_purged']} log email berhasil dihapus.",
        };

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $msg,
        ]);

        return redirect()->route('admin.settings.retention.index');
    }
}
