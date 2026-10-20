<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class RejectHtmlTags
{
    /** Pola deteksi tag HTML seperti <script>, </div>, <img src=x>, <!-- komentar -->, dll. */
    public const PATTERN = '/<\/?[a-z!][\s\S]*?>/i';

    public const MESSAGE = 'Input tidak boleh mengandung tag HTML.';

    /**
     * Tolak seluruh input string yang mengandung tag HTML di luar halaman login.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! in_array($request->method(), ['POST', 'PUT', 'PATCH'], true) || $this->isLoginRequest($request)) {
            return $next($request);
        }

        $errors = [];
        $this->inspectInputs($request->all(), '', $request, $errors);

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        return $next($request);
    }

    private function isLoginRequest(Request $request): bool
    {
        return $request->is('login', 'login/*', 'two-factor-challenge', 'register/check-email');
    }

    /**
     * @param  array<string|int, mixed>  $inputs
     * @param  array<string, string>  $errors
     */
    private function inspectInputs(array $inputs, string $prefix, Request $request, array &$errors): void
    {
        foreach ($inputs as $key => $value) {
            $field = $prefix === '' ? (string) $key : "$prefix.$key";

            if ($field === '_token' || $this->isSanitizedRichTextField($field, $request)) {
                continue;
            }

            if (is_array($value)) {
                $this->inspectInputs($value, $field, $request, $errors);

                continue;
            }

            if (is_string($value) && preg_match(self::PATTERN, $value) === 1) {
                $errors[$field] = self::MESSAGE;
            }
        }
    }

    /**
     * Editor rich-text pertanyaan admin memiliki sanitasi whitelist tag tersendiri di QuestionRequest.
     */
    private function isSanitizedRichTextField(string $field, Request $request): bool
    {
        return $field === 'text' && $request->is('admin/questions', 'admin/questions/*');
    }
}
