<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Spatie\Activitylog\Models\Activity;

class UserDetailController extends Controller
{
    /**
     * Read-only detail for the user drawer. Whitelisted fields only (no password/token).
     */
    public function __invoke(User $user): JsonResponse
    {
        Gate::authorize('view', $user);

        $user->load('roles', 'participantProfile.company');

        $activities = Activity::query()
            ->with('causer')
            ->where(function ($q) use ($user) {
                $q->where(function ($sub) use ($user) {
                    $sub->where('subject_type', $user->getMorphClass())
                        ->where('subject_id', $user->id);
                })->orWhere(function ($sub) use ($user) {
                    $sub->where('causer_type', $user->getMorphClass())
                        ->where('causer_id', $user->id);
                });
            })
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (Activity $activity) => [
                'id' => $activity->id,
                'description' => $activity->description,
                'log_name' => $activity->log_name,
                'causer_name' => $activity->causer?->name ?? 'Sistem',
                'created_at' => $activity->created_at?->toIso8601String(),
            ]);

        return response()->json(['data' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'is_active' => $user->is_active,
            'role' => $user->roles->first()?->name,
            'company' => $user->participantProfile?->company->name,
            'position' => $user->participantProfile?->position,
            'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            'last_login_at' => $user->last_login_at?->toIso8601String(),
            'created_at' => $user->created_at?->toIso8601String(),
            'activities' => $activities,
        ]]);
    }
}
