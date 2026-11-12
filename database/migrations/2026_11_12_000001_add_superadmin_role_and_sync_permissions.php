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

        // 1. Role Superadmin memegang seluruh hak akses sistem
        $superadmin = Role::findOrCreate(UserRole::SuperAdmin->value, self::GUARD);
        $superadmin->syncPermissions(PermissionName::values());

        // 2. Role Admin hanya memegang hak akses operasional asesmen
        $admin = Role::findOrCreate(UserRole::Admin->value, self::GUARD);
        $adminPermissions = array_column(PermissionName::forRole(UserRole::Admin), 'value');
        $admin->syncPermissions($adminPermissions);
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // Kembalikan seluruh permissions ke role admin saat rollback
        $admin = Role::where('name', UserRole::Admin->value)->where('guard_name', self::GUARD)->first();
        if ($admin) {
            $admin->syncPermissions(PermissionName::values());
        }

        // Hapus role superadmin jika tidak ada user yang terhubung
        $superadmin = Role::where('name', UserRole::SuperAdmin->value)->where('guard_name', self::GUARD)->first();
        if ($superadmin && $superadmin->users()->count() === 0) {
            $superadmin->delete();
        }
    }
};
