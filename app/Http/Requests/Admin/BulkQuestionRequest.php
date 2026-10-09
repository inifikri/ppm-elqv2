<?php

namespace App\Http\Requests\Admin;

use App\Enums\PermissionName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can(PermissionName::QuestionsManage->value);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer', 'distinct', Rule::exists('questions', 'id')->whereNull('deleted_at')],
        ];
    }
}
