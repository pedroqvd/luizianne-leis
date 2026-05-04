'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('app error boundary:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-5">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>
      <h1 className="text-xl font-semibold text-slate-900 mb-2">
        Algo deu errado nesta página
      </h1>
      <p className="text-sm text-slate-500 max-w-md mb-1">
        Ocorreu um erro ao carregar este conteúdo. Pode ser uma instabilidade
        temporária do backend.
      </p>
      {error.digest && (
        <p className="text-xs text-slate-400 mb-6 font-mono">
          ref: {error.digest}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-700 text-white text-sm font-medium hover:bg-brand-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <Home className="w-4 h-4" /> Ir para o dashboard
        </Link>
      </div>
    </div>
  );
}
