<?php

namespace App\Models;

use App\Enums\RaterRole;
use Database\Factories\RaterFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

#[Fillable(['participant_id', 'role', 'email', 'submitted_at', 'legacy_code'])]
class Rater extends Model
{
    /** @use HasFactory<RaterFactory> */
    use HasFactory, HasUlids, LogsActivity;

    /**
     * PK tetap bigint; HasUlids hanya mengisi kolom ulid.
     *
     * @return list<string>
     */
    public function uniqueIds(): array
    {
        return ['ulid'];
    }

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'role' => RaterRole::class,
            'submitted_at' => 'datetime',
        ];
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'participant_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }

    public function emailLogs(): HasMany
    {
        return $this->hasMany(EmailLog::class);
    }

    /**
     * @param  Builder<static>  $query
     */
    public function scopeSubmitted(Builder $query): void
    {
        $query->whereNotNull('submitted_at');
    }

    /**
     * @param  Builder<static>  $query
     */
    public function scopePending(Builder $query): void
    {
        $query->whereNull('submitted_at');
    }

    /**
     * @param  Builder<static>  $query
     */
    public function scopeForRole(Builder $query, RaterRole $role): void
    {
        $query->where('role', $role);
    }

    public function isSubmitted(): bool
    {
        return $this->submitted_at !== null;
    }

    public function getActivitylogOptions(): LogOptions
    {
        // ulid/legacy_code setara kredensial link penilai: tidak dicatat.
        return LogOptions::defaults()
            ->logOnly(['role', 'email', 'submitted_at'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('raters');
    }
}
