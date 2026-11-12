<?php

namespace App\Http\Controllers\Rater;

use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\Question;
use App\Models\Rater;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RaterEvaluationController extends Controller
{
    public const PREVIEW_ULID_BOSS = '01JABCDEFGHJKMNPQRSTVWXYZ0';

    public const PREVIEW_ULID_SUBORDINATE = '01JABCDEFGHJKMNPQRSTVWXYZ1';

    protected function isPreviewUlid(string $ulid): bool
    {
        return in_array($ulid, [self::PREVIEW_ULID_BOSS, self::PREVIEW_ULID_SUBORDINATE], true);
    }

    /**
     * Tampilkan kuesioner penilaian 360° untuk penilai via tautan ULID (tanpa login).
     */
    public function show(Request $request, string $ulid): Response|HttpResponse
    {
        $cleanUlid = trim(urldecode($ulid));

        // Dukungan mode simulasi interaktif untuk pengujian email template preview
        if ($this->isPreviewUlid($cleanUlid)) {
            $isBoss = $cleanUlid === self::PREVIEW_ULID_BOSS;
            $roleValue = $isBoss ? 'boss' : 'subordinate';
            $roleLabel = $isBoss ? 'Atasan Langsung' : 'Bawahan/Rekan';

            if ($request->boolean('preview_completed')) {
                return Inertia::render('evaluator/completed', [
                    'rater' => [
                        'ulid' => $cleanUlid,
                        'role' => $roleValue,
                        'role_label' => $roleLabel,
                        'email' => $isBoss ? 'atasan.contoh@perusahaan.co.id' : 'bawahan.contoh@perusahaan.co.id',
                        'submitted_at' => now()->translatedFormat('d F Y H:i'),
                    ],
                    'participant' => [
                        'name' => 'Budi Pratama, S.T., M.M.',
                        'company' => 'PT Semen Indonesia (Persero) Tbk',
                        'position' => 'Senior Vice President of Operations',
                    ],
                    'isPreview' => true,
                ]);
            }

            $questions = Question::query()
                ->with(['subDimension.dimension'])
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

            if ($questions->isEmpty()) {
                $questions = collect(range(1, 39))->map(fn ($num) => (object) [
                    'id' => $num,
                    'text' => "Contoh butir pernyataan kepemimpinan nomor {$num}.",
                    'sort_order' => $num,
                    'subDimension' => (object) [
                        'name' => 'Sub-Dimensi Contoh',
                        'dimension' => (object) ['name' => 'Dimensi Kepemimpinan'],
                    ],
                ]);
            }

            $formattedQuestions = $questions->map(fn ($q) => [
                'id' => $q->id,
                'text' => $q->text,
                'sort_order' => $q->sort_order,
                'sub_dimension_name' => is_object($q->subDimension) ? $q->subDimension?->name : null,
                'dimension_name' => is_object($q->subDimension?->dimension) ? $q->subDimension?->dimension?->name : null,
            ]);

            return Inertia::render('evaluator/assessment', [
                'rater' => [
                    'ulid' => $cleanUlid,
                    'role' => $roleValue,
                    'role_label' => $roleLabel,
                    'email' => $isBoss ? 'atasan.contoh@perusahaan.co.id' : 'bawahan.contoh@perusahaan.co.id',
                ],
                'participant' => [
                    'name' => 'Budi Pratama, S.T., M.M.',
                    'company' => 'PT Semen Indonesia (Persero) Tbk',
                    'position' => 'Senior Vice President of Operations',
                ],
                'questions' => $formattedQuestions,
                'initialAnswers' => [],
                'initialIndex' => 1,
                'isPreview' => true,
            ]);
        }

        $rater = Rater::query()
            ->with(['participant.participantProfile.company'])
            ->where('ulid', $cleanUlid)
            ->orWhere('legacy_code', $cleanUlid)
            ->orWhereRaw('LOWER(ulid) = ?', [strtolower($cleanUlid)])
            ->first();

        if (! $rater) {
            return response()->view('errors.link-unavailable', [], 404);
        }

        if ($rater->isSubmitted()) {
            return Inertia::render('evaluator/completed', [
                'rater' => [
                    'ulid' => $rater->ulid,
                    'role' => $rater->role->value,
                    'role_label' => $rater->role->label(),
                    'email' => $rater->email,
                    'submitted_at' => $rater->submitted_at?->translatedFormat('d F Y H:i'),
                ],
                'participant' => [
                    'name' => $rater->participant?->name ?? 'Peserta',
                    'company' => $rater->participant?->participantProfile?->company?->name,
                    'position' => $rater->participant?->participantProfile?->position,
                ],
            ]);
        }

        $questions = Question::query()
            ->with(['subDimension.dimension'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (Question $q) => [
                'id' => $q->id,
                'text' => $q->text,
                'sort_order' => $q->sort_order,
                'sub_dimension_name' => $q->subDimension?->name,
                'dimension_name' => $q->subDimension?->dimension?->name,
            ]);

        $answers = Answer::query()
            ->where('rater_id', $rater->id)
            ->pluck('value', 'question_id')
            ->mapWithKeys(fn ($val, $key) => [(string) $key => (int) $val])
            ->all();

        $firstUnansweredIndex = 1;
        $answeredQuestionIds = array_keys($answers);
        foreach ($questions as $index => $q) {
            if (! in_array((string) $q['id'], $answeredQuestionIds, true)) {
                $firstUnansweredIndex = $index + 1;
                break;
            }
        }

        if (count($answers) >= $questions->count() && $questions->isNotEmpty()) {
            $firstUnansweredIndex = $questions->count();
        }

        return Inertia::render('evaluator/assessment', [
            'rater' => [
                'ulid' => $rater->ulid,
                'role' => $rater->role->value,
                'role_label' => $rater->role->label(),
                'email' => $rater->email,
            ],
            'participant' => [
                'name' => $rater->participant?->name ?? 'Peserta',
                'company' => $rater->participant?->participantProfile?->company?->name,
                'position' => $rater->participant?->participantProfile?->position,
            ],
            'questions' => $questions,
            'initialAnswers' => $answers,
            'initialIndex' => $firstUnansweredIndex,
        ]);
    }

    /**
     * Autosave jawaban butir pertanyaan untuk penilai.
     */
    public function saveAnswer(Request $request, string $ulid): JsonResponse
    {
        $cleanUlid = trim(urldecode($ulid));

        if ($this->isPreviewUlid($cleanUlid)) {
            $validated = $request->validate([
                'question_id' => ['required', 'integer'],
                'value' => ['required', 'integer', 'min:1', 'max:6'],
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'question_id' => (int) $validated['question_id'],
                    'value' => (int) $validated['value'],
                    'saved_at' => now()->toIso8601String(),
                ],
            ]);
        }

        $rater = Rater::query()
            ->where('ulid', $cleanUlid)
            ->orWhere('legacy_code', $cleanUlid)
            ->orWhereRaw('LOWER(ulid) = ?', [strtolower($cleanUlid)])
            ->first();

        if (! $rater) {
            abort(404, 'Tautan penilai tidak ditemukan.');
        }

        if ($rater->isSubmitted()) {
            abort(422, 'Penilaian sudah diserahkan dan tidak dapat diubah.');
        }

        $validated = $request->validate([
            'question_id' => ['required', 'integer', 'exists:questions,id'],
            'value' => ['required', 'integer', 'min:1', 'max:6'],
        ]);

        $questionId = (int) $validated['question_id'];
        $value = (int) $validated['value'];

        Answer::updateOrCreate(
            [
                'rater_id' => $rater->id,
                'question_id' => $questionId,
            ],
            [
                'value' => $value,
            ]
        );

        return response()->json([
            'success' => true,
            'data' => [
                'question_id' => $questionId,
                'value' => $value,
                'saved_at' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Penyerahan final penilaian 360° oleh penilai.
     */
    public function submit(Request $request, string $ulid): RedirectResponse
    {
        $cleanUlid = trim(urldecode($ulid));

        if ($this->isPreviewUlid($cleanUlid)) {
            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'Simulasi penilaian pratinjau berhasil diserahkan.',
            ]);

            return to_route('rater.evaluation', ['ulid' => $cleanUlid, 'preview_completed' => 1]);
        }

        $rater = Rater::query()
            ->where('ulid', $cleanUlid)
            ->orWhere('legacy_code', $cleanUlid)
            ->orWhereRaw('LOWER(ulid) = ?', [strtolower($cleanUlid)])
            ->first();

        if (! $rater) {
            abort(404, 'Tautan penilai tidak ditemukan.');
        }

        if ($rater->isSubmitted()) {
            throw ValidationException::withMessages([
                'assessment' => 'Penilaian sudah pernah diserahkan.',
            ]);
        }

        $totalQuestions = Question::query()->count();
        $answeredCount = Answer::query()->where('rater_id', $rater->id)->count();

        if ($answeredCount < $totalQuestions) {
            throw ValidationException::withMessages([
                'assessment' => "Semua pertanyaan wajib dijawab ({$answeredCount}/{$totalQuestions} terjawab).",
            ]);
        }

        DB::transaction(function () use ($rater) {
            $locked = Rater::query()->whereKey($rater->id)->lockForUpdate()->first();

            if ($locked->submitted_at !== null) {
                throw ValidationException::withMessages([
                    'assessment' => 'Penilaian sudah pernah diserahkan.',
                ]);
            }

            $locked->update(['submitted_at' => now()]);

            activity('raters')
                ->performedOn($locked)
                ->log("Penilai ({$locked->role->label()}) menyerahkan kuesioner penilaian");
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Penilaian berhasil dikirimkan. Terima kasih atas partisipasi Anda.',
        ]);

        return to_route('rater.evaluation', ['ulid' => $ulid]);
    }
}
