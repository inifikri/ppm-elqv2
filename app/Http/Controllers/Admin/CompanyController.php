<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CompanyRequest;
use App\Http\Requests\Admin\IndexMasterDataRequest;
use App\Models\Company;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function index(IndexMasterDataRequest $request): Response
    {
        $like = $request->searchLike();

        return Inertia::render('admin/companies/index', [
            'companies' => Company::query()
                ->withCount('participantProfiles')
                ->when($like, fn ($q) => $q->where('name', 'like', $like))
                ->orderBy('name')
                ->paginate(10)->withQueryString()
                ->through(fn (Company $c) => $this->row($c)),
            'filters' => $request->filters(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/companies/form', ['company' => null]);
    }

    public function store(CompanyRequest $request): RedirectResponse
    {
        Company::create($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Perusahaan dibuat.']);

        return to_route('admin.companies.index');
    }

    public function edit(Company $company): Response
    {
        return Inertia::render('admin/companies/form', ['company' => $this->row($company)]);
    }

    public function update(CompanyRequest $request, Company $company): RedirectResponse
    {
        $company->update($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Perusahaan diperbarui.']);

        return to_route('admin.companies.index');
    }

    public function destroy(Company $company): RedirectResponse
    {
        if ($company->participantProfiles()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Perusahaan masih dipakai peserta.']);

            return back();
        }

        $company->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Perusahaan dihapus.']);

        return back();
    }

    /**
     * @return array{id: int, name: string, participants_count: int|null}
     */
    private function row(Company $c): array
    {
        return ['id' => $c->id, 'name' => $c->name, 'participants_count' => $c->participant_profiles_count ?? null];
    }
}
