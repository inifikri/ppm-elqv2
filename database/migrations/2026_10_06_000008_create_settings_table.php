<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Kolom bernama `name` (bukan `key`) agar tidak bentrok dengan kata cadangan MySQL.
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
