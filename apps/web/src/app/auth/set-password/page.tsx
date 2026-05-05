'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { setupUser } from '@/app/auth/actions';
import { Lock, Loader2, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';

export default function SetPasswordPage() {
  const [ready, setReady]       = useState(false); // session confirmed
  const [noSession, setNoSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);

  // Confirm there is an active session (set by the callback page).
  // If not, the invite link may have been opened in a different browser/tab.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        // Ensure app_users record exists (safety net if callback action failed)
        setupUser({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name ?? null,
        }).catch(() => {});
        setReady(true);
      } else {
        setNoSession(true);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      setError(`Não foi possível salvar a senha: ${error.message}`);
    } else {
      setDone(true);
      setTimeout(() => { window.location.replace('/'); }, 2000);
    }
  }

  return (
    <div className="min-h-screen bg-sidebar-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-2xl px-6 py-4 shadow-lg mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/LOGO-LUIZIANNE-03.png" alt="Deputada Federal Luizianne" className="h-12 w-auto" />
          </div>
          <p className="text-slate-400 text-sm mt-1">Plataforma da Equipe</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Session not found — link opened in different browser/tab */}
          {noSession && (
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 mb-2">Sessão não encontrada</h2>
              <p className="text-sm text-slate-500 mb-6">
                Abra o link do e-mail de convite no mesmo navegador e tente novamente.
              </p>
              <a
                href="/login"
                className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-brand-700 text-white text-sm font-medium hover:bg-brand-800 transition-colors"
              >
                Voltar ao login
              </a>
            </div>
          )}

          {/* Loading while checking session */}
          {!ready && !noSession && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="w-7 h-7 text-brand-700 animate-spin" />
              <p className="text-sm text-slate-500">Verificando sessão…</p>
            </div>
          )}

          {/* Success */}
          {done && (
            <div className="text-center py-4 animate-fade-in-up">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Senha definida!</h2>
              <p className="text-slate-500 text-sm">Redirecionando para a plataforma…</p>
            </div>
          )}

          {/* Form */}
          {ready && !done && (
            <>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Defina sua senha</h2>
              <p className="text-sm text-slate-500 mb-6">
                Crie uma senha para acessar a plataforma a partir de agora.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      minLength={8}
                      className="input pl-10 pr-10"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repita a senha"
                      required
                      className="input pl-10"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando…</>
                    : 'Definir senha e entrar'
                  }
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Acesso restrito à equipe autorizada.
        </p>
      </div>
    </div>
  );
}
