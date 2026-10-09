<?php

namespace App\Http\Controllers;

use App\Actions\Dashboard\BuildDashboard;
use App\Enums\PermissionName;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, BuildDashboard $build): Response
    {
        $canViewStats = $request->user()->can(PermissionName::ParticipantsView->value);

        return Inertia::render('dashboard', [
            'canViewStats' => $canViewStats,
            'dashboard' => $canViewStats ? Inertia::defer(fn () => $build->handle(), rescue: true) : null,
        ]);
    }
}
