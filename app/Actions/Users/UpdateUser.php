<?php

namespace App\Actions\Users;

use App\Enums\UserRole;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class UpdateUser
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(User $actor, User $user, array $data): void
    {
        DB::transaction(function () use ($actor, $user, $data) {
            $user->fill(collect($data)->only(['name', 'email', 'phone'])->all());

            if (! empty($data['password'])) {
                $user->password = $data['password'];
            }

            if (array_key_exists('is_active', $data) && ! $data['is_active'] && $user->is_active) {
                if ($reason = SetUsersActive::protectionReason($user, $actor)) {
                    throw ValidationException::withMessages(['is_active' => $reason]);
                }
            }
            if (($data['photo'] ?? null) instanceof UploadedFile) {
                $old = $user->photo_path;
                $user->photo_path = $data['photo']->store('avatars', 'public');
                $old && Storage::disk('public')->delete($old);
            }
            $user->is_active = $data['is_active'] ?? $user->is_active;
            $user->save();

            if ($user->hasRole(UserRole::Participant->value)) {
                if (! empty($data['company_name']) && ! empty($data['position'])) {
                    $user->participantProfile()->updateOrCreate([], [
                        'company_id' => Company::findOrCreateByName($data['company_name'])->id,
                        'position' => trim($data['position']),
                    ]);
                }

                $before = $user->getDirectPermissions()->pluck('name')->sort()->values()->all();
                $names = $data['permissions'] ?? [];
                $user->syncPermissions($names);

                if (collect($names)->sort()->values()->all() !== $before) {
                    activity('users')->performedOn($user)->withProperties(['permissions' => $names])->log('permissions');
                }
            }
        });
    }
}
