<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Teks pertanyaan dibersihkan dari tag HTML dan whitespace berlebih.
     */
    protected function prepareForValidation(): void
    {
        $clean = strip_tags((string) $this->input('text'));

        $this->merge(['text' => trim($clean)]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'sub_dimension_id' => ['required', 'integer', Rule::exists('sub_dimensions', 'id')->whereNull('deleted_at')],
            'text' => ['required', 'string', 'max:2000'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:32767'],
        ];
    }
}
