<?php

use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use App\Enums\RaterRole;
use App\Models\Answer;
use App\Models\Dimension;
use App\Models\EmailLog;
use App\Models\Question;
use App\Models\Rater;
use App\Models\SubDimension;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

function insertRater(array $override = []): int
{
    return DB::table('raters')->insertGetId($override + [
        'ulid' => (string) Str::ulid(),
        'participant_id' => User::factory()->create()->id,
        'role' => 'boss',
        'email' => fake()->unique()->safeEmail(),
    ]);
}

it('memiliki semua tabel dan tidak memuat tabel di luar lingkup', function () {
    foreach (['users', 'companies', 'participant_profiles', 'dimensions', 'sub_dimensions', 'questions', 'raters', 'answers', 'settings', 'email_logs', 'activity_log', 'roles', 'permissions', 'password_reset_tokens'] as $table) {
        expect(Schema::hasTable($table))->toBeTrue($table);
    }
    foreach (['peserta', 'kepribadian', 'kepribadian_groups', 'login_attempts'] as $table) {
        expect(Schema::hasTable($table))->toBeFalse($table);
    }
    expect(Schema::hasColumn('users', 'is_active'))->toBeTrue()
        ->and(Schema::hasColumn('users', 'status'))->toBeFalse()
        ->and(Schema::hasColumn('users', 'expired'))->toBeFalse()
        ->and(Schema::hasColumn('answers', 'created_at'))->toBeFalse();
});

it('menolak CHECK raters yang melanggar aturan', function (array $row) {
    expect(fn () => insertRater($row))->toThrow(QueryException::class);
})->with([
    'self dengan email' => [['role' => 'self', 'email' => 'a@b.test']],
    'boss tanpa email' => [['role' => 'boss', 'email' => null]],
    'role tak dikenal' => [['role' => 'lain']],
]);

it('menerima setiap case RaterRole, EmailLogType, EmailLogStatus', function () {
    foreach (RaterRole::cases() as $role) {
        $self = $role === RaterRole::SelfRater;
        expect(insertRater(['role' => $role->value, 'email' => $self ? null : fake()->unique()->safeEmail()]))->toBeInt();
    }
    foreach (EmailLogType::cases() as $type) {
        DB::table('email_logs')->insert(['type' => $type->value, 'recipient_email' => 'x@y.test', 'status' => 'queued']);
    }
    foreach (EmailLogStatus::cases() as $status) {
        DB::table('email_logs')->insert(['type' => 'password_reset', 'recipient_email' => 'x@y.test', 'status' => $status->value]);
    }
    expect(DB::table('email_logs')->count())->toBe(EmailLogType::cases() === [] ? 0 : count(EmailLogType::cases()) + count(EmailLogStatus::cases()));
});

it('menolak type dan status email_logs tak dikenal', function (array $row) {
    expect(fn () => DB::table('email_logs')->insert($row + ['type' => 'password_reset', 'recipient_email' => 'x@y.test', 'status' => 'queued']))
        ->toThrow(QueryException::class);
})->with([
    'type' => [['type' => 'lain']],
    'status' => [['status' => 'lain']],
]);

it('membatasi value answers pada 1 sampai 6', function (int $value, bool $ok) {
    $raterId = insertRater();
    $questionId = Question::factory()->create()->id;
    $insert = fn () => DB::table('answers')->insert(['rater_id' => $raterId, 'question_id' => $questionId, 'value' => $value]);

    $ok ? expect($insert())->toBeTrue() : expect($insert)->toThrow(QueryException::class);
})->with([[0, false], [7, false], [1, true], [6, true]]);

it('menegakkan unique dan FK', function () {
    $user = User::factory()->create();
    insertRater(['participant_id' => $user->id, 'email' => 'dup@x.test']);
    expect(fn () => insertRater(['participant_id' => $user->id, 'email' => 'dup@x.test']))->toThrow(QueryException::class);

    insertRater(['ulid' => '01ARZ3NDEKTSV4RRFFQ69G5FAV']);
    expect(fn () => insertRater(['ulid' => '01ARZ3NDEKTSV4RRFFQ69G5FAV']))->toThrow(QueryException::class);

    insertRater(['legacy_code' => 'abc']);
    expect(fn () => insertRater(['legacy_code' => 'abc']))->toThrow(QueryException::class);

    expect(fn () => insertRater(['participant_id' => 999999]))->toThrow(QueryException::class);

    $raterId = insertRater();
    $questionId = Question::factory()->create()->id;
    DB::table('answers')->insert(['rater_id' => $raterId, 'question_id' => $questionId, 'value' => 3]);
    expect(fn () => DB::table('answers')->insert(['rater_id' => $raterId, 'question_id' => $questionId, 'value' => 4]))->toThrow(QueryException::class);
});

it('menjalankan perilaku hapus sesuai DBML', function () {
    $rater = Rater::factory()->create();
    Answer::factory()->create(['rater_id' => $rater->id]);
    $log = EmailLog::factory()->create(['rater_id' => $rater->id]);

    expect(fn () => $rater->participant->forceDelete())->toThrow(QueryException::class);

    $rater->delete();
    expect(Answer::count())->toBe(0)
        ->and($log->fresh()->rater_id)->toBeNull();

    $sub = SubDimension::factory()->create();
    expect(fn () => Dimension::find($sub->dimension_id)->delete())->toThrow(QueryException::class);

    $question = Question::factory()->create();
    $question->delete();
    $sub->delete();
    $user = User::factory()->create();
    $user->delete();
    expect(Question::withTrashed()->find($question->id))->not->toBeNull()
        ->and(SubDimension::onlyTrashed()->count())->toBe(1)
        ->and(User::onlyTrashed()->count())->toBe(1);
});
