<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rater_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->restrictOnDelete();
            $table->tinyInteger('value');

            $table->unique(['rater_id', 'question_id'], 'answers_rater_question_unique');
            $table->index('question_id', 'answers_question_idx');
        });

        // CHECK lewat DB::statement: Schema builder tidak menyediakan CHECK constraint.
        DB::statement('ALTER TABLE answers ADD CONSTRAINT answers_value_range_check CHECK (value BETWEEN 1 AND 6)');
    }

    public function down(): void
    {
        if (Schema::hasTable('answers')) {
            DB::statement('ALTER TABLE answers DROP CHECK answers_value_range_check');
        }

        Schema::dropIfExists('answers');
    }
};
