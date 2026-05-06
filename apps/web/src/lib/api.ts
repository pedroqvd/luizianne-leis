const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const TIMEOUT_MS = 8_000; // must stay below Vercel Hobby's 10s function limit

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/api${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...((init?.headers as Record<string, string>) ?? {}) },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

export const fetcher = (path: string) => api<any>(path);
