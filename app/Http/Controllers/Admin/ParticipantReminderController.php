<?php

namespace App\Http\Controllers\Admin;

use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use App\Enums\PermissionName;
use App\Enums\RaterRole;
use App\Http\Controllers\Controller;
use App\Jobs\SendAssessmentInvitation;
use App\Models\EmailLog;
use App\Models\Rater;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ParticipantReminderController extends Controller
{
    /**
     * Tampilkan halaman daftar penilai yang belum mengisi asesmen > 2 hari.
     */
    public function index(Request $request): Response
    {
        Gate::authorize(PermissionName::ParticipantsView->value);

        $q = trim((string) $request->input('q', ''));
        $role = $request->input('role');
        $minDays = (int) $request->input('min_days', 2);
        if ($minDays < 1) {
            $minDays = 2;
        }

        $cutoffDate = now()->subDays($minDays);

        $baseQuery = Rater::query()
            ->pending()
            ->where('role', '!=', RaterRole::SelfRater)
            ->whereNotNull('email')
            ->where('created_at', '<', $cutoffDate)
            ->with(['participant.participantProfile.company']);

        if ($q !== '') {
            $baseQuery->where(function ($sub) use ($q) {
                $sub->where('email', 'like', "%{$q}%")
                    ->orWhereHas('participant', function ($pQuery) use ($q) {
                        $pQuery->where('name', 'like', "%{$q}%")
                            ->orWhereHas('participantProfile', function ($profileQuery) use ($q) {
                                $profileQuery->where('position', 'like', "%{$q}%")
                                    ->orWhereHas('company', function ($cQuery) use ($q) {
                                        $cQuery->where('name', 'like', "%{$q}%");
                                    });
                            });
                    });
            });
        }

        if ($role && in_array($role, [RaterRole::Boss->value, RaterRole::Subordinate->value], true)) {
            $baseQuery->where('role', $role);
        }

        $reminders = $baseQuery
            ->orderBy('created_at', 'asc') // Paling lama menunggu di atas
            ->paginate(15)
            ->withQueryString()
            ->through(function (Rater $rater) {
                $participant = $rater->participant;
                $profile = $participant?->participantProfile;
                $daysPending = (int) ($rater->created_at ? $rater->created_at->diffInDays(now()) : 0);

                // Cek apakah baru diingatkan < 1 menit lalu
                $recentlyReminded = EmailLog::query()
                    ->where('rater_id', $rater->id)
                    ->where('created_at', '>=', now()->subMinute())
                    ->exists();

                return [
                    'id' => $rater->id,
                    'ulid' => $rater->ulid,
                    'role' => $rater->role->value,
                    'role_label' => $rater->role->label(),
                    'email' => $rater->email,
                    'created_at' => $rater->created_at?->toISOString(),
                    'created_at_formatted' => $rater->created_at?->translatedFormat('d M Y, H:i'),
                    'days_pending' => $daysPending,
                    'is_critical' => $daysPending >= 7,
                    'can_remind' => ! $recentlyReminded,
                    'participant' => [
                        'id' => $participant?->id,
                        'name' => $participant?->name ?? 'Peserta',
                        'email' => $participant?->email,
                        'company' => $profile?->company?->name ?? 'Tidak ada data perusahaan',
                        'position' => $profile?->position ?? '-',
                        'detail_url' => $participant ? "/admin/participants/{$participant->id}" : null,
                    ],
                ];
            });

        // Statistik ringkas
        $overdue2DaysCutoff = now()->subDays(2);
        $overdue7DaysCutoff = now()->subDays(7);

        $stats = [
            'total_overdue' => Rater::query()
                ->pending()
                ->where('role', '!=', RaterRole::SelfRater)
                ->whereNotNull('email')
                ->where('created_at', '<', $overdue2DaysCutoff)
                ->count(),
            'critical_overdue' => Rater::query()
                ->pending()
                ->where('role', '!=', RaterRole::SelfRater)
                ->whereNotNull('email')
                ->where('created_at', '<', $overdue7DaysCutoff)
                ->count(),
            'reminded_today' => EmailLog::query()
                ->where('type', EmailLogType::RaterInvitation)
                ->whereDate('created_at', today())
                ->count(),
        ];

        return Inertia::render('admin/reminders/index', [
            'reminders' => $reminders,
            'filters' => [
                'q' => $q,
                'role' => $role,
                'min_days' => $minDays,
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Kirim email pengingat secara massal (bulk action).
     */
    public function bulk(Request $request): RedirectResponse
    {
        Gate::authorize(PermissionName::RatersResend->value);

        $validated = $request->validate([
            'rater_ids' => ['required', 'array', 'min:1', 'max:100'],
            'rater_ids.*' => ['integer', 'distinct', Rule::exists('raters', 'id')],
        ], [
            'rater_ids.required' => 'Pilih minimal satu penilai untuk dikirimi pengingat.',
            'rater_ids.min' => 'Pilih minimal satu penilai.',
            'rater_ids.max' => 'Maksimal 100 penilai dalam satu proses pengiriman massal.',
        ]);

        $raters = Rater::query()
            ->pending()
            ->where('role', '!=', RaterRole::SelfRater)
            ->whereNotNull('email')
            ->whereIn('id', $validated['rater_ids'])
            ->with('participant')
            ->get();

        if ($raters->isEmpty()) {
            return back()->withErrors(['message' => 'Tidak ada penilai valid yang dapat dikirimi pengingat.']);
        }

        $sentCount = 0;
        $skippedCount = 0;

        foreach ($raters as $rater) {
            // Throttle 1 menit per rater
            $recentlyReminded = EmailLog::query()
                ->where('rater_id', $rater->id)
                ->where('created_at', '>=', now()->subMinute())
                ->exists();

            if ($recentlyReminded) {
                $skippedCount++;

                continue;
            }

            $emailLog = EmailLog::create([
                'type' => EmailLogType::RaterInvitation,
                'recipient_email' => $rater->email,
                'user_id' => $rater->participant_id,
                'rater_id' => $rater->id,
                'status' => EmailLogStatus::Queued,
                'queued_at' => now(),
            ]);

            SendAssessmentInvitation::dispatch($rater, $emailLog->id, isReminder: true);
            $sentCount++;
        }

        activity('raters')
            ->causedBy($request->user())
            ->log("Mengirimkan pengingat massal kepada {$sentCount} penilai asesmen");

        $message = "Pengingat berhasil dijadwalkan untuk {$sentCount} penilai.";
        if ($skippedCount > 0) {
            $message .= " ({$skippedCount} penilai dilewati karena baru saja diingatkan).";
        }

        Inertia::flash('toast', [
            'type' => $sentCount > 0 ? 'success' : 'warning',
            'message' => $message,
        ]);

        return back();
    }

    /**
     * Kirim email pengingat individual dari halaman pengingat.
     */
    public function remind(Request $request, Rater $rater): RedirectResponse
    {
        Gate::authorize(PermissionName::RatersResend->value);

        if ($rater->role === RaterRole::SelfRater) {
            return back()->withErrors(['message' => 'Penilai diri sendiri mengisi melalui akun peserta.']);
        }

        if ($rater->isSubmitted()) {
            return back()->withErrors(['message' => 'Penilai sudah menyelesaikan penilaian.']);
        }

        if (empty($rater->email)) {
            return back()->withErrors(['message' => 'Email penilai tidak ditemukan.']);
        }

        // Throttle 1 menit
        $recentLog = EmailLog::query()
            ->where('rater_id', $rater->id)
            ->where('created_at', '>=', now()->subMinute())
            ->exists();

        if ($recentLog) {
            return back()->withErrors(['message' => 'Pengingat baru saja dikirim. Mohon tunggu 1 menit sebelum mengirim ulang.']);
        }

        $emailLog = EmailLog::create([
            'type' => EmailLogType::RaterInvitation,
            'recipient_email' => $rater->email,
            'user_id' => $rater->participant_id,
            'rater_id' => $rater->id,
            'status' => EmailLogStatus::Queued,
            'queued_at' => now(),
        ]);

        SendAssessmentInvitation::dispatch($rater, $emailLog->id, isReminder: true);

        activity('raters')
            ->performedOn($rater)
            ->causedBy($request->user())
            ->log("Mengirimkan email pengingat kepada penilai ({$rater->role->label()})");

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Email pengingat berhasil dikirimkan ke {$rater->email}.",
        ]);

        return back();
    }
}
