export { getApiBaseUrl, buildEndpointUrl } from './api-url';
import { buildEndpointUrl } from './api-url';

const TIMEOUT_MS = typeof window !== 'undefined' ? 30_000 : 14_000;

/**
 * Frontend API client com Bearer token automático, retry inteligente e erros tipados.
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
    if (typeof window !== 'undefined') {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    } else {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    }
  } catch {
    return null;
  }
}

export async function api<T>(path: string, init?: RequestInit, retries = 1): Promise<T> {
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

    const url = buildEndpointUrl(path);
    const res = await fetch(url, {
      ...init,
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });

    // Se o backend estiver acordando (502/503/504) e ainda tivermos tentativas, tenta novamente após 1s
    if ((res.status === 502 || res.status === 503 || res.status === 504) && retries > 0) {
      clearTimeout(timer);
      await new Promise((r) => setTimeout(r, 1200));
      return api<T>(path, init, retries - 1);
    }

    if (!res.ok) {
      let detail: string | undefined;
      try {
        const body = await res.json();
        detail = body?.message ?? body?.error;
      } catch { /* body não é JSON */ }

      if (typeof window === 'undefined') {
        console.warn(`[api-client] ${res.status} from ${url}:`, detail ?? 'unknown error');
      }

      throw new ApiError(
        res.status,
        path,
        detail ?? `API ${res.status}: ${path}`,
      );
    }

    return res.json() as Promise<T>;
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === 'AbortError') {
      if (retries > 0) {
        clearTimeout(timer);
        return api<T>(path, init, retries - 1);
      }
      throw new ApiError(408, path, `Request timeout (${TIMEOUT_MS}ms): ${path}`);
    }
    // Network / cold-start error
    if (retries > 0) {
      clearTimeout(timer);
      await new Promise((r) => setTimeout(r, 1200));
      return api<T>(path, init, retries - 1);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
