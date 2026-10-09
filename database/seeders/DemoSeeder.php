<?php

namespace Database\Seeders;

use App\Enums\EmailLogType;
use App\Enums\RaterRole;
use App\Models\Answer;
use App\Models\Company;
use App\Models\EmailLog;
use App\Models\ParticipantProfile;
use App\Models\Question;
use App\Models\Rater;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

/**
 * Data contoh khusus local/testing. Idempotent: peserta dikenali dari email tetap.
 */
class DemoSeeder extends Seeder
{
    private const COMPANIES = ['PT Demo Satu', 'PT Demo Dua'];

    private const PARTICIPANT_COUNT = 4;

    private const SUBORDINATE_COUNT = 3;

    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->command?->warn('DemoSeeder dilewati: hanya untuk environment local/testing.');

            return;
        }

        $companies = collect(self::COMPANIES)
            ->map(fn (string $name) => Company::findOrCreateByName($name))
            ->values();
        $questionIds = Question::pluck('id');

        for ($i = 1; $i <= self::PARTICIPANT_COUNT; $i++) {
            $participant = User::firstOrCreate(
                ['email' => "peserta{$i}@demo.test"],
                ['name' => fake()->name(), 'phone' => fake()->numerify('08##########'), 'password' => 'password'],
            );
            $participant->forceFill(['email_verified_at' => $participant->email_verified_at ?? now()])->save();
            $participant->assignRole('participant');

            ParticipantProfile::firstOrCreate(
                ['user_id' => $participant->id],
                ['company_id' => $companies[$i % $companies->count()]->id, 'position' => "Manajer Demo {$i}"],
            );

            if ($participant->raters()->exists()) {
                continue;
            }

            $this->seedRaters($participant, $i, $questionIds);
        }
    }

    /**
     * Set penilai lengkap: 1 self, 1 boss, 3 subordinate. Peserta ganjil sudah submit
     * sebagian (self + boss); peserta ke-4 sudah submit seluruhnya.
     *
     * @param  Collection<int, int>  $questionIds
     */
    private function seedRaters(User $participant, int $index, $questionIds): void
    {
        $raters = collect([
            Rater::factory()->selfRater()->create(['participant_id' => $participant->id]),
            Rater::factory()->boss()->create(['participant_id' => $participant->id]),
            ...Rater::factory()->subordinate()->count(self::SUBORDINATE_COUNT)->create(['participant_id' => $participant->id]),
        ]);

        $submittedCount = match (true) {
            $index === self::PARTICIPANT_COUNT => $raters->count(),
            $index % 2 === 1 => 2,
            default => 0,
        };

        $submitted = $raters->take($submittedCount);
        $rows = [];
        foreach ($submitted as $rater) {
            foreach ($questionIds as $questionId) {
                $rows[] = ['rater_id' => $rater->id, 'question_id' => $questionId, 'value' => random_int(1, 6)];
            }
        }

        Rater::whereKey($submitted->pluck('id'))->update(['submitted_at' => now()]);
        Answer::insert($rows);

        // Status contoh: boss terkirim, subordinate pertama gagal, sisanya antre.
        $invitedRaters = $raters->where('role', '!=', RaterRole::SelfRater)->values();
        foreach ($invitedRaters as $position => $rater) {
            $status = match ($position) {
                0 => 'sent',
                1 => 'failed',
                default => 'queued',
            };
            EmailLog::factory()->{$status}()->create([
                'type' => EmailLogType::RaterInvitation,
                'recipient_email' => $rater->email,
                'rater_id' => $rater->id,
            ]);
        }

        EmailLog::factory()->sent()->create([
            'type' => EmailLogType::EmailVerification,
            'recipient_email' => $participant->email,
            'user_id' => $participant->id,
        ]);
    }
}
