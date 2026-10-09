<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DimensionRequest;
use App\Http\Requests\Admin\IndexMasterDataRequest;
use App\Models\Dimension;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DimensionController extends Controller
{
    public function index(IndexMasterDataRequest $request): Response
    {
        $like = $request->searchLike();

        return Inertia::render('admin/domains/index', [
            'domains' => Dimension::query()
                ->withCount('subDimensions')
                ->when($like, fn ($q) => $q->where('name', 'like', $like))
                ->ordered()->orderBy('id')
                ->paginate(10)->withQueryString()
                ->through(fn (Dimension $d) => $this->row($d)),
            'filters' => $request->filters(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/domains/form', ['domain' => null]);
    }

    public function store(DimensionRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['sort_order'] ??= (int) Dimension::max('sort_order') + 1;

        $dimension = Dimension::create($data);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Domain dibuat.']);

        return to_route('admin.domains.show', $dimension);
    }

    public function show(Dimension $dimension): Response
    {
        $dimension->load(['subDimensions' => fn ($q) => $q->ordered()->orderBy('id')->with(['questions' => fn ($q) => $q->ordered()->orderBy('id')])]);

        return Inertia::render('admin/domains/show', [
            'domain' => [
                ...$this->row($dimension),
                'sub_domains' => $dimension->subDimensions->map(fn ($sub) => [
                    'id' => $sub->id,
                    'name' => $sub->name,
                    'questions' => $sub->questions->map(fn ($q) => ['id' => $q->id, 'text' => html_entity_decode(strip_tags(str_replace(['</p>', '</li>', '<br>'], ' ', $q->text)))])->values(),
                ])->values(),
            ],
        ]);
    }

    public function edit(Dimension $dimension): Response
    {
        return Inertia::render('admin/domains/form', ['domain' => $this->row($dimension)]);
    }

    public function update(DimensionRequest $request, Dimension $dimension): RedirectResponse
    {
        $data = $request->validated();
        $data['sort_order'] ??= $dimension->sort_order;

        $dimension->update($data);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Domain diperbarui.']);

        return to_route('admin.domains.show', $dimension);
    }

    public function destroy(Dimension $dimension): RedirectResponse
    {
        // FK restrict juga menghitung sub domain yang sudah soft-deleted.
        if ($dimension->subDimensions()->withTrashed()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Domain masih memiliki sub domain. Nonaktifkan saja bila tidak dipakai.']);

            return back();
        }

        $dimension->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Domain dihapus.']);

        return to_route('admin.domains.index');
    }

    /**
     * @return array{id: int, name: string, sort_order: int, is_active: bool, sub_domains_count: int|null}
     */
    private function row(Dimension $d): array
    {
        return [
            'id' => $d->id,
            'name' => $d->name,
            'sort_order' => $d->sort_order,
            'is_active' => $d->is_active,
            'sub_domains_count' => $d->sub_dimensions_count ?? null,
        ];
    }
}
