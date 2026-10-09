<?php

namespace App\Actions\Users;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DeleteUsers
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

                $user->delete();
                $result['berhasil']++;
            }
        });

        return $result;
    }
}
