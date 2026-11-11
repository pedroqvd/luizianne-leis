import { NextResponse } from 'next/server';
import { buildEndpointUrl } from '@/lib/api-url';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(buildEndpointUrl('/admin/auto-sync'), {
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
