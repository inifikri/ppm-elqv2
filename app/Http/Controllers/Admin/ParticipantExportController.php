<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionName;
use App\Enums\RaterRole;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ParticipantExportController extends Controller
{
    public function __invoke(Request $request): StreamedResponse
    {
        Gate::authorize(PermissionName::ParticipantsView->value);

        $search = $request->query('search');
        $companyFilter = $request->query('company');
        $progressFilter = $request->query('progress');
        $statusFilter = $request->query('status');

        $query = User::query()
            ->role(UserRole::Participant->value)
            ->with([
                'participantProfile.company',
                'raters',
            ]);

        if ($search !== null && trim($search) !== '') {
            $like = '%'.addcslashes(trim($search), '\\%_').'%';
            $query->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like)
                    ->orWhereHas('participantProfile', fn ($p) => $p
                        ->where('position', 'like', $like)
                        ->orWhereHas('company', fn ($c) => $c->where('name', 'like', $like)));
            });
        }

        if ($companyFilter !== null && $companyFilter !== '') {
            $query->whereHas('participantProfile.company', fn ($c) => $c->where('name', $companyFilter));
        }

        if ($statusFilter !== null && $statusFilter !== '') {
            if ($statusFilter === 'active') {
                $query->where('is_active', true);
            } elseif ($statusFilter === 'inactive') {
                $query->where('is_active', false);
            }
        }

        if ($progressFilter !== null && $progressFilter !== '') {
            if ($progressFilter === 'not_started') {
                $query->whereDoesntHave('raters', fn ($r) => $r->whereNotNull('submitted_at'));
            } elseif ($progressFilter === 'completed') {
                $query->whereHas('raters')->whereDoesntHave('raters', fn ($r) => $r->whereNull('submitted_at'));
            } elseif ($progressFilter === 'in_progress') {
                $query->whereHas('raters', fn ($r) => $r->whereNotNull('submitted_at'))
                    ->whereHas('raters', fn ($r) => $r->whereNull('submitted_at'));
            }
        }

        $filename = 'daftar-peserta-'.now()->format('Y-m-d_His').'.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, [
                'ID',
                'Nama',
                'Email',
                'Telepon',
                'Perusahaan',
                'Jabatan',
                'Status Akun',
                'Self',
                'Atasan',
                'Bawahan',
                'Total Selesai',
                'Total Penilai',
                'Status Progres',
                'Terakhir Diperbarui',
            ]);

            $query->chunk(100, function ($participants) use ($handle) {
                foreach ($participants as $user) {
                    $raters = $user->raters;
                    $selfRater = $raters->firstWhere('role', RaterRole::SelfRater);
                    $bossRater = $raters->firstWhere('role', RaterRole::Boss);
                    $subRaters = $raters->where('role', RaterRole::Subordinate);

                    $selfSub = $selfRater?->isSubmitted() ? 'Selesai' : 'Belum';
                    $bossSub = $bossRater?->isSubmitted() ? 'Selesai' : 'Belum';
                    $subCount = $subRaters->whereNotNull('submitted_at')->count();
                    $subTotal = $subRaters->count();

                    $totalSubmitted = $raters->whereNotNull('submitted_at')->count();
                    $totalRaters = $raters->count();

                    $progressText = 'Belum Mulai';
                    if ($totalRaters > 0 && $totalSubmitted >= $totalRaters) {
                        $progressText = 'Selesai';
                    } elseif ($totalSubmitted > 0) {
                        $progressText = 'Sedang Berjalan';
                    }

                    fputcsv($handle, [
                        $user->id,
                        $user->name,
                        $user->email,
                        $user->phone ?? '-',
                        $user->participantProfile?->company?->name ?? '-',
                        $user->participantProfile?->position ?? '-',
                        $user->is_active ? 'Aktif' : 'Nonaktif',
                        $selfSub,
                        $bossSub,
                        "{$subCount}/{$subTotal}",
                        $totalSubmitted,
                        $totalRaters,
                        $progressText,
                        $user->updated_at->format('Y-m-d H:i:s'),
                    ]);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'no-store, no-cache',
        ]);
    }
}
