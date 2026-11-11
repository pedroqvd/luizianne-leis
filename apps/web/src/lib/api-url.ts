/**
 * Helpers universais e limpos para resolução da URL da API (usáveis tanto no servidor quanto no cliente).
 */

export function getApiBaseUrl(): string {
  const raw = (
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL || 'https://luizianne-leis.onrender.com')
      : (process.env.NODE_ENV === 'production'
          ? 'https://luizianne-leis.onrender.com'
          : 'http://localhost:8000'))
  ).trim();

  // Remove barras no final e /api redundante no final da base
  return raw.replace(/\/+$/, '').replace(/\/api$/, '');
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
