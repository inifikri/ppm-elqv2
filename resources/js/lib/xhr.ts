/** fetch JSON dengan CSRF (cookie XSRF-TOKEN), sama seperti halaman login. */
export async function xhr<T = Record<string, unknown>>(
    url: string,
    init: {
        method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
        body?: object;
        signal?: AbortSignal;
    } = {},
): Promise<[number, T]> {
    const token = decodeURIComponent(
        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
    );
    const res = await fetch(url, {
        method: init.method ?? 'GET',
        signal: init.signal,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': token,
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: init.body ? JSON.stringify(init.body) : undefined,
    });

    return [res.status, (await res.json().catch(() => ({}))) as T];
}
