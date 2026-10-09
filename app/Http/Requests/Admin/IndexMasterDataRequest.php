<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class IndexMasterDataRequest extends FormRequest
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
            'page' => ['nullable', 'integer', 'min:1'],
            'dimension_id' => ['nullable', 'integer'],
            'sub_dimension_id' => ['nullable', 'integer'],
        ];
    }

    public function searchLike(): ?string
    {
        $search = trim((string) $this->validated('search'));

        return $search === '' ? null : '%'.addcslashes($search, '\\%_').'%';
    }

    /**
     * @return array{search: string, dimension_id: int|null}
     */
    public function filters(): array
    {
        return [
            'search' => (string) $this->validated('search'),
            'dimension_id' => $this->validated('dimension_id') ? (int) $this->validated('dimension_id') : null,
        ];
    }
}
