<?php

namespace App\Http\Requests\Admin;

use App\Concerns\PasswordValidationRules;
use App\Enums\PermissionName;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    use PasswordValidationRules;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['email' => mb_strtolower(trim((string) $this->input('email')))]);
    }

    /**
     * Catatan: unique juga menghitung user soft-deleted.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $role = UserRole::tryFrom((string) $this->input('role'));
        $isParticipant = $role === UserRole::Participant;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', Rule::unique('users', 'email')],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            'phone' => ['nullable', 'string', 'max:20', 'regex:/^[0-9\s+\-()]+$/'],
            'password' => $this->passwordRules(),
            'role' => ['required', Rule::enum(UserRole::class)],
            'is_active' => ['sometimes', 'boolean'],
            'company_name' => [Rule::requiredIf($isParticipant), 'nullable', 'string', 'max:255'],
            'position' => [Rule::requiredIf($isParticipant), 'nullable', 'string', 'max:100'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['distinct', Rule::in(array_column($role ? PermissionName::forRole($role) : [], 'value'))],
        ];
    }
}
