<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Users\DeleteUsers;
use App\Actions\Users\SetUsersActive;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class UserBulkController extends Controller
{
    public function __invoke(BulkUserRequest $request, SetUsersActive $setActive, DeleteUsers $delete): RedirectResponse
    {
        Gate::authorize('viewAny', User::class);

        $users = User::with('roles')->whereIn('id', $request->validated('ids'))->get();
        $actor = $request->user();

        $result = match ($request->validated('action')) {
            'activate' => $setActive->handle($actor, $users, true),
            'deactivate' => $setActive->handle($actor, $users, false),
            'delete' => $delete->handle($actor, $users),
        };

        UserController::flashResult($result);

        return back();
    }
}
