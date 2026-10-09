<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexMasterDataRequest;
use App\Http\Requests\Admin\SubDimensionRequest;
use App\Models\Dimension;
use App\Models\SubDimension;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class SubDimensionController extends Controller
{
    public function index(IndexMasterDataRequest $request): Response
    {
        $like = $request->searchLike();
        $filters = $request->filters();

        return Inertia::render('admin/sub-domains/index', [
            'subDomains' => SubDimension::query()
                ->with('dimension:id,name')
                ->withCount('questions')
                ->when($like, fn ($q) => $q->where('name', 'like', $like))
                ->when($filters['dimension_id'], fn ($q, $id) => $q->where('dimension_id', $id))
                ->orderBy('dimension_id')->ordered()->orderBy('id')
                ->paginate(10)->withQueryString()
                ->through(fn (SubDimension $s) => $this->row($s)),
            'filters' => $filters,
            'domains' => $this->domainOptions(),
        ]);
    }

    public function create(IndexMasterDataRequest $request): Response
    {
        return Inertia::render('admin/sub-domains/form', [
            'subDomain' => null,
            'domains' => $this->domainOptions(),
            'defaultDomainId' => $request->filters()['dimension_id'],
        ]);
    }

    public function store(SubDimensionRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['sort_order'] ??= (int) SubDimension::where('dimension_id', $data['dimension_id'])->max('sort_order') + 1;

        SubDimension::create($data);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sub domain dibuat.']);

        return to_route('admin.domains.show', $data['dimension_id']);
    }

    public function edit(SubDimension $subDimension): Response
    {
        return Inertia::render('admin/sub-domains/form', ['subDomain' => $this->row($subDimension), 'domains' => $this->domainOptions(), 'defaultDomainId' => null]);
    }

    public function update(SubDimensionRequest $request, SubDimension $subDimension): RedirectResponse
    {
        $data = $request->validated();
        $data['sort_order'] ??= $subDimension->sort_order;

        $subDimension->update($data);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sub domain diperbarui.']);

        return to_route('admin.domains.show', $subDimension->dimension_id);
    }

    public function destroy(SubDimension $subDimension): RedirectResponse
    {
        if ($subDimension->questions()->withTrashed()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Sub domain masih memiliki pertanyaan.']);

            return back();
        }

        $subDimension->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sub domain dihapus.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function row(SubDimension $s): array
    {
        return [
            'id' => $s->id,
            'dimension_id' => $s->dimension_id,
            'domain' => $s->dimension?->name,
            'name' => $s->name,
            'sort_order' => $s->sort_order,
            'questions_count' => $s->questions_count ?? null,
        ];
    }

    /**
     * @return Collection<int, array{id: int, name: string}>
     */
    private function domainOptions()
    {
        return Dimension::ordered()->get(['id', 'name'])->map(fn ($d) => ['id' => $d->id, 'name' => $d->name]);
    }
}
