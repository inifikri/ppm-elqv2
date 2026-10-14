<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Participant\StoreEvaluators;
use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use App\Enums\PermissionName;
use App\Enums\RaterRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Participant\StoreEvaluatorsRequest;
use App\Jobs\SendAssessmentInvitation;
use App\Models\EmailLog;
use App\Models\Rater;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ParticipantRaterController extends Controller
{
    public function resend(Request $request, User $participant, Rater $rater): RedirectResponse
    {
        Gate::authorize(PermissionName::RatersResend->value);

        if ((int) $rater->participant_id !== (int) $participant->id) {
            abort(404, 'Penilai tidak terkait dengan peserta ini.');
        }

        if ($rater->role === RaterRole::SelfRater) {
            return back()->withErrors(['message' => 'Penilai diri sendiri mengisi melalui akun peserta.']);
        }

        if ($rater->isSubmitted()) {
            return back()->withErrors(['message' => 'Penilai sudah menyelesaikan penilaian.']);
        }

        if (empty($rater->email)) {
            return back()->withErrors(['message' => 'Email penilai tidak ditemukan.']);
        }

        // Throttle 1 menit per rater untuk mencegah spam
        $recentLog = EmailLog::query()
            ->where('rater_id', $rater->id)
            ->where('created_at', '>=', now()->subMinute())
            ->exists();

        if ($recentLog) {
            return back()->withErrors(['message' => 'Undangan baru saja dikirim. Mohon tunggu 1 menit sebelum mengirim ulang.']);
        }

        $emailLog = EmailLog::create([
            'type' => EmailLogType::RaterInvitation,
            'recipient_email' => $rater->email,
            'user_id' => $participant->id,
            'rater_id' => $rater->id,
            'status' => EmailLogStatus::Queued,
            'queued_at' => now(),
        ]);

        SendAssessmentInvitation::dispatch($rater, $emailLog->id);

        activity('raters')
            ->performedOn($rater)
            ->causedBy($request->user())
            ->log("Mengirim ulang undangan penilai ({$rater->role->label()})");

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Undangan penilai ({$rater->email}) berhasil dikirimkan.",
        ]);

        return back();
    }

    public function revoke(Request $request, User $participant, Rater $rater): RedirectResponse
    {
        Gate::authorize(PermissionName::RatersRevoke->value);

        if ((int) $rater->participant_id !== (int) $participant->id) {
            abort(404, 'Penilai tidak terkait dengan peserta ini.');
        }

        if ($rater->role === RaterRole::SelfRater) {
            return back()->withErrors(['message' => 'Tidak dapat mencabut tautan penilai diri sendiri.']);
        }

        if ($rater->isSubmitted()) {
            return back()->withErrors(['message' => 'Tidak dapat mencabut tautan penilai yang sudah menyelesaikan penilaian.']);
        }

        // Rotasi ULID baru sehingga ULID lama menjadi tidak valid (FR-009 / FR-041)
        $rater->forceFill(['ulid' => (string) Str::ulid()])->save();

        // Audit log dicatat TANPA token / ULID / URL sesuai standar FR-009 / FR-044
        activity('raters')
            ->performedOn($rater)
            ->causedBy($request->user())
            ->log("Mencabut link penilaian untuk penilai ({$rater->role->label()})");

        if ($request->boolean('send_invitation') && ! empty($rater->email)) {
            $emailLog = EmailLog::create([
                'type' => EmailLogType::RaterInvitation,
                'recipient_email' => $rater->email,
                'user_id' => $participant->id,
                'rater_id' => $rater->id,
                'status' => EmailLogStatus::Queued,
                'queued_at' => now(),
            ]);

            SendAssessmentInvitation::dispatch($rater, $emailLog->id);

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'Tautan penilai dicabut dan tautan baru telah dikirimkan via email.',
            ]);
        } else {
            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'Tautan penilai berhasil dicabut. Tautan lama kini tidak dapat diakses.',
            ]);
        }

        return back();
    }

    public function update(Request $request, User $participant, Rater $rater): RedirectResponse
    {
        Gate::authorize(PermissionName::ParticipantsUpdate->value);

        if ((int) $rater->participant_id !== (int) $participant->id) {
            abort(404, 'Penilai tidak terkait dengan peserta ini.');
        }

        if ($rater->role === RaterRole::SelfRater) {
            return back()->withErrors(['message' => 'Penilai diri sendiri tidak memiliki email eksternal.']);
        }

        $validated = $request->validate([
            'email' => [
                'required',
                'string',
                'email:rfc,filter',
                'max:255',
                Rule::unique('raters', 'email')
                    ->where('participant_id', $participant->id)
                    ->ignore($rater->id),
            ],
            'send_invitation' => ['sometimes', 'boolean'],
        ], [
            'email.required' => 'Email penilai wajib diisi.',
            'email.email' => 'Format email penilai tidak valid.',
            'email.unique' => 'Email ini sudah digunakan oleh penilai lain untuk peserta ini.',
        ]);

        $newEmail = mb_strtolower(trim($validated['email']));
        if ($newEmail === mb_strtolower(trim($participant->email))) {
            return back()->withErrors(['email' => 'Email penilai tidak boleh sama dengan email peserta.']);
        }

        $oldEmail = $rater->email;
        $rater->email = $newEmail;
        $rater->save();

        activity('raters')
            ->performedOn($rater)
            ->causedBy($request->user())
            ->log("Mengubah email penilai {$rater->role->label()} dari {$oldEmail} menjadi {$newEmail}");

        if ($request->boolean('send_invitation') && ! $rater->isSubmitted()) {
            $emailLog = EmailLog::create([
                'type' => EmailLogType::RaterInvitation,
                'recipient_email' => $rater->email,
                'user_id' => $participant->id,
                'rater_id' => $rater->id,
                'status' => EmailLogStatus::Queued,
                'queued_at' => now(),
            ]);

            SendAssessmentInvitation::dispatch($rater, $emailLog->id);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Data penilai ({$rater->role->label()}) berhasil diperbarui.",
        ]);

        return back();
    }

    public function store(StoreEvaluatorsRequest $request, User $participant, StoreEvaluators $action): RedirectResponse
    {
        Gate::authorize(PermissionName::ParticipantsUpdate->value);

        $action->handle($participant, $request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Penilai atasan dan bawahan berhasil didaftarkan.',
        ]);

        return back();
    }
}
