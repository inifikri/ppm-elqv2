<?php

use App\Enums\PermissionName;
use App\Enums\RaterRole;
use App\Enums\UserRole;
use App\Jobs\SendAssessmentInvitation;
use App\Models\Company;
use App\Models\ParticipantProfile;
use App\Models\Rater;
use App\Models\User;
use Illuminate\Support\Facades\Queue;
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

test('participant list is accessible by admin and forbidden for participant', function () {
    $participant = User::factory()->participant()->create();

    $this->actingAs($participant)
        ->get(route('admin.participants.index'))
        ->assertForbidden();

    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.participants.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/participants/index')
            ->has('participants.data')
        );
});

test('participant list with tab trash returns ok and filters trashed', function () {
    $admin = User::factory()->admin()->create();
    $participant = User::factory()->participant()->create();
    $participant->delete();

    $this->actingAs($admin)
        ->get('/admin/participants?tab=trash')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/participants/index')
            ->where('filters.tab', 'trash')
            ->has('participants.data', 1)
        );
});

test('admin can view trashed participant detail', function () {
    $admin = User::factory()->admin()->create();
    $participant = User::factory()->participant()->create();
    $participant->delete();

    $this->actingAs($admin)
        ->get(route('admin.participants.show', $participant))
        ->assertOk();
});

test('admin can view participant edit page', function () {
    $admin = User::factory()->admin()->create();
    $participant = User::factory()->participant()->create();
    $company = Company::create(['name' => 'PT Maju Terus', 'name_normalized' => 'pt maju terus']);

    ParticipantProfile::create([
        'user_id' => $participant->id,
        'company_id' => $company->id,
        'position' => 'Staff',
    ]);

    Rater::factory()->create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Boss,
        'email' => 'boss@example.com',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.participants.edit', $participant))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/participants/edit')
            ->has('participant')
            ->has('companies')
        );
});

test('admin can update participant profile and raters via edit form', function () {
    $admin = User::factory()->admin()->create();
    $participant = User::factory()->participant()->create([
        'name' => 'Nama Lama',
        'email' => 'lama@example.com',
    ]);
    $company = Company::create(['name' => 'PT Maju Terus', 'name_normalized' => 'pt maju terus']);

    ParticipantProfile::create([
        'user_id' => $participant->id,
        'company_id' => $company->id,
        'position' => 'Staff',
    ]);

    $bossRater = Rater::factory()->create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Boss,
        'email' => 'boss.lama@example.com',
    ]);

    $subRater = Rater::factory()->create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Subordinate,
        'email' => 'sub1.lama@example.com',
    ]);

    $this->actingAs($admin)
        ->put(route('admin.participants.update', $participant), [
            'name' => 'Nama Baru',
            'email' => 'baru@example.com',
            'phone' => '0899999999',
            'company_name' => 'PT Sukses Mandiri',
            'position' => 'General Manager',
            'boss_email' => 'boss.baru@example.com',
            'subordinate_emails' => [
                'sub1.baru@example.com',
                'sub2.baru@example.com',
                'sub3.baru@example.com',
            ],
        ])
        ->assertRedirect(route('admin.participants.show', $participant));

    $participant->refresh();
    expect($participant->name)->toBe('Nama Baru');
    expect($participant->email)->toBe('baru@example.com');
    expect($participant->phone)->toBe('0899999999');

    $profile = $participant->participantProfile;
    expect($profile->position)->toBe('General Manager');
    expect($profile->company->name)->toBe('PT Sukses Mandiri');

    expect($bossRater->fresh()->email)->toBe('boss.baru@example.com');
    expect($participant->raters()->where('role', RaterRole::Subordinate)->pluck('email')->all())
        ->toEqualCanonicalizing([
            'sub1.baru@example.com',
            'sub2.baru@example.com',
            'sub3.baru@example.com',
        ]);
});

test('admin can resend invitation to unsubmitted rater', function () {
    Queue::fake();

    $admin = User::factory()->admin()->create();
    $participant = User::factory()->participant()->create();

    $rater = Rater::factory()->create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Boss,
        'email' => 'boss@example.com',
        'submitted_at' => null,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.participants.raters.resend', [$participant, $rater]))
        ->assertRedirect();

    Queue::assertPushed(SendAssessmentInvitation::class);
});

test('resend invitation is rejected for already submitted rater', function () {
    Queue::fake();

    $admin = User::factory()->admin()->create();
    $participant = User::factory()->participant()->create();

    $rater = Rater::factory()->submitted()->create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Boss,
        'email' => 'boss@example.com',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.participants.raters.resend', [$participant, $rater]))
        ->assertSessionHasErrors(['message']);

    Queue::assertNotPushed(SendAssessmentInvitation::class);
});

test('admin can revoke rater link and generate new ULID', function () {
    $admin = User::factory()->admin()->create();
    $participant = User::factory()->participant()->create();

    $rater = Rater::factory()->create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Boss,
        'email' => 'boss@example.com',
        'submitted_at' => null,
    ]);

    $oldUlid = $rater->ulid;

    $this->actingAs($admin)
        ->post(route('admin.participants.raters.revoke', [$participant, $rater]), [
            'send_invitation' => false,
        ])
        ->assertRedirect();

    $rater->refresh();
    expect($rater->ulid)->not->toBe($oldUlid);

    // Old ULID returns 404 / unavailable (FR-041)
    $this->get("/rater/{$oldUlid}")
        ->assertStatus(404);
});

