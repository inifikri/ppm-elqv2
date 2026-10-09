<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

// Sengaja tanpa WithoutModelEvents: HasUlids (Rater) mengisi ulid lewat event creating.
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            SettingSeeder::class,
            QuestionnaireSeeder::class,
            AdminUserSeeder::class,
        ]);

        if (app()->environment(['local', 'testing'])) {
            $this->call(DemoSeeder::class);
        }
    }
}
