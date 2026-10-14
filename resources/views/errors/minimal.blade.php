@php
    $code = $code ?? ($exception?->getStatusCode() ?? 500);
    $title = $title ?? 'Terjadi Kesalahan';
    $message = $message ?? ($exception?->getMessage() ?: 'Halaman tidak dapat ditemukan atau terjadi kendala sistem.');
@endphp
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $code }} &middot; {{ $title }}</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700" rel="stylesheet" />
    <style>
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        :root {
            --bg: #fafafa;
            --surface: #ffffff;
            --border: #e4e4e7;
            --foreground: #09090b;
            --muted: #71717a;
            --primary: #18181b;
            --primary-foreground: #fafafa;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #09090b;
                --surface: #121215;
                --border: #27272a;
                --foreground: #fafafa;
                --muted: #a1a1aa;
                --primary: #fafafa;
                --primary-foreground: #18181b;
            }
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: var(--bg);
            color: var(--foreground);
            min-height: 100vh;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
        }

        main {
            width: 100%;
            max-width: 32rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .code-label {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--muted);
            margin-bottom: 1rem;
        }

        .icon-box {
            width: 3.5rem;
            height: 3.5rem;
            border-radius: 1rem;
            border: 1px solid var(--border);
            background: var(--surface);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
            color: var(--muted);
        }

        .icon-box svg {
            width: 1.5rem;
            height: 1.5rem;
            stroke-width: 2;
        }

        h1 {
            font-size: 1.625rem;
            font-weight: 700;
            letter-spacing: -0.025em;
            color: var(--foreground);
            margin-bottom: 0.75rem;
        }

        @media (min-width: 640px) {
            h1 {
                font-size: 1.875rem;
            }
        }

        p {
            font-size: 0.875rem;
            color: var(--muted);
            line-height: 1.6;
            margin-bottom: 2rem;
            max-width: 26rem;
        }

        @media (min-width: 640px) {
            p {
                font-size: 0.9375rem;
            }
        }

        .actions {
            display: flex;
            flex-direction: column-reverse;
            gap: 0.625rem;
            width: 100%;
        }

        @media (min-width: 640px) {
            .actions {
                flex-direction: row;
                justify-content: center;
                width: auto;
            }
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            font-size: 0.8125rem;
            font-weight: 500;
            padding: 0.5625rem 1.125rem;
            border-radius: 0.375rem;
            text-decoration: none;
            transition: all 0.15s ease;
            cursor: pointer;
            border: none;
            font-family: inherit;
        }

        .btn-primary {
            background-color: var(--primary);
            color: var(--primary-foreground);
        }

        .btn-primary:hover {
            opacity: 0.9;
        }

        .btn-outline {
            background-color: var(--surface);
            color: var(--foreground);
            border: 1px solid var(--border);
        }

        .btn-outline:hover {
            background-color: var(--border);
        }
    </style>
</head>
<body>
    <main>
        <div class="code-label">HTTP {{ $code }}</div>

        <div class="icon-box">
            @yield('icon')
        </div>

        <h1>{{ $title }}</h1>
        <p>{{ $message }}</p>

        <div class="actions">
            @hasSection('action-secondary')
                @yield('action-secondary')
            @else
                <button type="button" onclick="window.history.length > 1 ? window.history.back() : window.location.href='/'" class="btn btn-outline">
                    Kembali
                </button>
            @endif

            <a href="/" class="btn btn-primary">Ke Halaman Utama</a>
        </div>
    </main>
</body>
</html>
