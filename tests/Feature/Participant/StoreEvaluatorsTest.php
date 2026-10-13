<?php

namespace Tests\Feature\Participant;

use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use App\Enums\RaterRole;
use App\Jobs\SendAssessmentInvitation;
use App\Models\EmailLog;
use App\Models\Rater;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Queue;
use Spatie\Activitylog\Models\Activity;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->participant = User::factory()->participant()->create([
        'email' => 'peserta@example.com',
    ]);
});

it('validasi gagal jika email atasan kosong atau format salah', function () {
    $this->actingAs($this->participant)
        ->post(route('participant.evaluators.store'), [
            'boss_email' => 'bukan-email',
            'subordinate_emails' => [
                'sub1@example.com',
                'sub2@example.com',
                'sub3@example.com',
            ],
        ])
        ->assertSessionHasErrors('boss_email');
});

it('validasi gagal jika bawahan kurang dari 3 atau ada email yang tidak valid', function () {
    $this->actingAs($this->participant)
        ->post(route('participant.evaluators.store'), [
            'boss_email' => 'boss@example.com',
            'subordinate_emails' => [
                'sub1@example.com',
                'sub2@example.com',
            ],
        ])
        ->assertSessionHasErrors('subordinate_emails');
});

it('validasi gagal jika email penilai sama dengan email peserta sendiri', function () {
    $this->actingAs($this->participant)
        ->post(route('participant.evaluators.store'), [
            'boss_email' => 'peserta@example.com',
            'subordinate_emails' => [
                'sub1@example.com',
                'sub2@example.com',
                'sub3@example.com',
            ],
        ])
        ->assertSessionHasErrors('boss_email');

    $this->actingAs($this->participant)
        ->post(route('participant.evaluators.store'), [
            'boss_email' => 'boss@example.com',
            'subordinate_emails' => [
                'sub1@example.com',
                'peserta@example.com',
                'sub3@example.com',
            ],
        ])
        ->assertSessionHasErrors('subordinate_emails.1');
});

it('validasi gagal jika ada email duplikat antar penilai', function () {
    // Duplikat antara boss dan sub
    $this->actingAs($this->participant)
        ->post(route('participant.evaluators.store'), [
            'boss_email' => 'sama@example.com',
            'subordinate_emails' => [
                'sama@example.com',
                'sub2@example.com',
                'sub3@example.com',
            ],
        ])
        ->assertSessionHasErrors('subordinate_emails.0');

    // Duplikat antar sub
    $this->actingAs($this->participant)
        ->post(route('participant.evaluators.store'), [
            'boss_email' => 'boss@example.com',
            'subordinate_emails' => [
                'sub1@example.com',
                'sub1@example.com',
                'sub3@example.com',
            ],
        ])
        ->assertSessionHasErrors('subordinate_emails.1');
});

it('berhasil mendaftarkan penilai dan men-dispatch job undangan', function () {
    Queue::fake();

    $response = $this->actingAs($this->participant)
        ->post(route('participant.evaluators.store'), [
            'boss_email' => 'boss@example.com',
            'subordinate_emails' => [
                'sub1@example.com',
                'sub2@example.com',
                'sub3@example.com',
            ],
        ]);

    $response->assertRedirect(route('participant.assessment.run'));

    // Cek record rater di DB (1 self + 1 boss + 3 subordinate = 5)
    expect(Rater::where('participant_id', $this->participant->id)->count())->toBe(5);

    $selfRater = Rater::where('participant_id', $this->participant->id)
        ->where('role', RaterRole::SelfRater)
        ->first();
    expect($selfRater)->not->toBeNull();
    expect($selfRater->email)->toBeNull();

    $bossRater = Rater::where('participant_id', $this->participant->id)
        ->where('role', RaterRole::Boss)
        ->first();
    expect($bossRater->email)->toBe('boss@example.com');

    $subs = Rater::where('participant_id', $this->participant->id)
        ->where('role', RaterRole::Subordinate)
        ->get();
    expect($subs)->toHaveCount(3);

    // Cek email logs dibuat untuk 4 penilai eksternal
    expect(EmailLog::where('type', EmailLogType::RaterInvitation)->count())->toBe(4);
    expect(EmailLog::where('status', EmailLogStatus::Queued)->count())->toBe(4);

    // Cek queue dispatch job undangan sebanyak 4 kali
    Queue::assertPushed(SendAssessmentInvitation::class, 4);

    // Cek activity log tercatat
    expect(Activity::where('log_name', 'evaluators')->exists())->toBeTrue();
});

it('menolak pendaftaran penilai ulang jika sudah pernah didaftarkan', function () {
    Rater::factory()->selfRater()->create(['participant_id' => $this->participant->id]);
    Rater::factory()->boss()->create(['participant_id' => $this->participant->id]);
    Rater::factory()->subordinate()->count(3)->create(['participant_id' => $this->participant->id]);

    $this->actingAs($this->participant)
        ->post(route('participant.evaluators.store'), [
            'boss_email' => 'boss2@example.com',
            'subordinate_emails' => [
                'sub1@example.com',
                'sub2@example.com',
                'sub3@example.com',
            ],
        ])
        ->assertSessionHasErrors('evaluators');
});
