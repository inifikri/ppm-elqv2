<?php

namespace App\Models;

use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use Database\Factories\EmailLogFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Tanpa LogsActivity: tabel ini sendiri adalah log pengiriman.
#[Fillable([
    'type', 'recipient_email', 'rater_id', 'user_id', 'status', 'attempts',
    'message_id', 'error_message', 'queued_at', 'sent_at', 'failed_at',
])]
class EmailLog extends Model
{
    /** @use HasFactory<EmailLogFactory> */
    use HasFactory;

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'type' => EmailLogType::class,
            'status' => EmailLogStatus::class,
            'attempts' => 'integer',
            'queued_at' => 'datetime',
            'sent_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    public function rater(): BelongsTo
    {
        return $this->belongsTo(Rater::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
