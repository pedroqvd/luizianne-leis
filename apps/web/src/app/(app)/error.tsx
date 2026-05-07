'use client';

import { useEffect } from 'react';

/**
 * FIX F6 (MÉDIO): Error boundary melhorado com:
 * - Ação de retry (reset)
 * - Mensagens específicas para tipos de erro
 * - Exibição do digest para debug
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  // Detectar tipo de erro para mensagem mais útil
  const is401 = error.message?.includes('401') || error.message?.includes('Unauthorized');
  const is429 = error.message?.includes('429') || error.message?.includes('rate');
  const is5xx = error.message?.includes('500') || error.message?.includes('502') || error.message?.includes('503');

  let title = 'Algo deu errado nesta página';
  let description = 'Ocorreu um erro ao carregar este conteúdo. Pode ser uma instabilidade temporária do backend.';

  if (is401) {
    title = 'Sessão expirada';
    description = 'Sua sessão expirou. Faça login novamente para continuar.';
  } else if (is429) {
    title = 'Muitas requisições';
    description = 'O servidor está limitando requisições. Aguarde um momento e tente novamente.';
  } else if (is5xx) {
    title = 'Erro no servidor';
    description = 'O servidor está temporariamente indisponível. Tente novamente em alguns minutos.';
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="mx-auto max-w-md text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
        <p className="text-sm text-zinc-500">{description}</p>
        {error.digest && (
          <p className="font-mono text-xs text-zinc-400">ref: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            Tentar novamente
          </button>
          {is401 && (
            <a
              href="/login"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Fazer login
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
