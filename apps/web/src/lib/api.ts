const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'content-type': 'application/json' },
    cache: 'no-store',
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const fetcher = (path: string) => api<any>(path);
