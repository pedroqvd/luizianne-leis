'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, Loader2, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(`Erro: ${error.message} (${error.status ?? 'sem status'})`);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen bg-sidebar-bg flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-700 rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">L</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Luizianne Lins</h1>
          <p className="text-slate-400 text-sm mt-1">Plataforma da Equipe</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!sent ? (
            <>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Acesso à plataforma</h2>
              <p className="text-slate-500 text-sm mb-6">
                Digite seu e-mail e enviaremos um link de acesso.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    E-mail
                  </label>
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

                {error && (
                  <p className="text-sm text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</>
                  ) : (
                    'Enviar link de acesso'
                  )}
                </button>
              </form>
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
