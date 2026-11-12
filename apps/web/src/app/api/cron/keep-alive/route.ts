import { NextResponse } from 'next/server';
import { buildEndpointUrl } from '@/lib/api-url';

export const dynamic = 'force-dynamic';

export async function GET() {
  const targetUrl = buildEndpointUrl('/admin/auto-sync');
  try {
    const res = await fetch(targetUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(9_000),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      targetUrl,
      env: {
        API_URL: process.env.API_URL ?? null,
        INTERNAL_API_URL: process.env.INTERNAL_API_URL ?? null,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? null,
      },
      backend: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        wakingUp: true,
        targetUrl,
        message: e?.message ?? 'Waking up Render instance',
      },
      { status: 202 },
    );
  }
}
