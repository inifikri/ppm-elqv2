<?php

namespace App\Http\Controllers\Participant;

use App\Actions\Participant\SaveAnswer;
use App\Actions\Participant\SubmitSelfAssessment;
use App\Http\Controllers\Controller;
use App\Http\Requests\Participant\SaveAnswerRequest;
use App\Models\Answer;
use App\Models\Question;
use App\Services\Participant\ParticipantFlowResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParticipantAssessmentController extends Controller
{
    /**
     * Tampilan pengerjaan kuesioner self-assessment 39 pertanyaan.
     */
    public function show(Request $request, ParticipantFlowResolver $flowResolver): Response|RedirectResponse
    {
        $flow = $flowResolver->resolve($request->user());

        if ($flow['state'] !== ParticipantFlowResolver::STATE_ASSESSMENT_RUN) {
            return to_route('dashboard');
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
            ->where('rater_id', $flow['self_rater']->id)
            ->pluck('value', 'question_id')
            ->mapWithKeys(fn ($val, $key) => [(string) $key => (int) $val])
            ->all();

        return Inertia::render('participant/assessment/run', [
            'questions' => $questions,
            'initialAnswers' => $answers,
            'initialIndex' => $flow['first_unanswered_index'],
            'participant' => [
                'name' => $request->user()->name,
                'email' => $request->user()->email,
            ],
        ]);
    }

    /**
     * Autosave jawaban per butir pertanyaan.
     */
    public function saveAnswer(SaveAnswerRequest $request, SaveAnswer $action): JsonResponse
    {
        $result = $action->handle($request->user(), $request->validated());

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Penyerahan final self-assessment setelah 39 butir terisi.
     */
    public function submit(Request $request, SubmitSelfAssessment $action): RedirectResponse
    {
        $action->handle($request->user());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Self-assessment berhasil dikirimkan. Terima kasih atas partisipasi Anda.',
        ]);

        return to_route('dashboard');
    }
}
