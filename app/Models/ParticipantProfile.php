<?php

namespace App\Models;

use Database\Factories\ParticipantProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

#[Fillable(['user_id', 'company_id', 'position'])]
class ParticipantProfile extends Model
{
    /** @use HasFactory<ParticipantProfileFactory> */
    use HasFactory, LogsActivity;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['user_id', 'company_id', 'position'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('master');
    }
}
