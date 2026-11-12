<?php

namespace App\Policies;

use App\Enums\PermissionName;
use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(PermissionName::UsersManage->value);
    }

    public function view(User $user, User $target): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, User $target): bool
    {
        return $this->viewAny($user);
    }

    public function delete(User $user, User $target): bool
    {
        return $this->viewAny($user) && ! $user->is($target);
    }

    public function restore(User $user, User $target): bool
    {
        return $user->can(PermissionName::UsersManage->value)
            || $user->can(PermissionName::UsersRestore->value);
    }

    public function forceDelete(User $user, User $target): bool
    {
        return $this->delete($user, $target);
    }

    public function resetPassword(User $user, User $target): bool
    {
        return $user->can(PermissionName::UsersManage->value)
            || $user->can(PermissionName::UsersResetPassword->value);
    }

    public function toggleStatus(User $user, User $target): bool
    {
        return $this->viewAny($user) && ! $user->is($target);
    }
}
