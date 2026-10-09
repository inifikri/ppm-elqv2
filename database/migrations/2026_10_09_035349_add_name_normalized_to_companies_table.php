<?php

use App\Models\Company;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * Rollback: `php artisan migrate:rollback` (hanya membuang kolom). Backup tabel companies sebelum migrate.
 * Gagal di unique bila ada dua nama yang sama setelah dinormalisasi: rapikan/gabung manual lalu ulangi.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('name_normalized')->nullable()->after('name');
        });

        DB::table('companies')->orderBy('id')->each(fn ($c) => DB::table('companies')
            ->where('id', $c->id)
            ->update(['name_normalized' => Company::normalize($c->name)]));

        Schema::table('companies', function (Blueprint $table) {
            $table->string('name_normalized')->nullable(false)->unique()->change();
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropUnique(['name_normalized']);
            $table->dropColumn('name_normalized');
        });
    }
};
