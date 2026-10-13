<?php

namespace App\Http\Controllers\Participant;

use App\Actions\Participant\StoreEvaluators;
use App\Http\Controllers\Controller;
use App\Http\Requests\Participant\StoreEvaluatorsRequest;
use App\Services\Participant\ParticipantFlowResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParticipantEvaluatorController extends Controller
{
    /**
     * Form pengisian 1 email atasan dan 3 email bawahan.
     */
    public function create(Request $request, ParticipantFlowResolver $flowResolver): Response|RedirectResponse
    {
        $flow = $flowResolver->resolve($request->user());

        if ($flow['state'] !== ParticipantFlowResolver::STATE_SETUP_EVALUATORS) {
            return to_route('dashboard');
        }

        return Inertia::render('participant/evaluators/setup', [
            'participantEmail' => $request->user()->email,
        ]);
    }

    /**
     * Simpan penilai, buat row raters, dan jadwalkan pengiriman undangan email.
     */
    public function store(StoreEvaluatorsRequest $request, StoreEvaluators $action): RedirectResponse
    {
        $action->handle($request->user(), $request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Daftar penilai berhasil disimpan. Undangan penilaian telah dijadwalkan.',
        ]);

        return to_route('participant.assessment.run');
    }
}
