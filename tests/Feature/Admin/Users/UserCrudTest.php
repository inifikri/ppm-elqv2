<?php

use App\Models\Company;
use App\Models\ParticipantProfile;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Activitylog\Models\Activity;

beforeEach(fn () => $this->seed(RolePermissionSeeder::class));

function payload(array $o = []): array
{
    return [
        'name' => 'Budi', 'email' => 'Budi@Example.com', 'phone' => '0812-3',
        'password' => 'Secret-pass-123!', 'password_confirmation' => 'Secret-pass-123!',
        'role' => 'participant', 'is_active' => 1,
        'company_name' => ' PT Maju ', 'position' => 'Manajer',
        'permissions' => ['raters.manage-own', 'assessment.fill-self'],
        ...$o,
    ];
}

function participantWith(array $user = [], string $company = 'PT A', string $position = 'Staf'): User
{
    $u = User::factory()->participant()->create($user);
    ParticipantProfile::factory()->create([
        'user_id' => $u->id, 'company_id' => Company::firstOrCreate(['name' => $company])->id, 'position' => $position,
    ]);

    return $u;
}

it('akses: tamu, peserta, belum verified, admin', function () {
    $this->get('/admin/users')->assertRedirect('/login');
    $this->actingAs(User::factory()->participant()->create())->get('/admin/users')->assertForbidden();
    $this->actingAs(User::factory()->admin()->unverified()->create())->get('/admin/users')->assertRedirect();
    $this->actingAs(User::factory()->admin()->create())->get('/admin/users')->assertOk();
});

it('peserta dengan permission non-users.manage tetap 403', function () {
    $p = User::factory()->participant()->create();
    $p->givePermissionTo('raters.manage-own');
    $this->actingAs($p)->get('/admin/users')->assertForbidden();
});

it('index: pagination 10 per halaman dan urutan stabil', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->participant()->count(24)->create();

    $this->actingAs($admin)->get('/admin/users')
        ->assertInertia(fn (Assert $p) => $p->component('admin/users/index')->has('users.data', 10));
    $this->actingAs($admin)->get('/admin/users?page=3')
        ->assertInertia(fn (Assert $p) => $p->has('users.data', 5));
});

it('index: search nama, email, telepon, perusahaan, jabatan; wildcard literal', function () {
    $admin = User::factory()->admin()->create(['name' => 'Zed', 'email' => 'zed@x.test', 'phone' => '1']);
    participantWith(['name' => 'Alpha', 'email' => 'a@x.test', 'phone' => '0811'], 'Acme Corp', 'Direktur');
    participantWith(['name' => 'Beta', 'email' => 'b@x.test', 'phone' => '0822'], 'Other', 'Staf');
    $count = fn (string $s) => $this->actingAs($admin)->get('/admin/users?search='.urlencode($s))->viewData('page')['props']['users']['data'];

    expect($count('Alpha'))->toHaveCount(1)
        ->and($count('b@x.test'))->toHaveCount(1)
        ->and($count('0822'))->toHaveCount(1)
        ->and($count('Acme'))->toHaveCount(1)
        ->and($count('Direktur'))->toHaveCount(1)
        ->and($count('%'))->toHaveCount(0)
        ->and($count('_'))->toHaveCount(0);
});

it('store peserta: lowercase, hash, verified, firstOrCreate company, log permission', function () {
    $admin = User::factory()->admin()->create();
    Company::create(['name' => 'PT Maju']);

    $this->actingAs($admin)->post('/admin/users', payload())->assertRedirect('/admin/users');

    $u = User::where('email', 'budi@example.com')->firstOrFail();
    expect($u->password)->not->toBe('Secret-pass-123!')
        ->and($u->email_verified_at)->not->toBeNull()
        ->and(Company::count())->toBe(1)
        ->and($u->participantProfile->position)->toBe('Manajer')
        ->and($u->getDirectPermissions()->pluck('name')->sort()->values()->all())->toBe(['assessment.fill-self', 'raters.manage-own'])
        ->and(Activity::where('log_name', 'users')->where('description', 'permissions')->exists())->toBeTrue();
});

it('store admin: tanpa permission langsung; tolak permission luar Assessment; email duplikat', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->post('/admin/users', payload(['role' => 'admin', 'email' => 'adm2@x.test', 'permissions' => ['users.manage']]))
        ->assertRedirect('/admin/users');
    expect(User::where('email', 'adm2@x.test')->first()->getDirectPermissions())->toHaveCount(0);

    $this->actingAs($admin)->post('/admin/users', payload(['permissions' => ['users.manage']]))
        ->assertSessionHasErrors('permissions.0');
    $this->actingAs($admin)->post('/admin/users', payload(['email' => 'ADM2@x.test', 'role' => 'admin']))
        ->assertSessionHasErrors('email');
});

it('update: password kosong tetap, role tetap, sync permission, verified tetap, tolak nonaktif diri', function () {
    $admin = User::factory()->admin()->create();
    $u = participantWith();
    $u->givePermissionTo('raters.manage-own');
    $hash = $u->password;
    $verified = $u->email_verified_at;

    $this->actingAs($admin)->put("/admin/users/{$u->id}", [
        'name' => 'Baru', 'email' => $u->email, 'company_name' => 'PT B', 'position' => 'X',
        'is_active' => 1, 'permissions' => ['assessment.fill-self'], 'role' => 'admin',
    ])->assertRedirect('/admin/users');

    $u->refresh();
    expect($u->name)->toBe('Baru')
        ->and($u->password)->toBe($hash)
        ->and($u->email_verified_at->equalTo($verified))->toBeTrue()
        ->and($u->hasRole('participant'))->toBeTrue()->and($u->hasRole('admin'))->toBeFalse()
        ->and($u->getDirectPermissions()->pluck('name')->all())->toBe(['assessment.fill-self']);

    $this->actingAs($admin)->put("/admin/users/{$admin->id}", ['name' => 'A', 'email' => $admin->email, 'is_active' => 0])
        ->assertSessionHasErrors('is_active');
    expect($admin->fresh()->is_active)->toBeTrue();
});

