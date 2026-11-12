<?php

namespace App\Http\Requests\Admin;

use App\Enums\PermissionName;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SendResultPdfRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(PermissionName::ResultsShare->value) ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'recipients' => ['sometimes', 'array', 'min:1'],
            'recipients.*' => ['required', 'string', 'email:rfc,filter', 'max:255'],
        ];
    }
}
