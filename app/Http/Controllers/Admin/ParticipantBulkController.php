<?php

namespace App\Http\Controllers\Admin;

use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use App\Enums\PermissionName;
use App\Enums\RaterRole;
use App\Http\Controllers\Controller;
use App\Jobs\SendAssessmentInvitation;
use App\Jobs\SendAssessmentResultPdfJob;
use App\Models\EmailLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ParticipantBulkController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        Gate::authorize(PermissionName::ParticipantsBulk->value);

        $validated = $request->validate([
            'action' => ['required', Rule::in(['resend_invitations', 'send_pdf'])],
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer', 'distinct', Rule::exists('users', 'id')->whereNull('deleted_at')],
        ]);

        $participants = User::with('raters')
            ->whereIn('id', $validated['ids'])
            ->get();

        $action = $validated['action'];
        $result = ['berhasil' => 0, 'dilewati' => []];

        if ($action === 'resend_invitations') {
            Gate::authorize(PermissionName::RatersResend->value);

            foreach ($participants as $participant) {
                $unsubmittedRaters = $participant->raters
                    ->where('role', '!=', RaterRole::SelfRater)
                    ->filter(fn ($r) => ! $r->isSubmitted() && ! empty($r->email));

                if ($unsubmittedRaters->isEmpty()) {
                    $result['dilewati'][] = [
                        'nama' => $participant->name,
                        'alasan' => 'Semua penilai sudah mengisi atau tidak ada penilai eksternal',
                    ];

                    continue;
                }

                foreach ($unsubmittedRaters as $rater) {
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

                activity('raters')
                    ->performedOn($participant)
                    ->causedBy($request->user())
                    ->log('Kirim ulang massal undangan penilai untuk peserta');

                $result['berhasil']++;
            }
        } elseif ($action === 'send_pdf') {
            Gate::authorize(PermissionName::ResultsShare->value);

            foreach ($participants as $participant) {
                $hasSubmitted = $participant->raters->contains(fn ($r) => $r->isSubmitted());

                if (! $hasSubmitted) {
                    $result['dilewati'][] = [
                        'nama' => $participant->name,
                        'alasan' => 'Belum ada penilaian yang selesai diisi',
                    ];

                    continue;
                }

                $emailLog = EmailLog::create([
                    'type' => EmailLogType::AssessmentResult,
                    'recipient_email' => $participant->email,
                    'user_id' => $participant->id,
                    'status' => EmailLogStatus::Queued,
                    'queued_at' => now(),
                ]);

                SendAssessmentResultPdfJob::dispatch($participant, $emailLog->id);

                activity('results')
                    ->performedOn($participant)
                    ->causedBy($request->user())
                    ->log('Mengirim hasil assessment PDF massal ke email peserta');

                $result['berhasil']++;
            }
        }

        $message = "{$result['berhasil']} berhasil diproses";
        if (! empty($result['dilewati'])) {
            $skippedNames = collect($result['dilewati'])->map(fn ($s) => "{$s['nama']} ({$s['alasan']})")->implode(', ');
            $message .= ', '.count($result['dilewati'])." dilewati: {$skippedNames}";
        }

        Inertia::flash('toast', [
            'type' => empty($result['dilewati']) ? 'success' : 'warning',
            'message' => $message,
        ]);

        return back();
    }
}
