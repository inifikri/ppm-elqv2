<?php

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Spatie\Activitylog\Models\Activity;

beforeEach(fn () => Cache::flush());

function tryLogin($test, string $email, string $password)
{
    return $test->postJson(route('login.store'), ['email' => $email, 'password' => $password]);
}

test('login identify reports registered state', function () {
    $user = User::factory()->create();

    $this->postJson(route('login.identify'), ['email' => '  '.strtoupper($user->email).' '])->assertOk()->assertJson(['registered' => true]);
    $this->postJson(route('login.identify'), ['email' => 'nobody@example.com'])->assertOk()->assertJson(['registered' => false]);
    $this->postJson(route('login.identify'), ['email' => 'bukan-email'])->assertUnprocessable();
});

test('login identify is throttled', function () {
    foreach (range(1, 10) as $i) {
        $this->postJson(route('login.identify'), ['email' => 'a@example.com'])->assertOk();
    }
    $this->postJson(route('login.identify'), ['email' => 'a@example.com'])->assertTooManyRequests();
});

test('wrong passwords count down then lock for 30 seconds even with the right password', function () {
    $user = User::factory()->create();

    tryLogin($this, $user->email, 'salah')->assertStatus(422)->assertJson(['attempts_left' => 2]);
    tryLogin($this, $user->email, 'salah')->assertStatus(422)->assertJson(['attempts_left' => 1]);
    tryLogin($this, $user->email, 'salah')->assertStatus(429)->assertJson(['retry_after' => 30]);

    tryLogin($this, $user->email, 'password')->assertStatus(429)->assertJsonPath('retry_after', fn ($v) => $v > 0 && $v <= 30);
    $this->assertGuest();
});

test('fourth failure after the countdown requires a reset and blocks the right password', function () {
    $user = User::factory()->create();
    foreach (range(1, 3) as $i) {
        tryLogin($this, $user->email, 'salah');
    }

    $this->travel(31)->seconds();
    tryLogin($this, $user->email, 'salah')->assertStatus(429)->assertJson(['reset_required' => true]);
    tryLogin($this, $user->email, 'password')->assertStatus(429)->assertJson(['reset_required' => true]);

    $this->travel(config('auth.login_hard_lock_minutes') + 1)->minutes();
    tryLogin($this, $user->email, 'password')->assertOk();
    $this->assertAuthenticatedAs($user);
});

test('successful login clears counter, regenerates session and redirects', function () {
    $user = User::factory()->admin()->create();
    tryLogin($this, $user->email, 'salah');
    $before = session()->getId();

    tryLogin($this, $user->email, 'password')->assertOk()->assertJson(['redirect' => url('/dashboard')]);
    expect(session()->getId())->not->toBe($before);

    auth()->logout();
    tryLogin($this, $user->email, 'salah')->assertJson(['attempts_left' => 2]);
});

test('inactive account gets generic message only with the right password', function () {
    $user = User::factory()->inactive()->create();

    tryLogin($this, $user->email, 'salah')->assertStatus(422)->assertJsonMissing(['message' => __('login.inactive', [], 'id')]);
    tryLogin($this, $user->email, 'password')->assertForbidden()->assertJsonPath('message', 'Akun tidak dapat digunakan, hubungi admin.');
    $this->assertGuest();
});

test('unverified user is sent to verification notice', function () {
    $user = User::factory()->unverified()->create();

    tryLogin($this, $user->email, 'password')->assertOk()->assertJson(['redirect' => route('verification.notice')]);
});

test('unknown email behaves like a wrong password', function () {
    tryLogin($this, 'ghost@example.com', 'x')->assertStatus(422)->assertJson(['attempts_left' => 2]);
    tryLogin($this, 'ghost@example.com', 'x')->assertJson(['attempts_left' => 1]);
    tryLogin($this, 'ghost@example.com', 'x')->assertStatus(429)->assertJson(['retry_after' => 30]);
});

test('activity log records events without the password', function () {
    $user = User::factory()->create();
    tryLogin($this, $user->email, 'rahasia-banget');
    tryLogin($this, $user->email, 'password');

    expect(Activity::where('log_name', 'auth')->pluck('description')->all())->toContain('login_failed', 'login_success');
    expect(Activity::all()->toJson())->not->toContain('rahasia-banget');
});

test('legacy bcrypt hash with another cost is rehashed on login', function () {
    $user = User::factory()->create();
    $user->forceFill(['password' => password_hash('password', PASSWORD_BCRYPT, ['cost' => 4])])->saveQuietly();
    DB::table('users')->where('id', $user->id)->update(['password' => password_hash('password', PASSWORD_BCRYPT, ['cost' => 4])]);

    tryLogin($this, $user->email, 'password')->assertOk();

    expect(Hash::needsRehash($user->fresh()->password))->toBeFalse();
});

test('global per ip throttle returns 429', function () {
    foreach (range(1, 20) as $i) {
        tryLogin($this, "x$i@example.com", 'x');
    }
    tryLogin($this, 'x99@example.com', 'x')->assertTooManyRequests();
});
