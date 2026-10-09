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
     * Teks dari editor rich text: hanya tag format dasar, tanpa atribut (cegah XSS).
     */
    protected function prepareForValidation(): void
    {
        $clean = strip_tags((string) $this->input('text'), '<p><br><b><strong><i><em><u><ul><ol><li>');
        $clean = preg_replace('/<(\w+)\b[^>]*>/', '<$1>', $clean) ?? '';

        $this->merge(['text' => trim(strip_tags($clean)) === '' ? '' : trim($clean)]);
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
