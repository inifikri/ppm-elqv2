<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = config('elq.admin.email');
        $password = config('elq.admin.password');

        if (blank($email) || blank($password)) {
            $this->command?->warn('AdminUserSeeder dilewati: ADMIN_EMAIL / ADMIN_PASSWORD belum diisi.');

            return;
        }

        $admin = User::withTrashed()->firstOrNew(['email' => strtolower($email)]);
        $admin->fill([
            'name' => config('elq.admin.name') ?: 'Administrator',
            'password' => $password,
        ]);
        // is_active & verifikasi diisi eksplisit: akun admin langsung terverifikasi (Q-4).
        $admin->forceFill(['is_active' => true, 'email_verified_at' => $admin->email_verified_at ?? now()])->save();

        if ($admin->trashed()) {
            $admin->restore();
        }

        $admin->syncRoles(UserRole::Admin->value);
    }
}
