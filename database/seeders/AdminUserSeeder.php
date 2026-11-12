<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $defaultPassword = Hash::make('Password123#');

        // 1. Akun Super Administrator (Root System)
        $superAdminEmail = strtolower((string) (config('elq.admin.superadmin_email') ?: 'superadmin@elq.test'));
        $superAdmin = User::withTrashed()->firstOrNew(['email' => $superAdminEmail]);
        $superAdmin->fill([
            'name' => 'Super Administrator',
            'password' => $defaultPassword,
        ]);
        $superAdmin->forceFill([
            'is_active' => true,
            'email_verified_at' => $superAdmin->email_verified_at ?? now(),
        ])->save();

        if ($superAdmin->trashed()) {
            $superAdmin->restore();
        }
        $superAdmin->syncRoles([UserRole::SuperAdmin->value]);

        // 2. Akun Administrator (Operasional Asesmen)
        $adminEmail = strtolower((string) (config('elq.admin.email') ?: 'admin@elq.test'));
        $admin = User::withTrashed()->firstOrNew(['email' => $adminEmail]);
        $admin->fill([
            'name' => config('elq.admin.name') ?: 'Administrator',
            'password' => config('elq.admin.password') ? Hash::make(config('elq.admin.password')) : $defaultPassword,
        ]);
        $admin->forceFill([
            'is_active' => true,
            'email_verified_at' => $admin->email_verified_at ?? now(),
        ])->save();

        if ($admin->trashed()) {
            $admin->restore();
        }
        $admin->syncRoles([UserRole::Admin->value]);

        $this->command?->info('AdminUserSeeder berhasil: Akun Superadmin (superadmin@elq.test) dan Admin (admin@elq.test) siap digunakan.');
    }
}
