<?php

namespace App\Actions\Users;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ListUsers
{
    /**
     * @return LengthAwarePaginator<int, User>
     */
    public function handle(?string $search): LengthAwarePaginator
    {
        $like = $search === null || trim($search) === ''
            ? null
            : '%'.addcslashes(trim($search), '\\%_').'%';

        return User::query()
            ->with(['roles', 'participantProfile.company'])
            ->when($like, fn ($query) => $query->where(fn ($q) => $q
                ->where('name', 'like', $like)
                ->orWhere('email', 'like', $like)
                ->orWhere('phone', 'like', $like)
                ->orWhereHas('participantProfile', fn ($p) => $p
                    ->where('position', 'like', $like)
                    ->orWhereHas('company', fn ($c) => $c->where('name', 'like', $like)))))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();
    }
}
