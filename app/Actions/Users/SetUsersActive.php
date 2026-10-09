<?php

namespace App\Actions\Users;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SetUsersActive
{
    /**
     * Alasan akun tidak boleh dinonaktifkan/dihapus, atau null bila boleh.
     */
    public static function protectionReason(User $user, User $actor): ?string
    {
        if ($user->is($actor)) {
            return 'Tidak dapat memproses akun sendiri';
        }

        $isLastActiveAdmin = $user->is_active
            && $user->hasRole(UserRole::Admin->value)
            && ! User::active()->role(UserRole::Admin->value)->whereKeyNot($user->id)->exists();

        return $isLastActiveAdmin ? 'Admin aktif terakhir' : null;
    }

    /**
     * @param  Collection<int, User>  $users
     * @return array{berhasil: int, dilewati: list<array{nama: string, alasan: string}>}
     */
    public function handle(User $actor, Collection $users, bool $active): array
    {
        $result = ['berhasil' => 0, 'dilewati' => []];

        DB::transaction(function () use ($actor, $users, $active, &$result) {
            foreach ($users as $user) {
                $reason = $active ? null : self::protectionReason($user, $actor);

                if ($reason) {
                    $result['dilewati'][] = ['nama' => $user->name, 'alasan' => $reason];

                    continue;
                }

                $user->is_active = $active;
                $user->save();
                $result['berhasil']++;
            }
        });

        return $result;
    }
}
