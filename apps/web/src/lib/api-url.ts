/**
 * Helpers universais e blindados para resolução da URL da API
 * (garante funcionamento correto tanto em SSR no Vercel quanto no browser do usuário).
 */

const PRODUCTION_API_URL = 'https://luizianne-leis.onrender.com';

/**
 * Valida se uma URL configurada pode ser um backend válido.
 * Rejeita localhost, domínios do Vercel (que são apenas o frontend) e domínios antigos/inválidos.
 */
function isValidApiHost(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1') || trimmed.includes('0.0.0.0')) {
    return false;
  }
  // Vercel hospeda APENAS a aplicação web Next.js; todas as rotas da API rodam no NestJS no Render.
  if (trimmed.includes('vercel.app')) {
    return false;
  }
  if (trimmed.includes('luizianne-api.onrender.com') || trimmed.includes('luizianne.onrender.com')) {
    return false;
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false;
  }
  return true;
}

export function getApiBaseUrl(): string {
  // 1. Execução no Navegador (Client-Side)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';

    // Se o usuário está acessando em produção (Vercel, domínio próprio, etc.),
    // garante apontar para o backend no Render, rejeitando localhost ou o próprio domínio do Vercel
    if (!isLocalhost) {
      const configured = (process.env.NEXT_PUBLIC_API_URL ?? '').trim();
      if (isValidApiHost(configured)) {
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

    if (isValidApiHost(configured)) {
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
