<?php

namespace App\Http\Requests\Admin;

use App\Models\Company;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompanyRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255', Rule::unique('companies', 'name')->ignore($this->route('company')),
                fn ($attribute, $value, $fail) => Company::where('name_normalized', Company::normalize((string) $value))
                    ->when($this->route('company'), fn ($q, $c) => $q->whereKeyNot($c instanceof Company ? $c->id : $c))
                    ->exists() && $fail(__('validation.unique', ['attribute' => $attribute])),
            ],
        ];
    }
}
