<?php

namespace App\Http\Requests\Participant;

use Illuminate\Foundation\Http\FormRequest;

class StoreEvaluatorsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'boss_email' => ['required', 'string', 'email:rfc,filter', 'max:255'],
            'subordinate_emails' => ['required', 'array', 'size:3'],
            'subordinate_emails.*' => ['required', 'string', 'email:rfc,filter', 'max:255', 'distinct'],
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
            'subordinate_emails.size' => 'Wajib mengisi tepat 3 email bawahan.',
            'subordinate_emails.*.required' => 'Email bawahan tidak boleh kosong.',
            'subordinate_emails.*.email' => 'Format email bawahan tidak valid.',
            'subordinate_emails.*.distinct' => 'Email bawahan tidak boleh ada yang sama (duplikat).',
        ];
    }
}
