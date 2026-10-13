<?php

namespace App\Http\Middleware;

use App\Actions\Dashboard\BuildDashboard;
use App\Enums\PermissionName;
use App\Models\Dimension;
use App\Models\Question;
use App\Models\SubDimension;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'can' => [
                    'manage_users' => (bool) $request->user()?->can(PermissionName::UsersManage->value),
                    'manage_dimensions' => (bool) $request->user()?->can(PermissionName::DimensionsManage->value),
                    'manage_sub_dimensions' => (bool) $request->user()?->can(PermissionName::SubDimensionsManage->value),
                    'manage_questions' => (bool) $request->user()?->can(PermissionName::QuestionsManage->value),
                    'manage_company' => (bool) $request->user()?->can(PermissionName::CompanyManage->value),
                    'view_results' => (bool) $request->user()?->can(PermissionName::ResultsView->value),
                    'export_results' => (bool) $request->user()?->can(PermissionName::ResultsExport->value),
                    'share_results' => (bool) $request->user()?->can(PermissionName::ResultsShare->value),
                ],
            ],
            'notifications' => $request->user()?->can(PermissionName::ParticipantsView->value)
                ? Inertia::defer(fn () => app(BuildDashboard::class)->attentionItems(), rescue: true)
                : [],
            'menuCounts' => fn () => $this->menuCounts($request),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * Sidebar badge counts; soft-deleted rows are excluded by the models' global scope.
     *
     * @return array{dimensions: int|null, sub_dimensions: int|null, questions: int|null}|null
     */
    private function menuCounts(Request $request): ?array
    {
        $user = $request->user();

        if (! $user) {
            return null;
        }

        return [
            'dimensions' => $user->can(PermissionName::DimensionsManage->value) ? Dimension::count() : null,
            'sub_dimensions' => $user->can(PermissionName::SubDimensionsManage->value) ? SubDimension::count() : null,
            'questions' => $user->can(PermissionName::QuestionsManage->value) ? Question::count() : null,
        ];
    }
}
