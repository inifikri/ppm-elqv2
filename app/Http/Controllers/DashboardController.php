<?php

namespace App\Http\Controllers;

use App\Actions\Dashboard\BuildDashboard;
use App\Enums\PermissionName;
use App\Enums\UserRole;
use App\Http\Controllers\Participant\ParticipantHomeController;
use App\Services\Participant\ParticipantFlowResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, BuildDashboard $build, ParticipantFlowResolver $flowResolver): Response|RedirectResponse
    {
        if ($request->user()->hasRole(UserRole::Participant->value)) {
            return app(ParticipantHomeController::class)->index($request, $flowResolver);
        }

        $canViewStats = $request->user()->can(PermissionName::ParticipantsView->value);

        return Inertia::render('dashboard', [
            'canViewStats' => $canViewStats,
            'dashboard' => $canViewStats ? Inertia::defer(fn () => $build->handle(), rescue: true) : null,
        ]);
    }
}
