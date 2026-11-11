import { createClient } from '@/lib/supabase/server';

const BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://luizianne-leis.onrender.com'
    : 'http://localhost:8000')
).replace(/\/+$/, '');
const TIMEOUT_MS = 9_000; // must stay below Vercel Hobby's 10s function limit

/**
 * Frontend API client com Bearer token automático e erros tipados.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    message?: string,
  ) {
    super(message ?? `API ${status}: ${path}`);
    this.name = 'ApiError';
  }

  get isUnauthorized() { return this.status === 401; }
  get isForbidden() { return this.status === 403; }
  get isRateLimited() { return this.status === 429; }
  get isServerError() { return this.status >= 500; }
  get isNotFound() { return this.status === 404; }
}

async function getAccessToken(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const token = await getAccessToken();
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      ...((init?.headers as Record<string, string>) ?? {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE}/api${path}`, {
      ...init,
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail: string | undefined;
      try {
        const body = await res.json();
        detail = body?.message ?? body?.error;
      } catch { /* body não é JSON */ }

      throw new ApiError(
        res.status,
        path,
        detail ?? `API ${res.status}: ${path}`,
      );
    }

    return res.json() as Promise<T>;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError(408, path, `Request timeout (${TIMEOUT_MS}ms): ${path}`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
