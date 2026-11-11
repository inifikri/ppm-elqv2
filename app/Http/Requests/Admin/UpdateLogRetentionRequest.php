<?php

namespace App\Http\Requests\Admin;

use App\Enums\PermissionName;
use Illuminate\Foundation\Http\FormRequest;

class UpdateLogRetentionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(PermissionName::SettingsManage->value) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'activity_log_purge_enabled' => ['required', 'boolean'],
            'activity_log_retention_days' => [
                'nullable',
                'required_if:activity_log_purge_enabled,true,1',
                'integer',
                'min:1',
                'max:3650',
            ],
            'email_log_purge_enabled' => ['required', 'boolean'],
            'email_log_retention_days' => [
                'nullable',
                'required_if:email_log_purge_enabled,true,1',
                'integer',
                'min:1',
                'max:3650',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'activity_log_retention_days.required_if' => 'Masa retensi log aktivitas wajib diisi saat pembersihan otomatis aktif.',
            'activity_log_retention_days.min' => 'Masa retensi log aktivitas minimal 1 hari.',
            'activity_log_retention_days.max' => 'Masa retensi log aktivitas maksimal 3650 hari (10 tahun).',
            'email_log_retention_days.required_if' => 'Masa retensi log email wajib diisi saat pembersihan otomatis aktif.',
            'email_log_retention_days.min' => 'Masa retensi log email minimal 1 hari.',
            'email_log_retention_days.max' => 'Masa retensi log email maksimal 3650 hari (10 tahun).',
        ];
    }
}
