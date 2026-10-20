<?php

namespace App\Http\Controllers\Admin;

use App\Enums\EmailLogStatus;
use App\Enums\EmailLogType;
use App\Enums\PermissionName;
use App\Http\Controllers\Controller;
use App\Jobs\SendAssessmentInvitation;
use App\Jobs\SendAssessmentResultPdfJob;
use App\Models\EmailLog;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

class EmailLogController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize(PermissionName::EmailLogManage->value);

        $search = trim((string) $request->input('search', ''));
        $status = trim((string) $request->input('status', ''));
        $type = trim((string) $request->input('type', ''));

        $query = EmailLog::query()
            ->with(['user:id,name,email', 'rater:id,role,participant_id'])
            ->latest('id');

        if ($search !== '') {
            $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
            $query->where(function ($q) use ($like) {
                $q->where('recipient_email', 'like', $like)
                    ->orWhere('error_message', 'like', $like)
                    ->orWhere('message_id', 'like', $like);
            });
        }

        if ($status !== '' && in_array($status, EmailLogStatus::values(), true)) {
            $query->where('status', $status);
        }

        if ($type !== '' && in_array($type, EmailLogType::values(), true)) {
            $query->where('type', $type);
        }

        $stats = [
            'total' => EmailLog::count(),
            'sent' => EmailLog::where('status', EmailLogStatus::Sent)->count(),
            'queued' => EmailLog::where('status', EmailLogStatus::Queued)->count(),
            'failed' => EmailLog::where('status', EmailLogStatus::Failed)->count(),
        ];

        $logs = $query->paginate(20)
            ->withQueryString()
            ->through(function (EmailLog $log) {
                return [
                    'id' => $log->id,
                    'type' => $log->type->value,
                    'type_label' => $log->type->label(),
                    'recipient_email' => $log->recipient_email,
                    'status' => $log->status->value,
                    'status_label' => $log->status->label(),
                    'attempts' => $log->attempts,
                    'message_id' => $log->message_id,
                    'error_message' => $log->error_message,
                    'user' => $log->user ? [
                        'id' => $log->user->id,
                        'name' => $log->user->name,
                        'email' => $log->user->email,
                    ] : null,
                    'rater' => $log->rater ? [
                        'id' => $log->rater->id,
                        'role' => $log->rater->role->value,
                        'role_label' => $log->rater->role->label(),
                    ] : null,
                    'queued_at' => $log->queued_at?->toIso8601String(),
                    'sent_at' => $log->sent_at?->toIso8601String(),
                    'failed_at' => $log->failed_at?->toIso8601String(),
                    'created_at' => $log->created_at?->toIso8601String(),
                ];
            });

        return Inertia::render('admin/email-logs/index', [
            'logs' => $logs,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'type' => $type,
            ],
            'availableStatuses' => collect(EmailLogStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ])->values(),
            'availableTypes' => collect(EmailLogType::cases())->map(fn ($t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ])->values(),
        ]);
    }

    public function retry(Request $request, EmailLog $emailLog): RedirectResponse
    {
        Gate::authorize(PermissionName::EmailLogManage->value);

        if ($emailLog->status !== EmailLogStatus::Failed) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Hanya email dengan status gagal yang dapat dikirim ulang.',
            ]);

            return back();
        }

        $success = $this->dispatchRetry($emailLog);

        if ($success) {
            activity('email_logs')
                ->performedOn($emailLog)
                ->causedBy($request->user())
                ->log("Kirim ulang email ({$emailLog->recipient_email})");

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => "Email ke {$emailLog->recipient_email} berhasil dijadwalkan ulang.",
            ]);
        } else {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Email tidak dapat dikirim ulang (data relasi penilai/peserta tidak ditemukan atau penilai sudah submit).',
            ]);
        }

        return back();
    }

    public function bulkRetry(Request $request): RedirectResponse
    {
        Gate::authorize(PermissionName::EmailLogManage->value);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'exists:email_logs,id'],
        ]);

        $logs = EmailLog::query()
            ->with(['user', 'rater'])
            ->whereIn('id', $validated['ids'])
            ->where('status', EmailLogStatus::Failed)
            ->get();

        if ($logs->isEmpty()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Tidak ada email berstatus gagal yang dipilih untuk dikirim ulang.',
            ]);

            return back();
        }

        $successCount = 0;
        foreach ($logs as $log) {
            if ($this->dispatchRetry($log)) {
                $successCount++;
            }
        }

        activity('email_logs')
            ->causedBy($request->user())
            ->log("Kirim ulang massal {$successCount} email dari ".count($logs).' yang dipilih');

        Inertia::flash('toast', [
            'type' => $successCount > 0 ? 'success' : 'error',
            'message' => "{$successCount} email berhasil dijadwalkan ulang untuk dikirimkan.",
        ]);

        return back();
    }

    private function dispatchRetry(EmailLog $emailLog): bool
    {
        if ($emailLog->status !== EmailLogStatus::Failed) {
            return false;
        }

        $emailLog->loadMissing(['rater', 'user']);

        if ($emailLog->type === EmailLogType::RaterInvitation) {
            $rater = $emailLog->rater;
            if (! $rater || $rater->isSubmitted() || empty($rater->email)) {
                return false;
            }

            $emailLog->update([
                'status' => EmailLogStatus::Queued,
                'queued_at' => now(),
                'error_message' => null,
            ]);

            SendAssessmentInvitation::dispatch($rater, $emailLog->id);

            return true;
        }

        if ($emailLog->type === EmailLogType::ResultShare) {
            $participant = $emailLog->user;
            if (! $participant) {
                return false;
            }

            $emailLog->update([
                'status' => EmailLogStatus::Queued,
                'queued_at' => now(),
                'error_message' => null,
            ]);

            SendAssessmentResultPdfJob::dispatch($participant, $emailLog->id);

            return true;
        }

        if ($emailLog->type === EmailLogType::PasswordReset) {
            $target = $emailLog->user;
            if (! $target) {
                return false;
            }

            $emailLog->update([
                'status' => EmailLogStatus::Queued,
                'queued_at' => now(),
                'error_message' => null,
            ]);

            try {
                $token = Password::broker()->createToken($target);
                $target->sendPasswordResetNotification($token);

                $emailLog->update([
                    'status' => EmailLogStatus::Sent,
                    'sent_at' => now(),
                    'attempts' => ($emailLog->attempts ?? 0) + 1,
                ]);
            } catch (\Throwable $e) {
                $emailLog->update([
                    'status' => EmailLogStatus::Failed,
                    'failed_at' => now(),
                    'error_message' => $e->getMessage(),
                    'attempts' => ($emailLog->attempts ?? 0) + 1,
                ]);
            }

            return true;
        }

        if ($emailLog->type === EmailLogType::EmailVerification) {
            $target = $emailLog->user;
            if (! $target) {
                return false;
            }

            $emailLog->update([
                'status' => EmailLogStatus::Queued,
                'queued_at' => now(),
                'error_message' => null,
            ]);

            try {
                $target->notify(new VerifyEmail);

                $emailLog->update([
                    'status' => EmailLogStatus::Sent,
                    'sent_at' => now(),
                    'attempts' => ($emailLog->attempts ?? 0) + 1,
                ]);
            } catch (\Throwable $e) {
                $emailLog->update([
                    'status' => EmailLogStatus::Failed,
                    'failed_at' => now(),
                    'error_message' => $e->getMessage(),
                    'attempts' => ($emailLog->attempts ?? 0) + 1,
                ]);
            }

            return true;
        }

        return false;
    }
}
