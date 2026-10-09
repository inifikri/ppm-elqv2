<?php

use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            $table->string('type', 30);
            $table->string('recipient_email');
            $table->foreignId('rater_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 20)->default(EmailLogStatus::Queued->value);
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->string('message_id')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('queued_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at'], 'email_logs_status_created_idx');
            $table->index('rater_id', 'email_logs_rater_idx');
            $table->index('user_id', 'email_logs_user_idx');
            $table->index('recipient_email', 'email_logs_recipient_idx');
        });

        // CHECK lewat DB::statement: Schema builder tidak menyediakan CHECK constraint.
        $quote = fn (array $values) => implode(',', array_map(fn (string $value) => "'{$value}'", $values));

        DB::statement('ALTER TABLE email_logs ADD CONSTRAINT email_logs_type_check CHECK (type IN ('.$quote(EmailLogType::values()).'))');
        DB::statement('ALTER TABLE email_logs ADD CONSTRAINT email_logs_status_check CHECK (status IN ('.$quote(EmailLogStatus::values()).'))');
    }

    public function down(): void
    {
        if (Schema::hasTable('email_logs')) {
            DB::statement('ALTER TABLE email_logs DROP CHECK email_logs_status_check');
            DB::statement('ALTER TABLE email_logs DROP CHECK email_logs_type_check');
        }

        Schema::dropIfExists('email_logs');
    }
};
