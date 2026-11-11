import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = (
    process.env.NEXT_PUBLIC_API_URL ||
    'https://luizianne-leis.onrender.com'
  ).replace(/\/+$/, '');

  try {
    const res = await fetch(`${base}/api/admin/auto-sync`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(9_000),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: res.ok, status: res.status, backend: data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, wakingUp: true, message: e?.message ?? 'Waking up Render instance' },
      { status: 202 },
    );
  }
}