it('destroy: soft delete; tolak diri sendiri dan admin aktif terakhir', function () {
    $admin = User::factory()->admin()->create();
    $u = participantWith();

    $this->actingAs($admin)->delete("/admin/users/{$u->id}")->assertRedirect('/admin/users');
    expect($u->fresh()->trashed())->toBeTrue()
        ->and(Activity::where('log_name', 'users')->where('event', 'deleted')->exists())->toBeTrue();

    $this->actingAs($admin)->delete("/admin/users/{$admin->id}")->assertRedirect();
    expect($admin->fresh()->trashed())->toBeFalse();

    $other = User::factory()->admin()->create();
    $this->actingAs($other)->delete("/admin/users/{$admin->id}")->assertRedirect(); // ada 2 admin: boleh
    expect($admin->fresh()->trashed())->toBeTrue();
    $this->actingAs($other)->delete("/admin/users/{$other->id}")->assertRedirect();
    expect($other->fresh()->trashed())->toBeFalse();
});

it('admin aktif terakhir tidak bisa dihapus orang lain', function () {
    $lastAdmin = User::factory()->admin()->create();
    $manager = User::factory()->participant()->create();
    $manager->givePermissionTo('users.manage');

    $this->actingAs($manager)->delete("/admin/users/{$lastAdmin->id}");
    expect($lastAdmin->fresh()->trashed())->toBeFalse();
});

it('bulk: campuran, dilewati dilaporkan, validasi', function () {
    $admin = User::factory()->admin()->create();
    [$a, $b] = [participantWith(), participantWith()];

    $this->actingAs($admin)->post('/admin/users/bulk', ['action' => 'deactivate', 'ids' => [$a->id, $admin->id, $b->id]])->assertRedirect();
    expect($a->fresh()->is_active)->toBeFalse()->and($admin->fresh()->is_active)->toBeTrue();

    $this->actingAs($admin)->post('/admin/users/bulk', ['action' => 'activate', 'ids' => [$a->id]]);
    expect($a->fresh()->is_active)->toBeTrue();

    $this->actingAs($admin)->post('/admin/users/bulk', ['action' => 'delete', 'ids' => [$a->id, $admin->id]]);
    expect($a->fresh()->trashed())->toBeTrue()->and($admin->fresh()->trashed())->toBeFalse();

    $this->actingAs($admin)->post('/admin/users/bulk', ['action' => 'delete', 'ids' => range(1000, 1100)])->assertSessionHasErrors('ids');
    $this->actingAs($admin)->post('/admin/users/bulk', ['action' => 'delete', 'ids' => [999999]])->assertSessionHasErrors('ids.0');
});

it('activity log tidak memuat data sensitif', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)->post('/admin/users', payload());

    $json = Activity::all()->map(fn ($a) => $a->properties->toJson())->implode('');
    expect($json)->not->toContain('password')->not->toContain('remember_token')->not->toContain('two_factor');
});

it('detail pengguna: JSON read-only tanpa data sensitif, hanya admin', function () {
    $target = participantWith(['last_login_at' => now()], 'PT Detail', 'Direktur');

    $this->getJson("/admin/users/{$target->id}/detail")->assertUnauthorized();
    $this->actingAs(User::factory()->participant()->create())->getJson("/admin/users/{$target->id}/detail")->assertForbidden();

    $response = $this->actingAs(User::factory()->admin()->create())->getJson("/admin/users/{$target->id}/detail")
        ->assertOk()
        ->assertJsonPath('data.company', 'PT Detail')
        ->assertJsonPath('data.position', 'Direktur')
        ->assertJsonPath('data.role', 'participant');

    expect(array_keys($response->json('data')))->not->toContain('password', 'remember_token');
});

it('foto: simpan jpg/png <=2MB, tolak format salah dan >2MB, ganti hapus file lama', function () {
    Storage::fake('public');
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->post('/admin/users', payload(['photo' => UploadedFile::fake()->create('a.gif', 10, 'image/gif')]))
        ->assertSessionHasErrors('photo');
    $this->actingAs($admin)->post('/admin/users', payload(['photo' => UploadedFile::fake()->image('a.jpg')->size(2049)]))
        ->assertSessionHasErrors('photo');

    $this->actingAs($admin)->post('/admin/users', payload(['photo' => UploadedFile::fake()->image('a.png')->size(2048)]))
        ->assertRedirect('/admin/users');
    $u = User::firstWhere('email', 'budi@example.com');
    $old = $u->photo_path;
    Storage::disk('public')->assertExists($old);

    $this->actingAs($admin)->put("/admin/users/{$u->id}", [
        'name' => 'Budi', 'email' => $u->email, 'company_name' => 'PT Maju', 'position' => 'X',
        'photo' => UploadedFile::fake()->image('b.jpg'),
    ])->assertRedirect('/admin/users');
    Storage::disk('public')->assertMissing($old);
    Storage::disk('public')->assertExists($u->fresh()->photo_path);
});
