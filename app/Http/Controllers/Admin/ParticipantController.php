<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Users\DeleteUsers;
use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use App\Enums\PermissionName;
use App\Enums\RaterRole;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreParticipantRequest;
use App\Http\Requests\Admin\UpdateParticipantRequest;
use App\Jobs\SendAssessmentInvitation;
use App\Models\Company;
use App\Models\EmailLog;
use App\Models\ParticipantProfile;
use App\Models\Rater;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class ParticipantController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize(PermissionName::ParticipantsView->value);

        $tab = $request->query('tab', 'all');
        $search = $request->query('search');
        $companyFilter = $request->query('company');
        $progressFilter = $request->query('progress');
        $statusFilter = $request->query('status');
        $sort = $request->query('sort', 'name');
        $direction = $request->query('direction', 'asc') === 'desc' ? 'desc' : 'asc';

        $query = ($tab === 'trash' ? User::onlyTrashed() : User::query())
            ->role(UserRole::Participant->value)
            ->with([
                'participantProfile.company',
                'raters' => fn ($q) => $q->select('id', 'participant_id', 'role', 'submitted_at', 'ulid', 'email'),
            ]);

        if ($search !== null && trim($search) !== '') {
            $like = '%'.addcslashes(trim($search), '\\%_').'%';
            $query->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like)
                    ->orWhereHas('participantProfile', fn ($p) => $p
                        ->where('position', 'like', $like)
                        ->orWhereHas('company', fn ($c) => $c->where('name', 'like', $like)));
            });
        }

        if ($companyFilter !== null && $companyFilter !== '') {
            $query->whereHas('participantProfile.company', fn ($c) => $c->where('name', $companyFilter));
        }

        if ($statusFilter !== null && $statusFilter !== '') {
            if ($statusFilter === 'active') {
                $query->where('is_active', true);
            } elseif ($statusFilter === 'inactive') {
                $query->where('is_active', false);
            } elseif ($statusFilter === 'unverified') {
                $query->whereNull('email_verified_at');
            }
        }

        if ($progressFilter !== null && $progressFilter !== '') {
            if ($progressFilter === 'not_started') {
                $query->whereDoesntHave('raters', fn ($r) => $r->whereNotNull('submitted_at'));
            } elseif ($progressFilter === 'completed') {
                $query->whereHas('raters')->whereDoesntHave('raters', fn ($r) => $r->whereNull('submitted_at'));
            } elseif ($progressFilter === 'in_progress') {
                $query->whereHas('raters', fn ($r) => $r->whereNotNull('submitted_at'))
                    ->whereHas('raters', fn ($r) => $r->whereNull('submitted_at'));
            }
        }

        if ($sort === 'company') {
            $query->leftJoin('participant_profiles as pp_sort', 'users.id', '=', 'pp_sort.user_id')
                ->leftJoin('companies as c_sort', 'pp_sort.company_id', '=', 'c_sort.id')
                ->orderBy('c_sort.name', $direction)
                ->select('users.*');
        } elseif ($sort === 'position') {
            $query->leftJoin('participant_profiles as pp_sort', 'users.id', '=', 'pp_sort.user_id')
                ->orderBy('pp_sort.position', $direction)
                ->select('users.*');
        } elseif ($sort === 'updated_at') {
            $query->orderBy('users.updated_at', $direction);
        } else {
            $query->orderBy('users.name', $direction);
        }

        $participants = $query->paginate(10)
            ->withQueryString()
            ->through(function (User $user) {
                $raters = $user->raters;
                $selfRater = $raters->firstWhere('role', RaterRole::SelfRater);
                $bossRater = $raters->firstWhere('role', RaterRole::Boss);
                $subRaters = $raters->where('role', RaterRole::Subordinate);

                $selfSubmitted = $selfRater?->submitted_at !== null;
                $bossSubmitted = $bossRater?->submitted_at !== null;
                $subTotal = $subRaters->count();
                $subSubmitted = $subRaters->whereNotNull('submitted_at')->count();
                $totalRaters = $raters->count();
                $totalSubmitted = $raters->whereNotNull('submitted_at')->count();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'company' => $user->participantProfile?->company?->name ?? '-',
                    'position' => $user->participantProfile?->position ?? '-',
                    'is_active' => $user->is_active,
                    'email_verified' => $user->email_verified_at !== null,
                    'is_trashed' => $user->trashed(),
                    'updated_at' => $user->updated_at->toIso8601String(),
                    'progress' => [
                        'self' => $selfSubmitted,
                        'boss' => $bossSubmitted,
                        'subordinate' => [
                            'submitted' => $subSubmitted,
                            'total' => $subTotal,
                        ],
                        'total_submitted' => $totalSubmitted,
                        'total_raters' => $totalRaters,
                        'is_completed' => $totalRaters > 0 && $totalSubmitted >= $totalRaters,
                        'has_started' => $totalSubmitted > 0,
                    ],
                ];
            });

        return Inertia::render('admin/participants/index', [
            'participants' => $participants,
            'filters' => [
                'search' => $search ?? '',
                'company' => $companyFilter ?? '',
                'progress' => $progressFilter ?? '',
                'status' => $statusFilter ?? '',
                'tab' => $tab,
                'sort' => $sort,
                'direction' => $direction,
            ],
            'trash_count' => User::onlyTrashed()->role(UserRole::Participant->value)->count(),
            'companies' => Company::orderBy('name')->pluck('name'),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize(PermissionName::ParticipantsUpdate->value);

        return Inertia::render('admin/participants/create', [
            'companies' => Company::orderBy('name')->pluck('name'),
        ]);
    }

    public function store(StoreParticipantRequest $request): RedirectResponse
    {
        Gate::authorize(PermissionName::ParticipantsUpdate->value);

        $validated = $request->validated();

        $participant = DB::transaction(function () use ($validated, $request) {
            $user = new User([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => $validated['password'],
            ]);
            $user->forceFill([
                'email_verified_at' => now(),
                'is_active' => true,
            ])->save();
            $user->assignRole(UserRole::Participant->value);
            $user->syncPermissions(
                array_column(PermissionName::defaultsFor(UserRole::Participant), 'value')
            );

            $company = Company::findOrCreateByName($validated['company_name']);
            ParticipantProfile::create([
                'user_id' => $user->id,
                'company_id' => $company->id,
                'position' => trim($validated['position']),
            ]);

            $selfRater = Rater::create([
                'participant_id' => $user->id,
                'role' => RaterRole::SelfRater,
                'email' => null,
            ]);

            $bossRater = Rater::create([
                'participant_id' => $user->id,
                'role' => RaterRole::Boss,
                'email' => $validated['boss_email'],
            ]);

            $subRaters = [];
            foreach ($validated['subordinate_emails'] as $subEmail) {
                $subRaters[] = Rater::create([
                    'participant_id' => $user->id,
                    'role' => RaterRole::Subordinate,
                    'email' => $subEmail,
                ]);
            }

            foreach ([$bossRater, ...$subRaters] as $rater) {
                $emailLog = EmailLog::create([
                    'type' => EmailLogType::RaterInvitation,
                    'recipient_email' => $rater->email,
                    'rater_id' => $rater->id,
                    'user_id' => $user->id,
                    'status' => EmailLogStatus::Queued,
                    'queued_at' => now(),
                ]);

                SendAssessmentInvitation::dispatch($rater, $emailLog->id);
            }

            activity('participants')
                ->performedOn($user)
                ->causedBy($request->user())
                ->log("Menambahkan peserta baru {$user->name} dengan 1 penilai atasan dan 3 bawahan");

            return $user;
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Peserta {$participant->name} berhasil ditambahkan dan undangan penilai telah dijadwalkan.",
        ]);

        return to_route('admin.participants.show', $participant);
    }

    public function show(User $participant): Response
    {
        Gate::authorize(PermissionName::ParticipantsView->value);

        if (! $participant->hasRole(UserRole::Participant->value)) {
            abort(404, 'Pengguna bukan peserta assessment.');
        }

        $participant->loadMissing([
            'participantProfile.company',
            'raters.emailLogs' => fn ($q) => $q->latest()->limit(5),
        ]);

        $activities = Activity::query()
            ->with('causer')
            ->where(function ($q) use ($participant) {
                $q->where(function ($sub) use ($participant) {
                    $sub->where('subject_type', $participant->getMorphClass())
                        ->where('subject_id', $participant->id);
                })->orWhere(function ($sub) use ($participant) {
                    $sub->where('causer_type', $participant->getMorphClass())
                        ->where('causer_id', $participant->id);
                })->orWhere(function ($sub) use ($participant) {
                    $sub->where('subject_type', Rater::class)
                        ->whereIn('subject_id', $participant->raters->pluck('id'));
                });
            })
            ->latest()
            ->limit(30)
            ->get()
            ->map(fn (Activity $act) => [
                'id' => $act->id,
                'description' => $act->description,
                'causer_name' => $act->causer?->name ?? 'Sistem',
                'created_at' => $act->created_at?->toIso8601String(),
            ]);

        $raters = $participant->raters->map(function (Rater $rater) {
            $latestLog = $rater->emailLogs->first();

            return [
                'id' => $rater->id,
                'ulid' => $rater->ulid,
                'role' => $rater->role->value,
                'role_label' => $rater->role->label(),
                'email' => $rater->email,
                'submitted_at' => $rater->submitted_at?->toIso8601String(),
                'is_submitted' => $rater->isSubmitted(),
                'invitation_status' => $latestLog?->status?->value ?? ($rater->role === RaterRole::SelfRater ? 'self' : 'not_sent'),
                'invitation_sent_at' => $latestLog?->sent_at?->toIso8601String(),
            ];
        });

        return Inertia::render('admin/participants/show', [
            'participant' => [
                'id' => $participant->id,
                'name' => $participant->name,
                'email' => $participant->email,
                'phone' => $participant->phone,
                'company_name' => $participant->participantProfile?->company?->name ?? '',
                'position' => $participant->participantProfile?->position ?? '',
                'is_active' => $participant->is_active,
                'is_trashed' => $participant->trashed(),
                'can_delete' => $participant->id !== auth()->id(),
                'created_at' => $participant->created_at?->toIso8601String(),
                'updated_at' => $participant->updated_at?->toIso8601String(),
                'has_results' => $participant->raters->whereNotNull('submitted_at')->count() > 0,
            ],
            'raters' => $raters,
            'activities' => $activities,
            'companies' => Company::orderBy('name')->pluck('name'),
        ]);
    }

    public function destroy(User $participant, DeleteUsers $delete): RedirectResponse
    {
        Gate::authorize('delete', $participant);

        $result = $delete->handle(auth()->user(), collect([$participant->load('roles')]));
        UserController::flashResult($result);

        return back();
    }

    public function edit(User $participant): Response
    {
        Gate::authorize(PermissionName::ParticipantsUpdate->value);

        if (! $participant->hasRole(UserRole::Participant->value)) {
            abort(404, 'Pengguna bukan peserta assessment.');
        }

        $participant->loadMissing([
            'participantProfile.company',
            'raters',
        ]);

        $bossRater = $participant->raters->firstWhere('role', RaterRole::Boss);
        $subRaters = $participant->raters->where('role', RaterRole::Subordinate)->values();

        $subordinateEmails = [
            $subRaters->get(0)?->email ?? '',
            $subRaters->get(1)?->email ?? '',
            $subRaters->get(2)?->email ?? '',
        ];

        return Inertia::render('admin/participants/edit', [
            'participant' => [
                'id' => $participant->id,
                'name' => $participant->name,
                'email' => $participant->email,
                'phone' => $participant->phone ?? '',
                'company_name' => $participant->participantProfile?->company?->name ?? '',
                'position' => $participant->participantProfile?->position ?? '',
                'boss_email' => $bossRater?->email ?? '',
                'subordinate_emails' => $subordinateEmails,
            ],
            'companies' => Company::orderBy('name')->pluck('name'),
        ]);
    }

    public function update(UpdateParticipantRequest $request, User $participant): RedirectResponse
    {
        Gate::authorize(PermissionName::ParticipantsUpdate->value);

        if (! $participant->hasRole(UserRole::Participant->value)) {
            abort(404, 'Pengguna bukan peserta assessment.');
        }

        $validated = $request->validated();

        DB::transaction(function () use ($validated, $participant, $request) {
            $participant->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
            ]);

            $company = Company::findOrCreateByName($validated['company_name']);
            $profile = $participant->participantProfile ?? new ParticipantProfile(['user_id' => $participant->id]);
            $profile->company_id = $company->id;
            $profile->position = trim($validated['position']);
            $profile->save();

            // Self rater
            $selfRater = $participant->raters()->where('role', RaterRole::SelfRater)->first();
            if (! $selfRater) {
                Rater::create([
                    'participant_id' => $participant->id,
                    'role' => RaterRole::SelfRater,
                    'email' => null,
                ]);
            }

            // Boss rater
            $bossRater = $participant->raters()->where('role', RaterRole::Boss)->first();
            if ($bossRater) {
                $oldBossEmail = $bossRater->email;
                $newBossEmail = $validated['boss_email'];
                if ($oldBossEmail !== $newBossEmail) {
                    $bossRater->update(['email' => $newBossEmail]);
                    activity('raters')
                        ->performedOn($bossRater)
                        ->causedBy($request->user())
                        ->log("Mengubah email penilai atasan dari {$oldBossEmail} ke {$newBossEmail}");
                }
            } else {
                $bossRater = Rater::create([
                    'participant_id' => $participant->id,
                    'role' => RaterRole::Boss,
                    'email' => $validated['boss_email'],
                ]);
                $emailLog = EmailLog::create([
                    'type' => EmailLogType::RaterInvitation,
                    'recipient_email' => $bossRater->email,
                    'rater_id' => $bossRater->id,
                    'user_id' => $participant->id,
                    'status' => EmailLogStatus::Queued,
                    'queued_at' => now(),
                ]);
                SendAssessmentInvitation::dispatch($bossRater, $emailLog->id);
            }

            // Subordinate raters
            $existingSubs = $participant->raters()->where('role', RaterRole::Subordinate)->orderBy('id')->get();
            foreach ($validated['subordinate_emails'] as $index => $subEmail) {
                $existingSub = $existingSubs->get($index);
                if ($existingSub) {
                    $oldSubEmail = $existingSub->email;
                    if ($oldSubEmail !== $subEmail) {
                        $existingSub->update(['email' => $subEmail]);
                        activity('raters')
                            ->performedOn($existingSub)
                            ->causedBy($request->user())
                            ->log("Mengubah email penilai bawahan dari {$oldSubEmail} ke {$subEmail}");
                    }
                } else {
                    $newSub = Rater::create([
                        'participant_id' => $participant->id,
                        'role' => RaterRole::Subordinate,
                        'email' => $subEmail,
                    ]);
                    $emailLog = EmailLog::create([
                        'type' => EmailLogType::RaterInvitation,
                        'recipient_email' => $newSub->email,
                        'rater_id' => $newSub->id,
                        'user_id' => $participant->id,
                        'status' => EmailLogStatus::Queued,
                        'queued_at' => now(),
                    ]);
                    SendAssessmentInvitation::dispatch($newSub, $emailLog->id);
                }
            }

            activity('participants')
                ->performedOn($participant)
                ->causedBy($request->user())
                ->log("Memperbarui data peserta {$participant->name}");
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data peserta berhasil diperbarui.',
        ]);

        return to_route('admin.participants.show', $participant);
    }
}
