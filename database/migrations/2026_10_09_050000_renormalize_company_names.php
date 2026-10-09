<?php

use App\Models\Company;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/*
 * Hitung ulang name_normalized dengan aturan baru (tanda baca diabaikan).
 * Gagal di unique bila dua perusahaan jadi sama ("PT Jaya" & "PT. Jaya"): gabung manual lalu ulangi.
 * Rollback tidak mengembalikan nilai lama (tidak perlu: kolom tetap valid dan dihitung ulang saat save).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('companies')->orderBy('id')->each(fn ($c) => DB::table('companies')
            ->where('id', $c->id)
            ->update(['name_normalized' => Company::normalize($c->name)]));
    }

    public function down(): void
    {
        //
    }
};
