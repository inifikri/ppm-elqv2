<?php

namespace App\Actions\Users;

use App\Models\Answer;
use App\Models\EmailLog;
use App\Models\ParticipantProfile;
use App\Models\Rater;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ForceDeleteUsers
{
    /**
     * @param  Collection<int, User>  $users
     * @return array{berhasil: int, dilewati: list<array{nama: string, alasan: string}>}
     */
    public function handle(User $actor, Collection $users): array
    {
        $result = ['berhasil' => 0, 'dilewati' => []];

        DB::transaction(function () use ($actor, $users, &$result) {
            foreach ($users as $user) {
                if ($reason = SetUsersActive::protectionReason($user, $actor)) {
                    $result['dilewati'][] = ['nama' => $user->name, 'alasan' => $reason];

                    continue;
                }

                $userId = $user->id;

                // 1. Ambil rater IDs
                $raterIds = Rater::where('participant_id', $userId)->pluck('id');

                // 2. Hapus jawaban kuesioner terkait raters
                if ($raterIds->isNotEmpty()) {
                    Answer::whereIn('rater_id', $raterIds)->delete();
                }

                // 3. Hapus email logs
                EmailLog::where('user_id', $userId)
                    ->orWhereIn('rater_id', $raterIds)
                    ->delete();

                // 4. Hapus raters
                Rater::where('participant_id', $userId)->delete();

                // 5. Hapus participant profile
                ParticipantProfile::where('user_id', $userId)->delete();

                // 6. Hapus foto dari storage
                if ($user->photo_path) {
                    Storage::disk('public')->delete($user->photo_path);
                }

                // 7. Catat audit log penghapusan permanen sebelum user dihapus (log tersimpan permanen)
                activity('users')
                    ->causedBy($actor)
                    ->withProperties([
                        'deleted_user_id' => $userId,
                        'deleted_user_name' => $user->name,
                        'deleted_user_email' => $user->email,
                    ])
                    ->log("Menghapus permanen pengguna ({$user->name} - {$user->email})");

                // 8. Lepaskan roles & permissions
                $user->syncRoles([]);
                $user->syncPermissions([]);

                // 9. Force delete user
                $user->forceDelete();

                $result['berhasil']++;
            }
        });

        return $result;
    }
}
