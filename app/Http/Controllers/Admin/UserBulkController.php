<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Users\DeleteUsers;
use App\Actions\Users\ForceDeleteUsers;
use App\Actions\Users\RestoreUsers;
use App\Actions\Users\SetUsersActive;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class UserBulkController extends Controller
{
    public function __invoke(
        BulkUserRequest $request,
        SetUsersActive $setActive,
        DeleteUsers $delete,
        RestoreUsers $restore,
        ForceDeleteUsers $forceDelete
    ): RedirectResponse {
        Gate::authorize('viewAny', User::class);

        $users = User::withTrashed()->with('roles')->whereIn('id', $request->validated('ids'))->get();
        $actor = $request->user();

        $result = match ($request->validated('action')) {
            'activate' => $setActive->handle($actor, $users, true),
            'deactivate' => $setActive->handle($actor, $users, false),
            'delete' => $delete->handle($actor, $users),
            'restore' => $restore->handle($actor, $users),
            'force_delete' => $forceDelete->handle($actor, $users),
        };

        UserController::flashResult($result);

        return back();
    }
}
