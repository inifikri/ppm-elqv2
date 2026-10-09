<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubDimensionRequest extends FormRequest
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
            'dimension_id' => ['required', 'integer', Rule::exists('dimensions', 'id')],
            'name' => ['required', 'string', 'max:100', Rule::unique('sub_dimensions', 'name')
                ->where('dimension_id', $this->input('dimension_id'))
                ->ignore($this->route('sub_dimension'))],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:32767'],
        ];
    }
}
