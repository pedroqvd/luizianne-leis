'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';

type Mode = 'magic' | 'password';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setLoading(false);
    if (error) {
      if (error.status === 429) {
        setError('Muitas tentativas. Aguarde alguns minutos ou use e-mail + senha.');
      } else {
        setError(`Erro: ${error.message}`);
      }
    } else {
      setSent(true);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (error) {
      setError('E-mail ou senha incorretos.');
    } else {
      window.location.href = '/';
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
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-700 rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">L</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Luizianne Lins</h1>
          <p className="text-slate-400 text-sm mt-1">Plataforma da Equipe</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!sent ? (
            <>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Acesso à plataforma</h2>

              {/* Tabs */}
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 mt-3">
                <button
                  type="button"
                  onClick={() => { setMode('magic'); setError(''); }}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${mode === 'magic' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Link por e-mail
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('password'); setError(''); }}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${mode === 'password' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  E-mail + senha
                </button>
              </div>

              {mode === 'magic' ? (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        className="input pl-10"
                      />
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
                  <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</> : 'Enviar link de acesso'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        className="input pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="input pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
                  <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando…</> : 'Entrar'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="text-center py-4 animate-fade-in-up">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Link enviado!</h2>
              <p className="text-slate-500 text-sm">
                Verifique sua caixa de entrada em{' '}
                <span className="font-medium text-slate-700">{email}</span>{' '}
                e clique no link para acessar a plataforma.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="mt-4 text-sm text-brand-700 hover:underline"
              >
                Usar outro e-mail
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Acesso restrito à equipe autorizada.
        </p>
      </div>
    </div>
  );
}