test('revoking link is rejected for submitted rater', function () {
    $admin = User::factory()->admin()->create();
    $participant = User::factory()->participant()->create();

    $rater = Rater::factory()->submitted()->create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Boss,
        'email' => 'boss@example.com',
    ]);

    $oldUlid = $rater->ulid;

    $this->actingAs($admin)
        ->post(route('admin.participants.raters.revoke', [$participant, $rater]))
        ->assertSessionHasErrors(['message']);

    expect($rater->fresh()->ulid)->toBe($oldUlid);
});

test('participant search safely handles sql special characters', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.participants.index', ['search' => "%'_--' OR 1=1"]))
        ->assertOk();
});

test('bulk resend invitations skips submitted raters', function () {
    Queue::fake();

    $admin = User::factory()->admin()->create();
    $participant = User::factory()->participant()->create();

    // Submitted rater
    Rater::factory()->submitted()->create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Boss,
        'email' => 'boss@example.com',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.participants.bulk'), [
            'action' => 'resend_invitations',
            'ids' => [$participant->id],
        ])
        ->assertRedirect();

    Queue::assertNotPushed(SendAssessmentInvitation::class);
});

test('admin can view participant create page', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.participants.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/participants/create')
            ->has('companies')
        );
});

test('admin can create participant with boss and 3 subordinates and dispatch invitations', function () {
    Queue::fake();

    $admin = User::factory()->admin()->create();

    $payload = [
        'name' => 'Budi Prakoso',
        'email' => 'budi.prakoso@example.com',
        'phone' => '081234567890',
        'company_name' => 'PT Nusantara Sejahtera',
        'position' => 'Senior Engineering Manager',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'boss_email' => 'boss.budi@example.com',
        'subordinate_emails' => [
            'sub1.budi@example.com',
            'sub2.budi@example.com',
            'sub3.budi@example.com',
        ],
    ];

    $response = $this->actingAs($admin)
        ->post(route('admin.participants.store'), $payload);

    $user = User::where('email', 'budi.prakoso@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->hasRole(UserRole::Participant->value))->toBeTrue();

    $response->assertRedirect(route('admin.participants.show', $user));

    $profile = $user->participantProfile;
    expect($profile)->not->toBeNull();
    expect($profile->position)->toBe('Senior Engineering Manager');
    expect($profile->company->name)->toBe('PT Nusantara Sejahtera');

    $raters = $user->raters;
    expect($raters->count())->toBe(5); // 1 self, 1 boss, 3 subordinate
    expect($raters->where('role', RaterRole::SelfRater)->first()->email)->toBeNull();
    expect($raters->where('role', RaterRole::Boss)->first()->email)->toBe('boss.budi@example.com');
    expect($raters->where('role', RaterRole::Subordinate)->pluck('email')->all())->toEqualCanonicalizing([
        'sub1.budi@example.com',
        'sub2.budi@example.com',
        'sub3.budi@example.com',
    ]);

    Queue::assertPushed(SendAssessmentInvitation::class, 4);
});

test('create participant fails when emails duplicate or match participant', function () {
    $admin = User::factory()->admin()->create();

    $payload = [
        'name' => 'Budi Prakoso',
        'email' => 'budi.prakoso@example.com',
        'company_name' => 'PT Nusantara Sejahtera',
        'position' => 'Manager',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'boss_email' => 'budi.prakoso@example.com', // same as participant
        'subordinate_emails' => [
            'sub1@example.com',
            'sub1@example.com', // duplicate
            'sub3@example.com',
        ],
    ];

    $this->actingAs($admin)
        ->post(route('admin.participants.store'), $payload)
        ->assertSessionHasErrors(['boss_email', 'subordinate_emails.0', 'subordinate_emails.1']);
});

test('admin can update rater email and optionally resend invitation', function () {
    Queue::fake();

    $admin = User::factory()->admin()->create();
    $participant = User::factory()->participant()->create();

    $rater = Rater::factory()->create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Boss,
        'email' => 'oldboss@example.com',
        'submitted_at' => null,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.participants.raters.update', [$participant, $rater]), [
            'email' => 'newboss@example.com',
            'send_invitation' => true,
        ])
        ->assertRedirect();

    expect($rater->fresh()->email)->toBe('newboss@example.com');
    Queue::assertPushed(SendAssessmentInvitation::class);
});

test('updating rater email to participant email is rejected', function () {
    $admin = User::factory()->admin()->create();
    $participant = User::factory()->participant()->create(['email' => 'participant@example.com']);

    $rater = Rater::factory()->create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Boss,
        'email' => 'boss@example.com',
    ]);

    $this->actingAs($admin)
        ->put(route('admin.participants.raters.update', [$participant, $rater]), [
            'email' => 'participant@example.com',
        ])
        ->assertSessionHasErrors(['email']);

    expect($rater->fresh()->email)->toBe('boss@example.com');
});
