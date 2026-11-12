<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionName;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize(PermissionName::ActivityLogView->value);

        $search = trim((string) $request->input('search', ''));
        $logName = trim((string) $request->input('log_name', ''));
        $event = trim((string) $request->input('event', ''));

        $query = Activity::query()
            ->with(['causer'])
            ->latest('id');

        if ($search !== '') {
            $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
            $query->where(function ($q) use ($like) {
                $q->where('description', 'like', $like)
                    ->orWhere('log_name', 'like', $like)
                    ->orWhere('event', 'like', $like)
                    ->orWhereHasMorph('causer', ['App\Models\User'], function ($userQuery) use ($like) {
                        $userQuery->where('name', 'like', $like)
                            ->orWhere('email', 'like', $like);
                    });
            });
        }

        if ($logName !== '') {
            $query->where('log_name', $logName);
        }

        if ($event !== '') {
            $query->where('event', $event);
        }

        $activities = $query->paginate(20)
            ->withQueryString()
            ->through(function (Activity $act) {
                $causer = $act->causer;
                $props = $act->properties?->toArray() ?? [];
                unset($props['password'], $props['token'], $props['signed_url'], $props['answers']);

                return [
                    'id' => $act->id,
                    'log_name' => $act->log_name ?? 'default',
                    'description' => $act->description,
                    'event' => $act->event,
                    'causer_name' => $causer?->name ?? 'Sistem',
                    'causer_email' => $causer?->email ?? null,
                    'subject_type' => $act->subject_type ? class_basename($act->subject_type) : null,
                    'subject_id' => $act->subject_id,
                    'properties' => $props,
                    'created_at' => $act->created_at?->toIso8601String(),
                ];
            });

        $availableLogNames = Activity::query()
            ->whereNotNull('log_name')
            ->distinct()
            ->pluck('log_name')
            ->sort()
            ->values();

        $availableEvents = Activity::query()
            ->whereNotNull('event')
            ->distinct()
            ->pluck('event')
            ->sort()
            ->values();

        return Inertia::render('admin/activity-logs/index', [
            'activities' => $activities,
            'filters' => [
                'search' => $search,
                'log_name' => $logName,
                'event' => $event,
            ],
            'availableLogNames' => $availableLogNames,
            'availableEvents' => $availableEvents,
        ]);
    }
}
