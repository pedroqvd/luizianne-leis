import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const admin = createAdminClient();
      const adminEmail = process.env.ADMIN_EMAIL;

      const { count } = await admin
        .from('app_users')
        .select('*', { count: 'exact', head: true });

      const isFirstUser = count === 0;
      const isAdminEmail = adminEmail && data.user.email === adminEmail;
      const role = isFirstUser || isAdminEmail ? 'admin' : 'member';

      await admin.from('app_users').upsert({
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.full_name ?? data.user.email!.split('@')[0],
        role,
      }, { onConflict: 'id', ignoreDuplicates: false });

      const { data: areas } = await admin.from('notification_areas').select('id');
      if (areas?.length) {
        await admin.from('user_subscriptions').upsert(
          areas.map((a) => ({ user_id: data.user!.id, area_id: a.id, enabled: false })),
          { onConflict: 'user_id,area_id', ignoreDuplicates: true },
        );
      }

      return response;
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', origin));
}
