<?php

use App\Enums\PermissionName;
use App\Models\Question;
use App\Models\Rater;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\QuestionnaireSeeder;
use Database\Seeders\RolePermissionSeeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

it('idempotent: dua kali seed jumlah baris sama', function () {
    config(['elq.admin' => ['name' => 'Adm', 'email' => 'adm@x.test', 'password' => 'secret-123']]);
    $count = fn () => [User::count(), Rater::count(), Role::count(), Permission::count(), Setting::count()];

    $this->seed(DatabaseSeeder::class);
    $first = $count();
    $this->seed(DatabaseSeeder::class);

    expect($count())->toBe($first)
        ->and(Setting::count())->toBe(4);
});

it('admin tidak dibuat bila config kosong dan dibuat terverifikasi bila terisi', function () {
    config(['elq.admin' => ['name' => null, 'email' => null, 'password' => null]]);
    $this->seed([RolePermissionSeeder::class, AdminUserSeeder::class]);
    expect(User::count())->toBe(0);

    config(['elq.admin' => ['name' => 'Adm', 'email' => 'Adm@X.test', 'password' => 'secret-123']]);
    $this->seed(AdminUserSeeder::class);
    $admin = User::first();

    expect($admin->email)->toBe('adm@x.test')
        ->and($admin->is_active)->toBeTrue()
        ->and($admin->email_verified_at)->not->toBeNull()
        ->and($admin->hasRole('admin'))->toBeTrue();
});

it('admin punya semua permission dan role participant tanpa permission default', function () {
    $this->seed(RolePermissionSeeder::class);
    expect(Role::findByName('admin')->permissions)->toHaveCount(count(PermissionName::cases()))
        ->and(Role::findByName('participant')->permissions)->toHaveCount(0);
});

it('QuestionnaireSeeder tidak menggandakan data', function () {
    $path = database_path('seeders/data/questionnaire.json');
    $existed = file_exists($path);
    $existed || copy(database_path('seeders/data/questionnaire.example.json'), $path);

    try {
        $this->seed(QuestionnaireSeeder::class);
        $count = Question::count();
        $this->seed(QuestionnaireSeeder::class);

        expect($count)->toBeGreaterThan(0)->and(Question::count())->toBe($count);
    } finally {
        $existed || unlink($path);
    }
});

it('DemoSeeder tidak berjalan di production', function () {
    $this->seed(RolePermissionSeeder::class);
    $this->app['env'] = 'production';
    app(DemoSeeder::class)->run();
    $this->app['env'] = 'testing';

    expect(User::count())->toBe(0);
});
