<?php

namespace Database\Seeders;

use App\Enums\PermissionName;
use App\Enums\UserRole;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    private const GUARD = 'web';

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionName::cases() as $permission) {
            Permission::findOrCreate($permission->value, self::GUARD);
        }

        $admin = Role::findOrCreate(UserRole::Admin->value, self::GUARD);
        // Peserta tanpa permission default: hak diberikan langsung per pengguna.
        Role::findOrCreate(UserRole::Participant->value, self::GUARD);

        // Admin selalu memegang semua permission (terkunci, Q-2).
        $admin->syncPermissions(PermissionName::values());
    }
}
