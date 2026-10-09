<?php

namespace App\Models;

use Database\Factories\QuestionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

#[Fillable(['sub_dimension_id', 'text', 'sort_order'])]
class Question extends Model
{
    /** @use HasFactory<QuestionFactory> */
    use HasFactory, LogsActivity, SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function subDimension(): BelongsTo
    {
        return $this->belongsTo(SubDimension::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }

    /**
     * @param  Builder<static>  $query
     */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('sort_order');
    }

    public function getActivitylogOptions(): LogOptions
    {
        // Satu-satunya jejak perubahan kuesioner (keputusan 5 pada DBML).
        return LogOptions::defaults()
            ->logOnly(['text', 'sub_dimension_id'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('master');
    }
}
