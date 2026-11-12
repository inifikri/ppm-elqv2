<?php

use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use App\Models\EmailLog;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\SettingSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Activitylog\Models\Activity;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->seed(SettingSeeder::class);
    $this->superadmin = User::factory()->superadmin()->create();
});

it('akses: tamu diarahkan ke login, peserta dan admin ditolak 403, superadmin diizinkan 200', function () {
    $this->get('/admin/settings/retention')->assertRedirect('/login');

    $participant = User::factory()->participant()->create();
    $this->actingAs($participant)->get('/admin/settings/retention')->assertForbidden();

    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)->get('/admin/settings/retention')->assertForbidden();

    $this->actingAs($this->superadmin)->get('/admin/settings/retention')->assertOk();
});

it('menampilkan halaman konfigurasi retensi log dan statistik ringkasan', function () {
    $oldActivity = activity('auth')->log('Aktivitas lama');
    $oldActivity->created_at = now()->subDays(60);
    $oldActivity->save();

    EmailLog::factory()->create([
        'type' => EmailLogType::RaterInvitation,
        'recipient_email' => 'old@example.com',
        'status' => EmailLogStatus::Sent,
        'created_at' => now()->subDays(45),
    ]);

    $this->actingAs($this->superadmin)
        ->get('/admin/settings/retention')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/settings/retention')
            ->has('stats', fn (Assert $st) => $st
                ->has('activity_log', fn (Assert $act) => $act
                    ->has('total')
                    ->has('oldest_at')
                    ->has('purge_enabled')
                    ->has('retention_days')
                    ->has('eligible_count')
                )
                ->has('email_logs', fn (Assert $em) => $em
                    ->has('total')
                    ->has('oldest_at')
                    ->has('purge_enabled')
                    ->has('retention_days')
                    ->has('eligible_count')
                )
                ->has('last_purge')
            )
        );
});

it('superadmin dapat memperbarui pengaturan retensi log', function () {
    $response = $this->actingAs($this->superadmin)
        ->put('/admin/settings/retention', [
            'activity_log_purge_enabled' => true,
            'activity_log_retention_days' => 90,
            'email_log_purge_enabled' => true,
            'email_log_retention_days' => 60,
        ]);

    $response->assertRedirect('/admin/settings/retention');
    $response->assertSessionHasNoErrors();

    expect(Setting::get('activity_log_purge_enabled'))->toBe('1');
    expect(Setting::get('activity_log_retention_days'))->toBe('90');
    expect(Setting::get('email_log_purge_enabled'))->toBe('1');
    expect(Setting::get('email_log_retention_days'))->toBe('60');
});

it('validasi gagal jika retention_days bernilai negatif atau bukan integer', function () {
    $this->actingAs($this->superadmin)
        ->from('/admin/settings/retention')
        ->put('/admin/settings/retention', [
            'activity_log_purge_enabled' => true,
            'activity_log_retention_days' => 0,
            'email_log_purge_enabled' => true,
            'email_log_retention_days' => -5,
        ])
        ->assertRedirect('/admin/settings/retention')
        ->assertSessionHasErrors(['activity_log_retention_days', 'email_log_retention_days']);
});

it('manual purge menghapus log yang lebih tua dari batas retensi dan mempertahankan log baru', function () {
    Setting::set('activity_log_retention_days', 30);
    Setting::set('email_log_retention_days', 30);

    // Old activity log (> 30 days)
    $oldActivity = activity('auth')->log('Aktivitas lama');
    $oldActivity->created_at = now()->subDays(35);
    $oldActivity->save();

    // Recent activity log (< 30 days)
    $recentActivity = activity('auth')->log('Aktivitas baru');
    $recentActivity->created_at = now()->subDays(5);
    $recentActivity->save();

    // Old email log (> 30 days)
    $oldEmail = EmailLog::factory()->create([
        'recipient_email' => 'old@example.com',
        'created_at' => now()->subDays(40),
    ]);

    // Recent email log (< 30 days)
    $recentEmail = EmailLog::factory()->create([
        'recipient_email' => 'recent@example.com',
        'created_at' => now()->subDays(2),
    ]);

    // Execute purge target 'activity'
    $this->actingAs($this->superadmin)
        ->post('/admin/settings/retention/purge', ['target' => 'activity'])
        ->assertRedirect('/admin/settings/retention')
        ->assertSessionHasNoErrors();

    expect(Activity::find($oldActivity->id))->toBeNull();
    expect(Activity::find($recentActivity->id))->not->toBeNull();
    // Email logs should NOT be purged by activity target
    expect(EmailLog::find($oldEmail->id))->not->toBeNull();

    // Execute purge target 'email'
    $this->actingAs($this->superadmin)
        ->post('/admin/settings/retention/purge', ['target' => 'email'])
        ->assertRedirect('/admin/settings/retention')
        ->assertSessionHasNoErrors();

    expect(EmailLog::find($oldEmail->id))->toBeNull();
    expect(EmailLog::find($recentEmail->id))->not->toBeNull();
});

it('artisan command logs:purge menghapus record sesuai jadwal jika aktif atau force', function () {
    Setting::set('activity_log_purge_enabled', '0');
    Setting::set('activity_log_retention_days', '30');

    $oldActivity = activity('system')->log('Aktivitas lama');
    $oldActivity->created_at = now()->subDays(40);
    $oldActivity->save();

    // Karena purge disabled, command default tidak menghapus apa-apa
    $this->artisan('logs:purge')
        ->expectsOutputToContain('Pembersihan log berhasil diselesaikan.')
        ->assertSuccessful();

    expect(Activity::find($oldActivity->id))->not->toBeNull();

    // Gunakan --force untuk tetap menjalankan purge meskipun purge disabled di setting
    $this->artisan('logs:purge --force')
        ->expectsOutputToContain('Pembersihan log berhasil diselesaikan.')
        ->assertSuccessful();

    expect(Activity::find($oldActivity->id))->toBeNull();
});
