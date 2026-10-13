<?php

namespace App\Http\Requests\Participant;

use Illuminate\Foundation\Http\FormRequest;

class SaveAnswerRequest extends FormRequest
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
            'question_id' => ['required', 'integer', 'exists:questions,id'],
            'value' => ['required', 'integer', 'min:1', 'max:6'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'question_id.required' => 'ID pertanyaan wajib diisi.',
            'question_id.exists' => 'Pertanyaan tidak valid.',
            'value.required' => 'Nilai jawaban wajib diisi.',
            'value.min' => 'Nilai jawaban minimal 1.',
            'value.max' => 'Nilai jawaban maksimal 6.',
        ];
    }
}
