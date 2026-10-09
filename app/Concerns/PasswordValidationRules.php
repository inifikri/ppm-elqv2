<?php

namespace App\Concerns;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Password;

trait PasswordValidationRules
{
    /**
     * Get the validation rules used to validate passwords.
     *
     * @return array<int, Password|ValidationRule|array<mixed>|string>
     */
    protected function passwordRules(): array
    {
        return ['required', 'string', Password::default(), 'confirmed'];
    }

    /**
     * Aturan password registrasi (min 8, huruf besar+kecil, angka).
     *
     * @return array<int, Password|string>
     */
    protected function registerPasswordRules(): array
    {
        return ['required', 'string', $this->passwordRule(), 'confirmed'];
    }

    /**
     * Aturan password tunggal (cermin di resources/js/lib/password-rules.ts).
     */
    protected function passwordRule(): Password
    {
        $rule = Password::min(8)->letters()->mixedCase()->numbers();

        return config('elq.register.uncompromised') ? $rule->uncompromised() : $rule;
    }

    /**
     * Get the validation rules used to validate the current password.
     *
     * @return array<int, Password|ValidationRule|array<mixed>|string>
     */
    protected function currentPasswordRules(): array
    {
        return ['required', 'string', 'current_password'];
    }
}
