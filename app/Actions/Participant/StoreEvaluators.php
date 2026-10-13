<?php

namespace App\Actions\Participant;

use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use App\Enums\RaterRole;
use App\Jobs\SendAssessmentInvitation;
use App\Models\EmailLog;
use App\Models\Rater;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StoreEvaluators
{
    /**
     * @param  array{boss_email: string, subordinate_emails: list<string>}  $data
     * @return list<Rater>
     */
    public function handle(User $participant, array $data): array
    {
        // Cegah simpan dua kali
        if ($participant->raters()->exists()) {
            throw ValidationException::withMessages([
                'evaluators' => 'Daftar penilai sudah pernah disimpan dan tidak dapat diubah.',
            ]);
        }

        $bossEmail = strtolower(trim($data['boss_email']));
        $subordinateEmails = array_values(array_map(
            fn (string $email) => strtolower(trim($email)),
            $data['subordinate_emails']
        ));

        // Validasi: tidak boleh email peserta sendiri
        $participantEmail = strtolower(trim($participant->email));
        if ($bossEmail === $participantEmail || in_array($participantEmail, $subordinateEmails, true)) {
            throw ValidationException::withMessages([
                'email' => 'Email penilai tidak boleh menggunakan alamat email Anda sendiri.',
            ]);
        }

        // Validasi: tidak boleh duplikat antar penilai
        $allEmails = [$bossEmail, ...$subordinateEmails];
        if (count($allEmails) !== count(array_unique($allEmails))) {
            throw ValidationException::withMessages([
                'email' => 'Email atasan dan bawahan tidak boleh ada yang sama (duplikat).',
            ]);
        }

        return DB::transaction(function () use ($participant, $bossEmail, $subordinateEmails) {
            // 1. Buat rater self
            $selfRater = Rater::create([
                'participant_id' => $participant->id,
                'role' => RaterRole::SelfRater,
                'email' => null,
            ]);

            // 2. Buat rater boss
            $bossRater = Rater::create([
                'participant_id' => $participant->id,
                'role' => RaterRole::Boss,
                'email' => $bossEmail,
            ]);

            // 3. Buat rater subordinate (3 orang)
            $createdSubordinates = [];
            foreach ($subordinateEmails as $email) {
                $createdSubordinates[] = Rater::create([
                    'participant_id' => $participant->id,
                    'role' => RaterRole::Subordinate,
                    'email' => $email,
                ]);
            }

            // 4. Catat email_logs dan dispatch jobs antrean undangan
            $invitedRaters = [$bossRater, ...$createdSubordinates];
            foreach ($invitedRaters as $rater) {
                $emailLog = EmailLog::create([
                    'type' => EmailLogType::RaterInvitation,
                    'recipient_email' => $rater->email,
                    'rater_id' => $rater->id,
                    'user_id' => $participant->id,
                    'status' => EmailLogStatus::Queued,
                    'queued_at' => now(),
                ]);

                SendAssessmentInvitation::dispatch($rater, $emailLog->id);
            }

            // Catat activity log audit (tanpa isi sensitif)
            activity('evaluators')
                ->causedBy($participant)
                ->performedOn($participant)
                ->log('Menyimpan daftar penilai (1 atasan, 3 bawahan)');

            return [$selfRater, $bossRater, ...$createdSubordinates];
        });
    }
}
