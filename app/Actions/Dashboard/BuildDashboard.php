<?php

namespace App\Actions\Dashboard;

use App\Enums\EmailLogStatus;
use App\Enums\RaterRole;
use App\Enums\UserRole;
use App\Models\EmailLog;
use App\Models\Rater;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Activitylog\Models\Activity;

class BuildDashboard
{
    public const STALE_AFTER_DAYS = 7;

    /**
     * @return array{
     *     kpi: array{active: int, not_started: int, in_progress: int, completed: int, completion_rate: int},
     *     roles: list<array{role: string, label: string, submitted: int, total: int}>,
     *     dimensions: list<array{id: int, name: string, average: float, answers: int}>,
     *     recent_assessments: list<array{id: int, participant: string, role: string, submitted_at: string}>,
     *     recent_activity: list<array{id: int, actor: string, description: string, subject: string, at: string}>,
     *     attention: list<array{key: string, label: string, count: int, tone: string}>
     * }
     */
    public function handle(): array
    {
        $participantIds = User::query()->active()->role(UserRole::Participant->value)->select('users.id');

        $perParticipant = Rater::query()
            ->whereIn('participant_id', $participantIds)
            ->groupBy('participant_id')
            ->selectRaw('count(*) as total, count(submitted_at) as submitted')
            ->get();

        $active = (clone $participantIds)->count();
        $completed = $perParticipant->filter(fn ($row) => $row->submitted === $row->total)->count();
        $inProgress = $perParticipant->count() - $completed;
        $notStarted = $active - $perParticipant->count();

        return [
            'kpi' => [
                'active' => $active,
                'not_started' => $notStarted,
                'in_progress' => $inProgress,
                'completed' => $completed,
                'completion_rate' => $active === 0 ? 0 : (int) round($completed / $active * 100),
            ],
            'roles' => $this->roles($participantIds),
            'dimensions' => $this->dimensions(),
            'recent_assessments' => $this->recentAssessments(),
            'recent_activity' => $this->recentActivity(),
            'attention' => $this->attention($participantIds, $notStarted),
        ];
    }

    /**
     * Attention items only (navbar bell), without building the full dashboard.
     *
     * @return list<array{key: string, label: string, count: int, tone: string}>
     */
    public function attentionItems(): array
    {
        $participantIds = User::query()->active()->role(UserRole::Participant->value)->select('users.id');
        $withRaters = Rater::query()->whereIn('participant_id', $participantIds)->distinct()->count('participant_id');

        return $this->attention($participantIds, (clone $participantIds)->count() - $withRaters);
    }

    /**
     * @return list<array{role: string, label: string, submitted: int, total: int}>
     */
    private function roles($participantIds): array
    {
        $rows = Rater::query()
            ->whereIn('participant_id', $participantIds)
            ->groupBy('role')
            ->selectRaw('role, count(*) as total, count(submitted_at) as submitted')
            ->get()
            ->keyBy(fn ($row) => $row->role->value);

        return array_map(fn (RaterRole $role) => [
            'role' => $role->value,
            'label' => $role->label(),
            'submitted' => (int) ($rows[$role->value]->submitted ?? 0),
            'total' => (int) ($rows[$role->value]->total ?? 0),
        ], RaterRole::cases());
    }

