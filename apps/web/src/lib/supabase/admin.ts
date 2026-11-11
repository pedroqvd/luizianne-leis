import { createClient, SupabaseClient } from '@supabase/supabase-js';

if (typeof window !== 'undefined') {
  throw new Error('SECURITY: createAdminClient() só pode ser importado e executado no servidor.');
}

/**
 * Singleton admin client (service_role / secret_key) — exclusivo para Server Components e Server Actions.
 * Compatível tanto com as novas variáveis do Supabase (SUPABASE_URL + SUPABASE_SECRET_KEY)
 * quanto com as variáveis clássicas (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 */
let cachedAdmin: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;

  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!;
  const secretKey = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!;

  cachedAdmin = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cachedAdmin;
}
