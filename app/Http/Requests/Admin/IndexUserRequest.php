<?php

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', 'string', Rule::enum(UserRole::class)],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
            'tab' => ['nullable', 'string', Rule::in(['all', 'trash'])],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
