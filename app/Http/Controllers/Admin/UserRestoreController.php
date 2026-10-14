<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Users\RestoreUsers;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class UserRestoreController extends Controller
{
    public function __invoke(Request $request, User $user, RestoreUsers $restore): RedirectResponse
    {
        Gate::authorize('restore', $user);

        $result = $restore->handle($request->user(), collect([$user]));
        UserController::flashResult($result);

        return back();
    }
}
