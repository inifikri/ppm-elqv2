<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanySuggestController extends Controller
{
    private const LIMIT = 8;

    public function __invoke(Request $request): JsonResponse
    {
        $term = Company::normalize((string) $request->query('q'));

        $names = mb_strlen($term) < 2 ? [] : Company::query()
            ->where('name_normalized', 'like', '%'.addcslashes($term, '\\%_').'%')
            ->orderByRaw('name_normalized like ? desc', [addcslashes($term, '\\%_').'%'])
            ->orderBy('name_normalized')
            ->limit(self::LIMIT)
            ->pluck('name');

        return response()->json(['data' => $names])->header('Cache-Control', 'private, max-age=60');
    }
}
