<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkQuestionRequest;
use App\Models\Question;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class QuestionBulkController extends Controller
{
    /**
     * Soft delete (FR-027): jawaban lama tetap utuh. Tiap baris dihapus lewat model agar activity log tercatat.
     */
    public function __invoke(BulkQuestionRequest $request): RedirectResponse
    {
        $questions = Question::whereIn('id', $request->validated('ids'))->get();

        DB::transaction(fn () => $questions->each->delete());

        Inertia::flash('toast', ['type' => 'success', 'message' => $questions->count().' pertanyaan dihapus.']);

        return back();
    }
}
