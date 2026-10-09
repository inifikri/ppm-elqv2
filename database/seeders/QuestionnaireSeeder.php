<?php

namespace Database\Seeders;

use App\Models\Dimension;
use App\Models\Question;
use App\Models\SubDimension;
use Illuminate\Database\Seeder;

class QuestionnaireSeeder extends Seeder
{
    public const DATA_PATH = 'seeders/data/questionnaire.json';

    /**
     * Konten asli tidak ditulis di sini: dibaca dari questionnaire.json
     * (diekspor dari database legacy). Format: lihat questionnaire.example.json.
     */
    public function run(): void
    {
        if (Question::withTrashed()->exists()) {
            return; // impor awal saja: jangan menimpa hasil edit admin
        }

        $path = database_path(self::DATA_PATH);

        if (! is_file($path)) {
            $this->command?->warn('QuestionnaireSeeder dilewati: database/seeders/data/questionnaire.json tidak ditemukan.');

            return;
        }

        $data = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);

        foreach ($data['dimensions'] as $dimensionOrder => $dimensionData) {
            $dimension = Dimension::updateOrCreate(
                ['name' => $dimensionData['name']],
                [
                    'sort_order' => $dimensionData['sort_order'] ?? $dimensionOrder + 1,
                    'is_active' => $dimensionData['is_active'] ?? true,
                ],
            );

            foreach ($dimensionData['sub_dimensions'] as $subOrder => $subData) {
                $subDimension = SubDimension::withTrashed()->updateOrCreate(
                    ['dimension_id' => $dimension->id, 'name' => $subData['name']],
                    ['sort_order' => $subData['sort_order'] ?? $subOrder + 1],
                );

                foreach ($subData['questions'] as $questionOrder => $questionData) {
                    // Kunci idempotensi: pasangan (sub_dimension_id, sort_order).
                    Question::withTrashed()->updateOrCreate(
                        [
                            'sub_dimension_id' => $subDimension->id,
                            'sort_order' => $questionData['sort_order'] ?? $questionOrder + 1,
                        ],
                        ['text' => $questionData['text']],
                    );
                }
            }
        }
    }
}
