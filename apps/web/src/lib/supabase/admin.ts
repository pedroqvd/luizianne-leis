import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * FIX B5 (BAIXO): Singleton admin client — evita criar N instâncias por request.
 * O service_role client não tem sessão/cookies, então pode ser compartilhado.
 */
let cachedAdmin: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;

  cachedAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  return cachedAdmin;
}
