<?php

use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use App\Enums\RaterRole;
use App\Jobs\SendAssessmentInvitation;
use App\Models\EmailLog;
use App\Models\Rater;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->admin = User::factory()->admin()->create();
});

it('akses: tamu diarahkan ke login, peserta ditolak, admin diizinkan', function () {
    $this->get('/admin/email-logs')->assertRedirect('/login');

    $participant = User::factory()->participant()->create();
    $this->actingAs($participant)->get('/admin/email-logs')->assertForbidden();

    $this->actingAs($this->admin)->get('/admin/email-logs')->assertOk();
});

it('menampilkan daftar log email dan ringkasan metrik statistik', function () {
    EmailLog::factory()->create([
        'type' => EmailLogType::RaterInvitation,
        'recipient_email' => 'rater1@example.com',
        'status' => EmailLogStatus::Sent,
    ]);

    EmailLog::factory()->create([
        'type' => EmailLogType::RaterInvitation,
        'recipient_email' => 'rater2@example.com',
        'status' => EmailLogStatus::Failed,
        'error_message' => 'Connection timeout to SMTP server',
    ]);

    $this->actingAs($this->admin)
        ->get('/admin/email-logs')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/email-logs/index')
            ->has('logs.data')
            ->has('stats')
            ->where('stats.sent', 1)
            ->where('stats.failed', 1)
            ->has('availableStatuses')
            ->has('availableTypes')
        );
});

it('filter berdasarkan search, status, dan type berfungsi dengan benar', function () {
    EmailLog::factory()->create([
        'type' => EmailLogType::RaterInvitation,
        'recipient_email' => 'target.spesifik@example.com',
        'status' => EmailLogStatus::Sent,
    ]);

    EmailLog::factory()->create([
        'type' => EmailLogType::PasswordReset,
        'recipient_email' => 'other@example.com',
        'status' => EmailLogStatus::Failed,
    ]);

    // Search filter
    $this->actingAs($this->admin)
        ->get('/admin/email-logs?search=target.spesifik')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('logs.data', 1)
            ->where('logs.data.0.recipient_email', 'target.spesifik@example.com')
        );

    // Status filter
    $this->actingAs($this->admin)
        ->get('/admin/email-logs?status=failed')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('logs.data', 1)
            ->where('logs.data.0.status', 'failed')
        );

    // Type filter
    $this->actingAs($this->admin)
        ->get('/admin/email-logs?type=rater_invitation')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('logs.data', 1)
            ->where('logs.data.0.type', 'rater_invitation')
        );
});

it('admin dapat mengirim ulang (retry) email log yang gagal', function () {
    Queue::fake();

    $participant = User::factory()->participant()->create();
    $rater = Rater::factory()->create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Boss,
        'email' => 'atasan.gagal@example.com',
        'submitted_at' => null,
    ]);

    $log = EmailLog::factory()->create([
        'type' => EmailLogType::RaterInvitation,
        'recipient_email' => $rater->email,
        'rater_id' => $rater->id,
        'status' => EmailLogStatus::Failed,
        'attempts' => 1,
        'error_message' => 'SMTP error',
    ]);

    $this->actingAs($this->admin)
        ->post("/admin/email-logs/{$log->id}/retry")
        ->assertRedirect();

    expect($log->fresh()->status)->toBe(EmailLogStatus::Queued);
    Queue::assertPushed(SendAssessmentInvitation::class);
});

it('admin dapat mengirim ulang massal (bulk retry) email log', function () {
    Queue::fake();

    $participant = User::factory()->participant()->create();
    $rater1 = Rater::factory()->create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Boss,
        'email' => 'boss@example.com',
        'submitted_at' => null,
    ]);
    $rater2 = Rater::factory()->create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Subordinate,
        'email' => 'sub1@example.com',
        'submitted_at' => null,
    ]);

    $log1 = EmailLog::factory()->create([
        'type' => EmailLogType::RaterInvitation,
        'recipient_email' => $rater1->email,
        'rater_id' => $rater1->id,
        'status' => EmailLogStatus::Failed,
    ]);
    $log2 = EmailLog::factory()->create([
        'type' => EmailLogType::RaterInvitation,
        'recipient_email' => $rater2->email,
        'rater_id' => $rater2->id,
        'status' => EmailLogStatus::Failed,
    ]);

    $this->actingAs($this->admin)
        ->post('/admin/email-logs/bulk-retry', [
            'ids' => [$log1->id, $log2->id],
        ])
        ->assertRedirect();

    expect($log1->fresh()->status)->toBe(EmailLogStatus::Queued)
        ->and($log2->fresh()->status)->toBe(EmailLogStatus::Queued);

    Queue::assertPushed(SendAssessmentInvitation::class, 2);
});

it('menolak pengiriman ulang (retry) untuk email yang tidak berstatus gagal', function () {
    Queue::fake();

    $participant = User::factory()->participant()->create();
    $rater = Rater::factory()->create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Boss,
        'email' => 'boss.sent@example.com',
        'submitted_at' => null,
    ]);

    $sentLog = EmailLog::factory()->create([
        'type' => EmailLogType::RaterInvitation,
        'recipient_email' => $rater->email,
        'rater_id' => $rater->id,
        'status' => EmailLogStatus::Sent,
        'sent_at' => now(),
    ]);

    $this->actingAs($this->admin)
        ->post("/admin/email-logs/{$sentLog->id}/retry")
        ->assertRedirect();

    expect($sentLog->fresh()->status)->toBe(EmailLogStatus::Sent);
    Queue::assertNothingPushed();
});

it('bulk retry hanya memproses email yang berstatus failed dan mengabaikan status lainnya', function () {
    Queue::fake();

    $participant = User::factory()->participant()->create();
    $rater1 = Rater::factory()->create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Boss,
        'email' => 'boss.failed@example.com',
        'submitted_at' => null,
    ]);
    $rater2 = Rater::factory()->create([
        'participant_id' => $participant->id,
        'role' => RaterRole::Subordinate,
        'email' => 'sub.sent@example.com',
        'submitted_at' => null,
    ]);

    $failedLog = EmailLog::factory()->create([
        'type' => EmailLogType::RaterInvitation,
        'recipient_email' => $rater1->email,
        'rater_id' => $rater1->id,
        'status' => EmailLogStatus::Failed,
    ]);
    $sentLog = EmailLog::factory()->create([
        'type' => EmailLogType::RaterInvitation,
        'recipient_email' => $rater2->email,
        'rater_id' => $rater2->id,
        'status' => EmailLogStatus::Sent,
    ]);

    $this->actingAs($this->admin)
        ->post('/admin/email-logs/bulk-retry', [
            'ids' => [$failedLog->id, $sentLog->id],
        ])
        ->assertRedirect();

    expect($failedLog->fresh()->status)->toBe(EmailLogStatus::Queued)
        ->and($sentLog->fresh()->status)->toBe(EmailLogStatus::Sent);

    Queue::assertPushed(SendAssessmentInvitation::class, 1);
});
