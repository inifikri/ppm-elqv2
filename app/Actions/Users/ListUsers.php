<?php

namespace App\Actions\Users;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ListUsers
{
    /**
     * @param  array{search?: ?string, role?: ?string, status?: ?string, tab?: ?string}  $filters
     * @return LengthAwarePaginator<int, User>
     */
    public function handle(array $filters = []): LengthAwarePaginator
    {
        $search = $filters['search'] ?? null;
        $role = $filters['role'] ?? null;
        $status = $filters['status'] ?? null;
        $tab = $filters['tab'] ?? 'all';

        $like = $search === null || trim($search) === ''
            ? null
            : '%'.addcslashes(trim($search), '\\%_').'%';

        $query = $tab === 'trash'
            ? User::onlyTrashed()
            : User::query();

        return $query
            ->with(['roles', 'participantProfile.company'])
            ->when($like, fn ($q) => $q->where(fn ($sub) => $sub
                ->where('name', 'like', $like)
                ->orWhere('email', 'like', $like)
                ->orWhere('phone', 'like', $like)
                ->orWhereHas('participantProfile', fn ($p) => $p
                    ->where('position', 'like', $like)
                    ->orWhereHas('company', fn ($c) => $c->where('name', 'like', $like)))))
            ->when($role, fn ($q) => $q->role($role))
            ->when($status !== null && $status !== '', function ($q) use ($status) {
                if ($status === 'active') {
                    $q->where('is_active', true);
                } elseif ($status === 'inactive') {
                    $q->where('is_active', false);
                }
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();
    }
}
