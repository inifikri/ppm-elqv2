<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->admin = User::factory()->admin()->create();
});

it('akses: tamu diarahkan ke login, peserta ditolak, admin diizinkan', function () {
    $this->get('/admin/activity-logs')->assertRedirect('/login');

    $participant = User::factory()->participant()->create();
    $this->actingAs($participant)->get('/admin/activity-logs')->assertForbidden();

    $this->actingAs($this->admin)->get('/admin/activity-logs')->assertOk();
});

it('menampilkan daftar log aktivitas dengan pagination dan filters', function () {
    activity('users')
        ->causedBy($this->admin)
        ->event('created')
        ->log('Membuat akun pengguna baru');

    activity('auth')
        ->event('login_success')
        ->log('Pengguna berhasil masuk');

    $this->actingAs($this->admin)
        ->get('/admin/activity-logs')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/activity-logs/index')
            ->has('activities.data')
            ->has('filters')
            ->has('availableLogNames')
        );
});

it('filter berdasarkan search, log_name, dan event berfungsi', function () {
    activity('users')
        ->causedBy($this->admin)
        ->event('created')
        ->log('Membuat akun pengguna baru');

    activity('auth')
        ->event('login_success')
        ->log('Pengguna berhasil masuk');

    $res = $this->actingAs($this->admin)
        ->get('/admin/activity-logs?log_name=users')
        ->assertOk();

    $res->assertInertia(fn (Assert $page) => $page
        ->where('activities.data.0.log_name', 'users')
    );

    $resSearch = $this->actingAs($this->admin)
        ->get('/admin/activity-logs?search=masuk')
        ->assertOk();

    $resSearch->assertInertia(fn (Assert $page) => $page
        ->where('activities.data.0.log_name', 'auth')
    );
});
