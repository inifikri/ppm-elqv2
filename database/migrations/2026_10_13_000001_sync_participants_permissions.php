<?php

use App\Enums\PermissionName;
use App\Enums\UserRole;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    private const GUARD = 'web';

    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionName::cases() as $permission) {
            Permission::findOrCreate($permission->value, self::GUARD);
        }

        $admin = Role::findOrCreate(UserRole::Admin->value, self::GUARD);
        $admin->syncPermissions(PermissionName::values());
    }

    public function down(): void
    {
        // No-op to avoid breaking role assignment on rollback
    }
};
