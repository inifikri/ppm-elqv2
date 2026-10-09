<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexMasterDataRequest;
use App\Http\Requests\Admin\QuestionRequest;
use App\Models\Dimension;
use App\Models\Question;
use App\Models\SubDimension;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class QuestionController extends Controller
{
    public function index(IndexMasterDataRequest $request): Response
    {
        $like = $request->searchLike();
        $filters = $request->filters();

        return Inertia::render('admin/questions/index', [
            'questions' => Question::query()
                ->with('subDimension.dimension:id,name')
                ->when($like, fn ($q) => $q->where('text', 'like', $like))
                ->when($filters['dimension_id'], fn ($q, $id) => $q->whereHas('subDimension', fn ($s) => $s->where('dimension_id', $id)))
                ->orderBy('sub_dimension_id')->ordered()->orderBy('id')
                ->paginate(10)->withQueryString()
                ->through(fn (Question $q) => $this->row($q)),
            'filters' => $filters,
            'domains' => Dimension::ordered()->get(['id', 'name'])->map(fn ($d) => ['id' => $d->id, 'name' => $d->name]),
        ]);
    }

    public function create(IndexMasterDataRequest $request): Response
    {
        return Inertia::render('admin/questions/form', [
            'question' => null,
            'subDomains' => $this->subDomainOptions(),
            'defaultSubDomainId' => $request->integer('sub_dimension_id') ?: null,
        ]);
    }

    public function store(QuestionRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['sort_order'] ??= (int) Question::where('sub_dimension_id', $data['sub_dimension_id'])->max('sort_order') + 1;

        Question::create($data);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pertanyaan dibuat.']);

        return to_route('admin.questions.index');
    }

    public function edit(Question $question): Response
    {
        $question->load('subDimension.dimension:id,name');

        return Inertia::render('admin/questions/form', ['question' => $this->row($question), 'subDomains' => $this->subDomainOptions(), 'defaultSubDomainId' => null]);
    }

    public function update(QuestionRequest $request, Question $question): RedirectResponse
    {
        $data = $request->validated();
        $data['sort_order'] ??= $question->sort_order;

        $question->update($data);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pertanyaan diperbarui.']);

        return to_route('admin.questions.index');
    }

    public function destroy(Question $question): RedirectResponse
    {
        // Soft delete: jawaban lama tetap utuh.
        $question->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pertanyaan dihapus.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function row(Question $q): array
    {
        return [
            'id' => $q->id,
            'sub_dimension_id' => $q->sub_dimension_id,
            'sub_domain' => $q->subDimension?->name,
            'domain' => $q->subDimension?->dimension?->name,
            'text' => $q->text,
            'text_plain' => html_entity_decode(strip_tags(str_replace(['</p>', '</li>', '<br>'], ' ', $q->text))),
            'sort_order' => $q->sort_order,
        ];
    }

    /**
     * @return Collection<int, array{id: int, name: string, domain: string}>
     */
    private function subDomainOptions()
    {
        return SubDimension::with('dimension:id,name')
            ->orderBy('dimension_id')->ordered()->get()
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'domain' => $s->dimension->name]);
    }
}
