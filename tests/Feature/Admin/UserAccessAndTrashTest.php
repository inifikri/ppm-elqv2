<?php

use App\Enums\EmailLogType;
use App\Enums\PermissionName;
use App\Enums\UserRole;
use App\Models\EmailLog;
use App\Models\User;
use Illuminate\Support\Facades\Notification;
use Spatie\Activitylog\Models\Activity;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    foreach (PermissionName::cases() as $permission) {
        Permission::findOrCreate($permission->value, 'web');
    }

    $adminRole = Role::findOrCreate(UserRole::Admin->value, 'web');
    $adminRole->syncPermissions(PermissionName::values());

    $participantRole = Role::findOrCreate(UserRole::Participant->value, 'web');
    $participantRole->syncPermissions(
        array_column(PermissionName::defaultsFor(UserRole::Participant), 'value')
    );
});

test('participant role cannot access users management', function () {
    $participant = User::factory()->participant()->create();

    $this->actingAs($participant)
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

test('admin can view users index and search users', function () {
    $admin = User::factory()->admin()->create();
    $target = User::factory()->create(['name' => 'Budi Santoso']);

    $this->actingAs($admin)
        ->get(route('admin.users.index', ['search' => 'Budi']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->has('users.data', 1)
        );
});

test('admin can view users create page', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.users.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/create')
        );
});

test('admin can trigger password reset link for user', function () {
    Notification::fake();

    $admin = User::factory()->admin()->create();
    $user = User::factory()->create(['email' => 'karyawan@example.com']);

    $this->actingAs($admin)
        ->post(route('admin.users.reset-password', $user))
        ->assertRedirect();

    expect(EmailLog::query()
        ->where('type', EmailLogType::PasswordReset)
        ->where('recipient_email', 'karyawan@example.com')
        ->exists()
    )->toBeTrue();
});

test('admin can soft delete and restore user from trash', function () {
    $admin = User::factory()->admin()->create();
    $target = User::factory()->create();

    // Soft delete
    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $target))
        ->assertRedirect();

    expect($target->fresh()->trashed())->toBeTrue();

    // Restore
    $this->actingAs($admin)
        ->post(route('admin.users.restore', $target->id))
        ->assertRedirect();

    expect($target->fresh()->trashed())->toBeFalse();
});

test('admin can bulk restore users from trash', function () {
    $admin = User::factory()->admin()->create();
    $users = User::factory()->count(3)->create();

    foreach ($users as $user) {
        $user->delete();
    }

    $this->actingAs($admin)
        ->post(route('admin.users.bulk'), [
            'action' => 'restore',
            'ids' => $users->pluck('id')->all(),
        ])
        ->assertRedirect();

    foreach ($users as $user) {
        expect($user->fresh()->trashed())->toBeFalse();
    }
});

test('admin cannot delete themselves', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $admin))
        ->assertRedirect();

    expect($admin->fresh()->trashed())->toBeFalse();
});

test('user creation succeeds with only name email password and role', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Peserta Baru',
            'email' => 'peserta.baru@example.com',
            'role' => UserRole::Participant->value,
            'password' => 'Password123#',
            'password_confirmation' => 'Password123#',
        ])
        ->assertRedirect(route('admin.users.index'));

    $created = User::where('email', 'peserta.baru@example.com')->first();
    expect($created)->not->toBeNull();
    expect($created->name)->toBe('Peserta Baru');
});

test('admin can view user detail page', function () {
    $admin = User::factory()->admin()->create();
    $target = User::factory()->participant()->create();

    $this->actingAs($admin)
        ->get(route('admin.users.show', $target))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/show')
            ->has('user')
            ->has('activities')
        );
});

test('admin can update user without providing company and position', function () {
    $admin = User::factory()->admin()->create();
    $target = User::factory()->participant()->create();

    $this->actingAs($admin)
        ->put(route('admin.users.update', $target), [
            'name' => 'Nama Baru',
            'email' => 'namabaru@example.com',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.users.index'));

    expect($target->fresh()->name)->toBe('Nama Baru');
});

test('admin can force delete user and purge associated records while preserving activity log', function () {
    $admin = User::factory()->admin()->create();
    $target = User::factory()->participant()->create();
    $targetId = $target->id;

    activity('users')
        ->performedOn($target)
        ->causedBy($admin)
        ->log('Aktivitas testing user');

    $this->actingAs($admin)
        ->delete(route('admin.users.force-delete', $target))
        ->assertRedirect(route('admin.users.index', ['tab' => 'trash']));

    expect(User::withTrashed()->find($targetId))->toBeNull();

    // Verifikasi activity log tetap tersimpan permanen
    expect(Activity::where('subject_id', $targetId)->exists())->toBeTrue();
});

test('admin cannot force delete themselves', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->delete(route('admin.users.force-delete', $admin))
        ->assertRedirect();

    expect(User::find($admin->id))->not->toBeNull();
});

test('admin can bulk force delete users from trash', function () {
    $admin = User::factory()->admin()->create();
    $users = User::factory()->count(2)->create();
    $ids = $users->pluck('id')->all();

    foreach ($users as $u) {
        $u->delete();
    }

    $this->actingAs($admin)
        ->post(route('admin.users.bulk'), [
            'action' => 'force_delete',
            'ids' => $ids,
        ])
        ->assertRedirect();

    foreach ($ids as $id) {
        expect(User::withTrashed()->find($id))->toBeNull();
    }
});
