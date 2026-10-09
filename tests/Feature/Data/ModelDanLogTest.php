<?php

use App\Enums\EmailLogStatus;
use App\Enums\RaterRole;
use App\Models\Answer;
use App\Models\Company;
use App\Models\EmailLog;
use App\Models\ParticipantProfile;
use App\Models\Question;
use App\Models\Rater;
use App\Models\User;
use Illuminate\Database\Eloquent\MassAssignmentException;
use Spatie\Activitylog\Models\Activity;

it('mengisi ulid otomatis, PK tetap integer, route key ulid', function () {
    $rater = Rater::factory()->boss()->create();

    expect($rater->ulid)->toHaveLength(26)
        ->and($rater->id)->toBeInt()
        ->and($rater->getRouteKeyName())->toBe('ulid')
        ->and($rater->role)->toBe(RaterRole::Boss);
});

it('menjalankan relasi, scope, dan cast', function () {
    $user = User::factory()->participant()->create();
    ParticipantProfile::factory()->create(['user_id' => $user->id]);
    $self = Rater::factory()->selfRater()->create(['participant_id' => $user->id]);
    $sub = Rater::factory()->subordinate()->submitted()->create(['participant_id' => $user->id]);

    expect($user->participantProfile->company)->toBeInstanceOf(Company::class)
        ->and($user->raters)->toHaveCount(2)
        ->and(Rater::submitted()->pluck('id')->all())->toBe([$sub->id])
        ->and(Rater::pending()->pluck('id')->all())->toBe([$self->id])
        ->and(Rater::forRole(RaterRole::Subordinate)->count())->toBe(1)
        ->and($sub->isSubmitted())->toBeTrue()
        ->and(User::active()->count())->toBe(1);
});

it('menjaga is_active dan password', function () {
    expect(fn () => User::create(['name' => 'A', 'email' => 'a@x.test', 'password' => 'x', 'is_active' => false]))
        ->toThrow(MassAssignmentException::class);

    $user = User::create(['name' => 'A', 'email' => 'a@x.test', 'password' => 'rahasia123']);

    expect($user->fresh()->is_active)->toBeTrue()
        ->and($user->password)->not->toBe('rahasia123')
        ->and(Hash::check('rahasia123', $user->password))->toBeTrue();
});

it('mencatat nilai lama dan baru perubahan Question', function () {
    $question = Question::factory()->create(['text' => 'lama']);
    $question->update(['text' => 'baru']);

    $log = Activity::where('log_name', 'master')->where('event', 'updated')->latest('id')->first();

    expect(json_encode($log->toArray()))->toContain('lama')->toContain('baru');
});

it('tidak memuat data sensitif User di activity log', function () {
    $user = User::factory()->create();
    $user->forceFill(['name' => 'Baru', 'password' => 'password-baru-123', 'remember_token' => 'tok-rahasia'])->save();

    $dump = json_encode(Activity::all()->toArray());

    expect($dump)->not->toContain('password-baru-123')
        ->not->toContain('tok-rahasia')
        ->not->toContain('"password"')
        ->not->toContain('remember_token')
        ->not->toContain('two_factor');
});

it('tidak mencatat Answer dan EmailLog', function () {
    Answer::factory()->create();
    EmailLog::factory()->create();

    expect(Activity::where('subject_type', 'like', '%Answer%')->orWhere('subject_type', 'like', '%EmailLog%')->count())->toBe(0)
        ->and(Activity::where('subject_type', 'answer')->orWhere('subject_type', 'email_log')->count())->toBe(0);
});

it('state factory menghasilkan data valid', function () {
    expect(Rater::factory()->selfRater()->create()->email)->toBeNull()
        ->and(Rater::factory()->boss()->submitted()->create()->email)->not->toBeNull()
        ->and(User::factory()->admin()->create()->hasRole('admin'))->toBeTrue()
        ->and(User::factory()->inactive()->create()->is_active)->toBeFalse()
        ->and(User::factory()->unverified()->create()->email_verified_at)->toBeNull()
        ->and(EmailLog::factory()->queued()->create()->status)->toBe(EmailLogStatus::Queued)
        ->and(EmailLog::factory()->sent()->create()->sent_at)->not->toBeNull()
        ->and(EmailLog::factory()->failed()->create()->error_message)->not->toBeNull();
});
