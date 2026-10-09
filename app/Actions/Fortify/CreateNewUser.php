<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Enums\UserRole;
use App\Models\Company;
use App\Models\ParticipantProfile;
use App\Models\User;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Spatie\Permission\Models\Role;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    public function __construct(
        private EmailDomainChecker $emailChecker,
        private RegistrationCaptcha $captcha,
    ) {}

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        $this->throttle();

        $input['email'] = Str::lower(trim((string) ($input['email'] ?? '')));

        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'company' => ['required', 'string', 'min:2', 'max:255'],
            'position' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', fn ($attr, $value, $fail) => ($status = $this->emailChecker->status($value)) === EmailDomainChecker::OK
                || $fail($this->emailChecker->message($status))],
            'password' => $this->registerPasswordRules(),
        ])->validate();

        if ($error = $this->captcha->verify($input['captcha_answer'] ?? null, $input['website'] ?? null)) {
            throw ValidationException::withMessages(['captcha_answer' => trans("register.captcha.$error", [], 'id')]);
        }

        return DB::transaction(function () use ($input) {
            $user = User::create([
                'name' => trim($input['name']),
                'email' => $input['email'],
                'password' => $input['password'],
            ]);
            Role::findOrCreate(UserRole::Participant->value, 'web');
            $user->assignRole(UserRole::Participant->value);
            ParticipantProfile::create([
                'user_id' => $user->id,
                'company_id' => Company::findOrCreateByName($input['company'])->id,
                'position' => trim($input['position']),
            ]);
            activity('auth')->causedBy($user)->withProperties(['ip' => request()->ip()])->log('register');

            return $user;
        });
    }

    private function throttle(): void
    {
        $key = 'register:'.request()->ip();

        if (RateLimiter::tooManyAttempts($key, 10)) {
            throw new ThrottleRequestsException(trans('register.throttle', [], 'id'));
        }

        RateLimiter::hit($key, 60);
    }
}
