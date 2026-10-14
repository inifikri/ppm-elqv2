<?php

namespace App\Actions\Users;

use App\Enums\UserRole;
use App\Models\Company;
use App\Models\ParticipantProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class CreateUser
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data): User
    {
        $role = UserRole::from($data['role']);

        return DB::transaction(function () use ($data, $role) {
            $user = new User(collect($data)->only(['name', 'email', 'phone', 'password'])->all());
            $user->forceFill([
                'is_active' => $data['is_active'] ?? true,
                'email_verified_at' => now(),
            ])->save();
            if (($data['photo'] ?? null) instanceof UploadedFile) {
                $user->forceFill(['photo_path' => $data['photo']->store('avatars', 'public')])->save();
            }
            $user->assignRole($role->value);

            if ($role === UserRole::Participant) {
                if (! empty($data['company_name']) && ! empty($data['position'])) {
                    ParticipantProfile::create([
                        'user_id' => $user->id,
                        'company_id' => Company::findOrCreateByName($data['company_name'])->id,
                        'position' => trim($data['position']),
                    ]);
                }

                $names = $data['permissions'] ?? [];
                $user->syncPermissions($names);
                activity('users')->performedOn($user)->withProperties(['permissions' => $names])->log('permissions');
            }

            return $user;
        });
    }
}
