<?php

namespace App\Http\Requests\Admin;

use App\Concerns\PasswordValidationRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreParticipantRequest extends FormRequest
{
    use PasswordValidationRules;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => mb_strtolower(trim((string) $this->input('email'))),
            'boss_email' => mb_strtolower(trim((string) $this->input('boss_email'))),
            'subordinate_emails' => array_values(array_map(
                fn ($email) => mb_strtolower(trim((string) $email)),
                (array) $this->input('subordinate_emails', [])
            )),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc,filter', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['nullable', 'string', 'max:20', 'regex:/^[0-9\s+\-()]+$/'],
            'company_name' => ['required', 'string', 'max:255'],
            'position' => ['required', 'string', 'max:100'],
            'password' => $this->registerPasswordRules(),
            'boss_email' => ['required', 'string', 'email:rfc,filter', 'max:255', 'different:email'],
            'subordinate_emails' => ['required', 'array', 'size:3'],
            'subordinate_emails.*' => [
                'required',
                'string',
                'email:rfc,filter',
                'max:255',
                'distinct',
                'different:email',
                'different:boss_email',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'boss_email.required' => 'Email atasan wajib diisi.',
            'boss_email.email' => 'Format email atasan tidak valid.',
            'boss_email.different' => 'Email atasan tidak boleh sama dengan email peserta.',
            'subordinate_emails.size' => 'Wajib mengisi tepat 3 email bawahan.',
            'subordinate_emails.*.required' => 'Email bawahan tidak boleh kosong.',
            'subordinate_emails.*.email' => 'Format email bawahan tidak valid.',
            'subordinate_emails.*.distinct' => 'Email bawahan tidak boleh ada yang sama (duplikat).',
            'subordinate_emails.*.different' => 'Email bawahan tidak boleh sama dengan email peserta atau email atasan.',
        ];
    }
}
