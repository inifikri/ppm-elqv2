<?php

namespace Database\Factories;

use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use App\Models\EmailLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Default: email verifikasi berstatus queued.
 *
 * @extends Factory<EmailLog>
 */
class EmailLogFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'type' => EmailLogType::EmailVerification,
            'recipient_email' => fake()->safeEmail(),
            'rater_id' => null,
            'user_id' => null,
            'status' => EmailLogStatus::Queued,
            'attempts' => 0,
            'queued_at' => now(),
        ];
    }

    public function queued(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => EmailLogStatus::Queued,
            'attempts' => 0,
            'queued_at' => now(),
            'sent_at' => null,
            'failed_at' => null,
            'error_message' => null,
        ]);
    }

    public function sent(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => EmailLogStatus::Sent,
            'attempts' => 1,
            'message_id' => fake()->uuid().'@example.test',
            'queued_at' => now()->subMinute(),
            'sent_at' => now(),
            'failed_at' => null,
            'error_message' => null,
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => EmailLogStatus::Failed,
            'attempts' => 3,
            'queued_at' => now()->subMinutes(5),
            'sent_at' => null,
            'failed_at' => now(),
            'error_message' => 'Koneksi ke server SMTP ditolak (contoh).',
        ]);
    }
}
