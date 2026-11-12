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

        // 1. Superadmin memegang seluruh permission sistem
        $superadmin = Role::findOrCreate(UserRole::SuperAdmin->value, self::GUARD);
        $superadmin->syncPermissions(PermissionName::values());

        // 2. Admin memegang permission operasional asesmen
        $admin = Role::findOrCreate(UserRole::Admin->value, self::GUARD);
        $admin->syncPermissions(array_column(PermissionName::forRole(UserRole::Admin), 'value'));

        // 3. Peserta tanpa permission default: hak diberikan langsung per pengguna.
        Role::findOrCreate(UserRole::Participant->value, self::GUARD);
    }
}
