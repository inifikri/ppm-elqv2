<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Users\ForceDeleteUsers;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class UserForceDeleteController extends Controller
{
    public function __invoke(Request $request, User $user, ForceDeleteUsers $forceDelete): RedirectResponse
    {
        Gate::authorize('forceDelete', $user);

        $result = $forceDelete->handle($request->user(), collect([$user]));
        UserController::flashResult($result);

        return to_route('admin.users.index', ['tab' => 'trash']);
    }
}
