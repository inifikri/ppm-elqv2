<?php

use App\Enums\EmailLogType;
use App\Enums\PermissionName;
use App\Enums\RaterRole;
use App\Enums\UserRole;
use App\Jobs\SendAssessmentInvitation;
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

test('reminders page is accessible by admin and forbidden for participant', function () {
    $participant = User::factory()->participant()->create();

    $this->actingAs($participant)
        ->get(route('admin.reminders.index'))
        ->assertForbidden();

    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.reminders.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/reminders/index')
            ->has('reminders.data')
            ->has('stats')
            ->has('filters')
        );
});

test('reminders page filters raters pending more than 2 days', function () {
    $admin = User::factory()->admin()->create();
    $participant = User::factory()->participant()->create();

    // Rater lama (> 2 hari)
    $staleRater = Rater::create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Boss,
        'email' => 'atasan.lama@example.com',
    ]);
    $staleRater->created_at = now()->subDays(3);
    $staleRater->save();

    // Rater baru (< 2 hari)
    $freshRater = Rater::create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Subordinate,
        'email' => 'bawahan.baru@example.com',
    ]);
    $freshRater->created_at = now()->subHours(12);
    $freshRater->save();

    $response = $this->actingAs($admin)
        ->get(route('admin.reminders.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('reminders.total', 1)
        ->where('reminders.data.0.email', 'atasan.lama@example.com')
    );
});

test('bulk remind sends reminder invitations to selected pending raters', function () {
    Queue::fake();

    $admin = User::factory()->admin()->create();
    $participant = User::factory()->participant()->create();

    $rater1 = Rater::create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Boss,
        'email' => 'atasan1@example.com',
    ]);
    $rater1->created_at = now()->subDays(3);
    $rater1->save();

    $rater2 = Rater::create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Subordinate,
        'email' => 'bawahan1@example.com',
    ]);
    $rater2->created_at = now()->subDays(4);
    $rater2->save();

    $response = $this->actingAs($admin)
        ->post(route('admin.reminders.bulk'), [
            'rater_ids' => [$rater1->id, $rater2->id],
        ]);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();

    Queue::assertPushed(SendAssessmentInvitation::class, 2);

    $this->assertDatabaseHas('email_logs', [
        'recipient_email' => 'atasan1@example.com',
        'type' => EmailLogType::RaterInvitation->value,
    ]);

    $this->assertDatabaseHas('email_logs', [
        'recipient_email' => 'bawahan1@example.com',
        'type' => EmailLogType::RaterInvitation->value,
    ]);
});

test('individual remind action from reminders page sends email reminder', function () {
    Queue::fake();

    $admin = User::factory()->admin()->create();
    $participant = User::factory()->participant()->create();

    $rater = Rater::create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Boss,
        'email' => 'atasan.tunggal@example.com',
    ]);
    $rater->created_at = now()->subDays(3);
    $rater->save();

    $response = $this->actingAs($admin)
        ->post(route('admin.reminders.remind', ['rater' => $rater->ulid]));

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();

    Queue::assertPushed(SendAssessmentInvitation::class, function ($job) use ($rater) {
        return $job->rater->id === $rater->id && $job->isReminder === true;
    });
});
