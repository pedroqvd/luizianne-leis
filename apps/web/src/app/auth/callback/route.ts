import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  const redirectTo = new URL(next, origin);
  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options ?? {}),
          );
        },
      },
    },
  );

  let user: { id: string; email?: string; user_metadata?: Record<string, any> } | null = null;
  let authError: unknown = null;

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    user = data?.user ?? null;
    authError = error;
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    user = data?.user ?? null;
    authError = error;
  }

  if (!authError && user) {
    const admin = createAdminClient();
    const adminEmail = process.env.ADMIN_EMAIL;

    const { count } = await admin
      .from('app_users')
      .select('*', { count: 'exact', head: true });

    const isFirstUser = count === 0;
    const isAdminEmail = adminEmail && user.email === adminEmail;
    const role = isFirstUser || isAdminEmail ? 'admin' : 'member';

    await admin.from('app_users').upsert({
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name ?? user.email!.split('@')[0],
      role,
    }, { onConflict: 'id', ignoreDuplicates: false });

    const { data: areas } = await admin.from('notification_areas').select('id');
    if (areas?.length) {
      await admin.from('user_subscriptions').upsert(
        areas.map((a) => ({ user_id: user!.id, area_id: a.id, enabled: false })),
        { onConflict: 'user_id,area_id', ignoreDuplicates: true },
      );
    }

    // Invite flow: redirect to password setup instead of the app
    if (type === 'invite') {
      response.headers.set('location', `${origin}/auth/set-password`);
      return response;
    }

    return response;
  }

  return NextResponse.redirect(new URL('/login?error=auth', origin));
}
