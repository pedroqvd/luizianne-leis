'use client';

export const dynamic = 'force-dynamic';

/**
 * Handles all Supabase auth callbacks:
 *
 *  1. Hash fragment  (#access_token=...&type=invite)  — invite / magic-link implicit flow.
 *     The hash is never sent to the server, so a server route.ts can't handle it.
 *     We read it here in the browser via window.location.hash.
 *
 *  2. Query param    (?code=...)                       — PKCE flow (newer Supabase default).
 *
 *  3. Query param    (?token_hash=...&type=...)        — Email OTP / custom invite templates.
 *
 * After establishing the session we create the app_users record (server action) and
 * redirect to /auth/set-password for invite flows, or / for everything else.
 */

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { setupUser } from '@/app/auth/actions';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { EmailOtpType } from '@supabase/supabase-js';
import Image from 'next/image';

export default function CallbackPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <CallbackHandler />
    </Suspense>
  );
}

function CallbackHandler() {
  const [errorMsg, setErrorMsg] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handle() {
      const supabase = createClient();

      // ── 1. Hash fragment (implicit / invite flow) ──────────────────────────
      const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const hashType = hashParams.get('type'); // 'invite' | 'recovery' | 'signup' | null

      // ── 2. Query params (PKCE / OTP flow) ──────────────────────────────────
      const code = searchParams.get('code');
      const tokenHash = searchParams.get('token_hash');
      const queryType = searchParams.get('type') as EmailOtpType | null;

      let userId: string | null = null;
      let userEmail: string | null = null;
      let userMeta: Record<string, any> = {};
      let isInvite = false;

      if (accessToken && refreshToken) {
        // Implicit / invite flow via hash fragment
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error || !data.user) {
          setErrorMsg('Link inválido ou expirado. Peça um novo convite.');
          return;
        }
        userId    = data.user.id;
        userEmail = data.user.email ?? null;
        userMeta  = data.user.user_metadata ?? {};
        isInvite  = hashType === 'invite';

      } else if (code) {
        // PKCE flow
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error || !data.user) {
          setErrorMsg('Link inválido ou expirado. Peça um novo convite.');
          return;
        }
        userId    = data.user.id;
        userEmail = data.user.email ?? null;
        userMeta  = data.user.user_metadata ?? {};
        isInvite  = queryType === 'invite';

      } else if (tokenHash && queryType) {
        // Email OTP / custom invite template with token_hash
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: queryType,
        });
        if (error || !data.user) {
          setErrorMsg('Link inválido ou expirado. Peça um novo convite.');
          return;
        }
        userId    = data.user.id;
        userEmail = data.user.email ?? null;
        userMeta  = data.user.user_metadata ?? {};
        isInvite  = queryType === 'invite';

      } else {
        setErrorMsg('Link inválido. Verifique se você clicou no link correto do e-mail.');
        return;
      }

      // ── Create / update app_users record ───────────────────────────────────
      if (userId && userEmail) {
        try {
          await setupUser({
            id: userId,
            email: userEmail,
            name: userMeta?.full_name ?? null,
          });
        } catch {
          // Non-fatal: user can still proceed; record will be created on next login
        }
      }

      // ── Redirect ───────────────────────────────────────────────────────────
      window.location.replace(isInvite ? '/auth/set-password' : '/');
    }

    handle();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-sidebar-bg flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="inline-block bg-white rounded-2xl px-6 py-4 shadow-lg mb-4">
              <Image src="/LOGO-LUIZIANNE-03.png" alt="Deputada Federal Luizianne" width={240} height={48} className="h-12 w-auto" />
            </div>
            <p className="text-slate-400 text-sm mt-1">Plataforma da Equipe</p>
          </div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Link inválido</h2>
            <p className="text-sm text-slate-500 mb-6">{errorMsg}</p>
            <a
              href="/login"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-brand-700 text-white text-sm font-medium hover:bg-brand-800 transition-colors"
            >
              Voltar ao login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <LoadingScreen />;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-sidebar-bg flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm animate-fade-in-up text-center">
        <div className="inline-block bg-white rounded-2xl px-6 py-4 shadow-lg mb-2">
          <Image src="/LOGO-LUIZIANNE-03.png" alt="Deputada Federal Luizianne" width={240} height={48} className="h-12 w-auto" />
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-brand-700 animate-spin" />
          <p className="text-sm font-medium text-slate-700">Verificando acesso…</p>
          <p className="text-xs text-slate-400">Aguarde um instante.</p>
        </div>
      </div>
    </div>
  );
}