    /**
     * Rata-rata jawaban (skala 1-6) per dimensi aktif, hanya dari penilai yang sudah submit.
     *
     * @return list<array{id: int, name: string, average: float, answers: int}>
     */
    private function dimensions(): array
    {
        return DB::table('answers')
            ->join('raters', 'raters.id', '=', 'answers.rater_id')
            ->join('questions', 'questions.id', '=', 'answers.question_id')
            ->join('sub_dimensions', 'sub_dimensions.id', '=', 'questions.sub_dimension_id')
            ->join('dimensions', 'dimensions.id', '=', 'sub_dimensions.dimension_id')
            ->whereNotNull('raters.submitted_at')
            ->whereNull('questions.deleted_at')
            ->where('dimensions.is_active', true)
            ->groupBy('dimensions.id', 'dimensions.name', 'dimensions.sort_order')
            ->orderBy('dimensions.sort_order')
            ->selectRaw('dimensions.id, dimensions.name, avg(answers.value) as average, count(*) as answers')
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'name' => $row->name,
                'average' => round((float) $row->average, 2),
                'answers' => (int) $row->answers,
            ])
            ->all();
    }

    /**
     * @return list<array{id: int, participant: string, role: string, submitted_at: string}>
     */
    private function recentAssessments(): array
    {
        return Rater::query()
            ->submitted()
            ->with('participant:id,name')
            ->latest('submitted_at')
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(fn (Rater $rater) => [
                'id' => $rater->id,
                'participant' => $rater->participant?->name ?? '-',
                'role' => $rater->role->label(),
                'submitted_at' => $rater->submitted_at->toIso8601String(),
            ])
            ->all();
    }

    /**
     * @return list<array{id: int, actor: string, description: string, subject: string, at: string}>
     */
    private function recentActivity(): array
    {
        return Activity::query()
            ->with('causer')
            ->latest()
            ->latest('id')
            ->limit(8)
            ->get()
            ->map(fn (Activity $activity) => [
                'id' => $activity->id,
                'actor' => $activity->causer?->name ?? 'Sistem',
                'description' => (string) $activity->description,
                'subject' => $activity->subject_type ? class_basename($activity->subject_type) : '-',
                'at' => $activity->created_at->toIso8601String(),
            ])
            ->all();
    }

    /**
     * @return list<array{
     *     key: string,
     *     label: string,
     *     count: int,
     *     tone: string,
     *     details: list<array<string, mixed>>
     * }>
     */
    private function attention($participantIds, int $notStarted): array
    {
        $staleBefore = now()->subDays(self::STALE_AFTER_DAYS);
        $overdueBefore = now()->subDays(2);

        // 1. Email gagal terkirim (7 hari terakhir)
        $failedEmailsQuery = EmailLog::query()
            ->where('status', EmailLogStatus::Failed)
            ->where('created_at', '>=', $staleBefore);

        $failedEmailsCount = (clone $failedEmailsQuery)->count();
        $failedEmailsDetails = $failedEmailsQuery
            ->with(['user.participantProfile.company'])
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(function (EmailLog $log) {
                $user = $log->user;
                $profile = $user?->participantProfile;

                return [
                    'id' => $log->id,
                    'participant_id' => $user?->id,
                    'participant_name' => $user?->name ?? 'Sistem / Umum',
                    'company' => $profile?->company?->name ?? 'Tidak ada data perusahaan',
                    'position' => $profile?->position ?? '-',
                    'recipient_email' => $log->recipient_email,
                    'error_message' => $log->error_message ? Str::limit($log->error_message, 80) : 'Pengiriman gagal',
                    'detail_url' => $user ? "/admin/participants/{$user->id}" : '/admin/email-logs',
                ];
            })
            ->all();

        // 2. Penilai belum mengisi lebih dari 2 hari
        $staleRatersQuery = Rater::query()
            ->pending()
            ->whereIn('participant_id', $participantIds)
            ->where('created_at', '<', $overdueBefore);

        $staleRatersCount = (clone $staleRatersQuery)->count();
        $staleRatersDetails = $staleRatersQuery
            ->with(['participant.participantProfile.company'])
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(function (Rater $rater) {
                $participant = $rater->participant;
                $profile = $participant?->participantProfile;

                return [
                    'id' => $rater->id,
                    'participant_id' => $participant?->id,
                    'participant_name' => $participant?->name ?? 'Peserta',
                    'company' => $profile?->company?->name ?? 'Belum ada perusahaan',
                    'position' => $profile?->position ?? '-',
                    'rater_role' => $rater->role->label(),
                    'rater_email' => $rater->email ?? '-',
                    'days_pending' => (int) ($rater->created_at ? $rater->created_at->diffInDays(now()) : 0),
                    'detail_url' => $participant ? "/admin/participants/{$participant->id}" : null,
                ];
            })
            ->all();

        // 3. Peserta aktif belum punya penilai
        $notStartedQuery = User::query()
            ->active()
            ->role(UserRole::Participant->value)
            ->whereNotIn('id', Rater::query()->select('participant_id'));

        $notStartedCount = (clone $notStartedQuery)->count();
        $notStartedDetails = $notStartedQuery
            ->with(['participantProfile.company'])
            ->latest('id')
            ->limit(10)
            ->get()
            ->map(function (User $user) {
                $profile = $user->participantProfile;

                return [
                    'id' => $user->id,
                    'participant_id' => $user->id,
                    'participant_name' => $user->name,
                    'company' => $profile?->company?->name ?? 'Belum ada perusahaan',
                    'position' => $profile?->position ?? '-',
                    'email' => $user->email,
                    'detail_url' => "/admin/participants/{$user->id}",
                ];
            })
            ->all();

        $items = [
            [
                'key' => 'failed_emails',
                'label' => 'Email gagal terkirim (7 hari terakhir)',
                'tone' => 'danger',
                'count' => $failedEmailsCount,
                'details' => $failedEmailsDetails,
            ],
            [
                'key' => 'stale_raters',
                'label' => 'Penilai belum mengisi lebih dari 2 hari',
                'tone' => 'warning',
                'count' => $staleRatersCount,
                'details' => $staleRatersDetails,
            ],
            [
                'key' => 'not_started',
                'label' => 'Peserta aktif belum punya penilai',
                'tone' => 'info',
                'count' => $notStartedCount,
                'details' => $notStartedDetails,
            ],
        ];

        return array_values(array_filter($items, fn (array $item) => $item['count'] > 0));
    }
}
