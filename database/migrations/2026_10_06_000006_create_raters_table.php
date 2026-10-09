<?php

use App\Enums\RaterRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raters', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('participant_id')->constrained('users')->restrictOnDelete();
            $table->string('role', 20);
            $table->string('email')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->string('legacy_code', 100)->nullable()->unique();
            $table->timestamps();

            $table->unique(['participant_id', 'email'], 'raters_participant_email_unique');
            $table->index(['participant_id', 'role'], 'raters_participant_role_idx');
        });

        // CHECK lewat DB::statement: Schema builder tidak menyediakan CHECK constraint.
        $roles = implode(',', array_map(fn (string $role) => "'{$role}'", RaterRole::values()));
        $self = RaterRole::SelfRater->value;

        DB::statement("ALTER TABLE raters ADD CONSTRAINT raters_role_check CHECK (role IN ({$roles}))");
        DB::statement("ALTER TABLE raters ADD CONSTRAINT raters_email_by_role_check CHECK ((role = '{$self}' AND email IS NULL) OR (role <> '{$self}' AND email IS NOT NULL))");
    }

    public function down(): void
    {
        if (Schema::hasTable('raters')) {
            DB::statement('ALTER TABLE raters DROP CHECK raters_email_by_role_check');
            DB::statement('ALTER TABLE raters DROP CHECK raters_role_check');
        }

        Schema::dropIfExists('raters');
    }
};
