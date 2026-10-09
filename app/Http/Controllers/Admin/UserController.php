<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Users\CreateUser;
use App\Actions\Users\DeleteUsers;
use App\Actions\Users\ListUsers;
use App\Actions\Users\UpdateUser;
use App\Enums\PermissionName;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexUserRequest;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(IndexUserRequest $request, ListUsers $list): Response
    {
        Gate::authorize('viewAny', User::class);

        $me = $request->user()->id;

        return Inertia::render('admin/users/index', [
            'users' => $list->handle($request->validated('search'))->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'is_active' => $user->is_active,
                'role' => $user->roles->first()?->name,
                'company' => $user->participantProfile?->company->name,
                'position' => $user->participantProfile?->position,
                'email_verified' => $user->email_verified_at !== null,
                'can_delete' => $user->id !== $me,
            ]),
            'filters' => ['search' => $request->validated('search') ?? ''],
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', User::class);

        return Inertia::render('admin/users/create', [
            ...$this->formProps(),
            'defaultPermissions' => array_column(PermissionName::defaultsFor(UserRole::Participant), 'value'),
        ]);
    }

    public function store(StoreUserRequest $request, CreateUser $create): RedirectResponse
    {
        Gate::authorize('create', User::class);

        $create->handle($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengguna dibuat.']);

        return to_route('admin.users.index');
    }

    public function edit(User $user): Response
    {
        Gate::authorize('update', $user);

        $user->load('roles', 'participantProfile.company');

        return Inertia::render('admin/users/edit', [
            ...$this->formProps(),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'is_active' => $user->is_active,
                'role' => $user->roles->first()?->name,
                'company_name' => $user->participantProfile?->company->name,
                'position' => $user->participantProfile?->position,
                'avatar' => $user->avatar,
                'is_self' => $user->id === auth()->id(),
            ],
            'permissions' => $user->getDirectPermissions()->pluck('name')->values(),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user, UpdateUser $update): RedirectResponse
    {
        Gate::authorize('update', $user);

        $update->handle($request->user(), $user, $request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengguna diperbarui.']);

        return to_route('admin.users.index');
    }

    public function destroy(User $user, DeleteUsers $delete): RedirectResponse
    {
        Gate::authorize('delete', $user);

        self::flashResult($delete->handle(auth()->user(), collect([$user->load('roles')])));

        return to_route('admin.users.index');
    }

    /**
     * @param  array{berhasil: int, dilewati: list<array{nama: string, alasan: string}>}  $result
     */
    public static function flashResult(array $result): void
    {
        $message = $result['berhasil'].' berhasil';

        if ($result['dilewati'] !== []) {
            $skipped = collect($result['dilewati'])->map(fn ($s) => "{$s['nama']} ({$s['alasan']})")->implode(', ');
            $message .= ', '.count($result['dilewati'])." dilewati: {$skipped}";
        }

        Inertia::flash('toast', [
            'type' => $result['dilewati'] === [] ? 'success' : 'warning',
            'message' => $message,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formProps(): array
    {
        return [
            'permissionGroups' => collect(PermissionName::cases())
                ->groupBy(fn (PermissionName $p) => $p->group())
                ->map(fn ($items, $group) => [
                    'group' => $group,
                    'permissions' => $items->map(fn (PermissionName $p) => ['name' => $p->value, 'label' => $p->label()])->values(),
                ])->values(),
            'companies' => Company::orderBy('name')->pluck('name'),
        ];
    }
}
