<?php

namespace App\Actions\Users;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RestoreUsers
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
                if (! $user->trashed()) {
                    $result['dilewati'][] = ['nama' => $user->name, 'alasan' => 'Akun tidak berada di data sampah'];

                    continue;
                }

                $user->restore();

                activity('users')
                    ->performedOn($user)
                    ->causedBy($actor)
                    ->log('Memulihkan pengguna dari data sampah');

                $result['berhasil']++;
            }
        });

        return $result;
    }
}
