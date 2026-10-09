<?php

use App\Actions\Fortify\EmailDomainChecker;
use App\Models\Company;
use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
    config(['elq.register.dns_check' => false, 'elq.register.min_seconds' => 0]);
});

/** Ambil captcha dari session lalu kembalikan payload valid (jawaban = hasil penjumlahan soal). */
function registerPayload($test, array $override = []): array
{
    $question = $test->getJson(route('register.captcha'))->json('question');
    [$a, $b] = array_map('intval', explode(' + ', str_replace(' = ?', '', $question)));

    return array_merge([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'company' => 'PT Maju Jaya',
        'position' => 'Manajer',
        'password' => 'Password1',
        'password_confirmation' => 'Password1',
        'captcha_answer' => $a + $b,
        'website' => '',
    ], $override);
}

function fakeEmailStatus(string $status): void
{
    app()->instance(EmailDomainChecker::class, new class($status) extends EmailDomainChecker
    {
        public function __construct(private string $fixed) {}

        public function status(string $email): string
        {
            return $this->fixed;
        }
    });
}

test('registration screen can be rendered', function () {
    $this->get(route('register'))->assertOk();
});

test('valid registration creates unverified participant and sends verification email', function () {
    Notification::fake();

    $this->postJson(route('register.store'), registerPayload($this))->assertCreated()->assertJson(['email' => 'test@example.com']);

    $user = User::where('email', 'test@example.com')->firstOrFail();
    expect($user->email_verified_at)->toBeNull()
        ->and($user->hasRole('participant'))->toBeTrue()
        ->and($user->participantProfile->position)->toBe('Manajer')
        ->and($user->participantProfile->company->name)->toBe('PT Maju Jaya')
        ->and($user->password)->not->toBe('Password1');
    Notification::assertSentTo($user, VerifyEmail::class);
});

test('weak or mismatched passwords are rejected', function (string $password, ?string $confirmation) {
    $this->postJson(route('register.store'), registerPayload($this, [
        'password' => $password,
        'password_confirmation' => $confirmation ?? $password,
    ]))->assertJsonValidationErrors('password');

    expect(User::count())->toBe(0);
})->with([
    'too short' => ['Ab1', null],
    'no uppercase' => ['password1', null],
    'no number' => ['Passwordx', null],
    'mismatch' => ['Password1', 'Password2'],
]);

test('step 1 field errors come back with their field keys', function () {
    $this->postJson(route('register.store'), registerPayload($this, ['name' => '', 'company' => '', 'position' => '']))
        ->assertJsonValidationErrors(['name', 'company', 'position']);
});

test('check-email reports each status', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->postJson(route('register.check-email'), ['email' => 'nope'])->assertJson(['status' => 'invalid']);
    $this->postJson(route('register.check-email'), ['email' => 'TAKEN@Example.com'])->assertJson(['status' => 'taken']);
    $this->postJson(route('register.check-email'), ['email' => 'new@example.com'])->assertJson(['status' => 'ok']);
});

test('domain without DNS is rejected when dns check is on', function () {
    config(['elq.register.dns_check' => true]);
    app()->instance(EmailDomainChecker::class, new class extends EmailDomainChecker
    {
        public function domainExists(string $domain): bool
        {
            return false;
        }
    });

    $this->postJson(route('register.check-email'), ['email' => 'a@tidak-ada.test'])->assertJson(['status' => 'domain_not_found']);
});

test('POST /register enforces the same email checks', function (string $status) {
    fakeEmailStatus($status);

    $this->postJson(route('register.store'), registerPayload($this))->assertJsonValidationErrors('email');
    expect(User::count())->toBe(0);
})->with(['invalid', 'domain_not_found', 'taken']);

test('POST /register rejects an email taken in different case', function () {
    User::factory()->create(['email' => 'test@example.com']);

    $this->postJson(route('register.store'), registerPayload($this, ['email' => 'TEST@Example.com']))
        ->assertJsonValidationErrors('email');
});

test('check-email is throttled', function () {
    foreach (range(1, 20) as $i) {
        $this->postJson(route('register.check-email'), ['email' => 'a@example.com'])->assertOk();
    }

    $this->postJson(route('register.check-email'), ['email' => 'a@example.com'])->assertStatus(429);
});

test('register is throttled', function () {
    RateLimiter::clear('register:127.0.0.1');
    foreach (range(1, 10) as $i) {
        $this->postJson(route('register.store'), ['email' => 'x']);
    }

    $this->postJson(route('register.store'), registerPayload($this))->assertStatus(429);
});

test('captcha, honeypot and min time are enforced', function () {
    $this->postJson(route('register.store'), registerPayload($this, ['captcha_answer' => 999]))->assertJsonValidationErrors('captcha_answer');
    $this->postJson(route('register.store'), registerPayload($this, ['website' => 'bot']))->assertJsonValidationErrors('captcha_answer');

    config(['elq.register.min_seconds' => 60]);
    $this->postJson(route('register.store'), registerPayload($this))->assertJsonValidationErrors('captcha_answer');

    expect(User::count())->toBe(0);
});

test('captcha cannot be reused', function () {
    $payload = registerPayload($this);
    $this->postJson(route('register.store'), [...$payload, 'website' => 'bot'])->assertJsonValidationErrors('captcha_answer');
    $this->postJson(route('register.store'), $payload)->assertJsonValidationErrors('captcha_answer');
});

test('company is not duplicated across case and spacing', function () {
    $existing = Company::factory()->create(['name' => 'PT Maju Jaya']);

    $this->postJson(route('register.store'), registerPayload($this, ['company' => '  pt   MAJU jaya ']))->assertCreated();

    expect(Company::count())->toBe(1)
        ->and(User::first()->participantProfile->company_id)->toBe($existing->id);
});

test('company names differing in punctuation, case and spacing are the same company', function () {
    $existing = Company::factory()->create(['name' => 'PT Jaya']);

    foreach (['PT.Jaya', 'PT. Jaya', ' pt   JAYA '] as $i => $name) {
        $this->postJson(route('register.store'), registerPayload($this, ['company' => $name, 'email' => "u$i@example.com"]))->assertCreated();
        auth()->logout();
    }

    expect(Company::count())->toBe(1)
        ->and(Company::first()->id)->toBe($existing->id);
});

test('company suggest needs 2 chars, caps at 8, matches anywhere and ignores punctuation', function () {
    foreach (range(1, 10) as $i) {
        Company::factory()->create(['name' => "PT Jaya $i"]);
    }
    Company::factory()->create(['name' => 'PT Maju']);

    $this->getJson(route('companies.suggest', ['q' => 'j']))->assertJson(['data' => []]);
    expect($this->getJson(route('companies.suggest', ['q' => 'Jaya']))->json('data'))->toHaveCount(8);
    expect($this->getJson(route('companies.suggest', ['q' => 'pt.maj']))->json('data'))->toBe(['PT Maju']);
    $this->getJson(route('companies.suggest', ['q' => 'jaya']))->assertHeader('Cache-Control', 'max-age=60, private');
});

test('company suggest wildcards never match everything', function () {
    Company::factory()->create(['name' => 'PT Maju']);

    foreach (['%', '%%', '_', '__', 'a%'] as $q) {
        $this->getJson(route('companies.suggest', ['q' => $q]))->assertJson(['data' => []]);
    }
});
