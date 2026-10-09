<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sub_dimensions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dimension_id')->constrained()->restrictOnDelete();
            $table->string('name', 100);
            $table->smallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['dimension_id', 'name'], 'sub_dimensions_dimension_name_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sub_dimensions');
    }
};
