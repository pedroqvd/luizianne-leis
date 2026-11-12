/**
 * Helpers universais e blindados para resolução da URL da API
 * (garante funcionamento correto tanto em SSR no Vercel quanto no browser do usuário).
 */

const PRODUCTION_API_URL = 'https://luizianne-leis.onrender.com';

export function getApiBaseUrl(): string {
  // 1. Execução no Navegador (Client-Side)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';

    // Se o usuário está acessando em produção (Vercel, domínio próprio, etc.),
    // NUNCA permita apontar para localhost:8000, mesmo que a env tenha sido copiada do .env.example
    if (!isLocalhost) {
      const configured = (process.env.NEXT_PUBLIC_API_URL ?? '').trim();
      if (configured && !configured.includes('localhost') && !configured.includes('127.0.0.1')) {
        return cleanUrl(configured);
      }
      return PRODUCTION_API_URL;
    }

    // Se o desenvolvedor está no localhost
    const configured = (process.env.NEXT_PUBLIC_API_URL ?? '').trim();
    return cleanUrl(configured || 'http://localhost:8000');
  }

  // 2. Execução no Servidor (Server-Side Rendering / Vercel Serverless)
  const isProductionEnv =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV);

  if (isProductionEnv) {
    const configured = (
      process.env.API_URL ||
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      ''
    ).trim();

    if (configured && !configured.includes('localhost') && !configured.includes('127.0.0.1')) {
      return cleanUrl(configured);
    }
    return PRODUCTION_API_URL;
  }

  // 3. Desenvolvimento local no servidor
  const local = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').trim();
  return cleanUrl(local);
}

function cleanUrl(url: string): string {
  return url.replace(/\/+$/, '').replace(/\/api$/, '');
}

/**
 * Constrói a URL canônica para qualquer endpoint da API, garantindo prefixo único /api.
 */
export function buildEndpointUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('/api/')) {
    return `${base}${cleanPath}`;
  }
  return `${base}/api${cleanPath}`;
}
