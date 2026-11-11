import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import * as crypto from 'node:crypto';

interface CachedUser {
  payload: Record<string, unknown>;
  expiresAt: number;
}

/**
 * Guard global de autenticação JWT (Supabase).
 *
 * 1. Valida localmente a assinatura HMAC-SHA256 usando SUPABASE_JWT_SECRET
 *    com comparação em tempo constante (timingSafeEqual) e checagem de expiração (exp).
 * 2. Possui fallback seguro para validação via API (/auth/v1/user) caso o projeto
 *    utilize chaves assimétricas (RS256/ES256), com cache em memória de curta duração (60s).
 * 3. Suporta extração do token via header Authorization: Bearer <token> ou query ?token= (para SSE).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly jwtSecret = process.env.SUPABASE_JWT_SECRET;
  private readonly verifiedCache = new Map<string, CachedUser>();
  private readonly MAX_CACHE_SIZE = 500;
  private readonly CACHE_TTL_MS = 60_000;

  private jwksCache: { keys: Array<Record<string, any>>; expiresAt: number } | null = null;

  constructor(private readonly reflector: Reflector) {}

  private resolveSupabaseUrl(): string | undefined {
    const explicit = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (explicit) return explicit.replace(/\/+$/, '');
    const jwks = process.env.SUPABASE_JWKS_URL;
    if (jwks) {
      const m = jwks.match(/^(https:\/\/[^/]+)/i);
      if (m) return m[1];
    }
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      const poolerMatch = dbUrl.match(/postgres\.([a-z0-9]{15,30})[:@]/i);
      if (poolerMatch) return `https://${poolerMatch[1]}.supabase.co`;
      const directMatch = dbUrl.match(/@db\.([a-z0-9]{15,30})\.supabase\.co/i);
      if (directMatch) return `https://${directMatch[1]}.supabase.co`;
    }
    return undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token de autenticação ausente');
    }

    const supabaseUrl = this.resolveSupabaseUrl();
    if (!this.jwtSecret && !supabaseUrl && !process.env.SUPABASE_JWKS_URL) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('SUPABASE_JWT_SECRET / SUPABASE_URL not configured in production — blocking request');
        throw new UnauthorizedException('Autenticação não configurada no servidor');
      }
      this.logger.warn('SUPABASE_JWT_SECRET not set — skipping JWT validation (dev mode)');
      return true;
    }

    try {
      const payload = await this.verifyJwt(token);
      request.user = payload;
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.debug(`JWT validation failed: ${msg}`);
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  private extractToken(request: Record<string, any>): string | null {
    const authHeader = request.headers?.['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      return token.length > 0 ? token : null;
    }

    const queryToken = request.query?.token;
    if (typeof queryToken === 'string' && queryToken.trim().length > 0) {
      return queryToken.trim();
    }

    return null;
  }

  private async verifyJwt(token: string): Promise<Record<string, unknown>> {
    // 1. Verificação local HMAC-SHA256 (zero latência de rede)
    if (this.jwtSecret) {
      const localResult = this.tryVerifyHmacJwt(token, this.jwtSecret);
      if (localResult === 'expired') {
        throw new Error('Token expired');
      }
      if (localResult) {
        return localResult;
      }
    }

    const supabaseUrl = this.resolveSupabaseUrl();

    // 2. Verificação via JWKS (para novos projetos Supabase com chaves assimétricas ES256/RS256)
    const jwksResult = await this.tryVerifyJwksJwt(token, supabaseUrl);
    if (jwksResult === 'expired') {
      throw new Error('Token expired');
    }
    if (jwksResult) {
      return jwksResult;
    }

    // 3. Fallback para validação remota no Supabase Auth API (/auth/v1/user)
    const anonKey =
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      throw new Error('Invalid JWT signature and no Supabase API fallback configured');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const cached = this.verifiedCache.get(tokenHash);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.payload;
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase auth failed: ${response.statusText}`);
    }

    const user = (await response.json()) as Record<string, unknown>;
    if (this.verifiedCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.verifiedCache.keys().next().value;
      if (oldestKey) this.verifiedCache.delete(oldestKey);
    }
    this.verifiedCache.set(tokenHash, {
      payload: user,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    return user;
  }

  private async tryVerifyJwksJwt(
    token: string,
    supabaseUrl?: string,
  ): Promise<Record<string, unknown> | 'expired' | null> {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    let header: Record<string, any>;
    try {
      header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    } catch {
      return null;
    }

    const alg = String(header.alg ?? '').toUpperCase();
    if (alg !== 'ES256' && alg !== 'RS256') return null;

    const jwksUrl =
      process.env.SUPABASE_JWKS_URL ??
      (supabaseUrl ? `${supabaseUrl}/auth/v1/.well-known/jwks.json` : undefined);
    if (!jwksUrl) return null;

    try {
      if (!this.jwksCache || this.jwksCache.expiresAt <= Date.now()) {
        const res = await fetch(jwksUrl);
        if (!res.ok) return null;
        const body = (await res.json()) as { keys?: Array<Record<string, any>> };
        this.jwksCache = {
          keys: Array.isArray(body.keys) ? body.keys : [],
          expiresAt: Date.now() + 3600_000,
        };
      }

      const jwk = this.jwksCache.keys.find((k) => !header.kid || k.kid === header.kid);
      if (!jwk) return null;

      const publicKey = crypto.createPublicKey({ key: jwk as crypto.JsonWebKey, format: 'jwk' });
      const verified = crypto.verify(
        'sha256',
        Buffer.from(`${headerB64}.${payloadB64}`),
        alg === 'ES256'
          ? { key: publicKey, dsaEncoding: 'ieee-p1363' }
          : publicKey,
        Buffer.from(signatureB64, 'base64url'),
      );
      if (!verified) return null;

      const payload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString('utf8'),
      ) as Record<string, unknown>;

      const nowSec = Math.floor(Date.now() / 1000);
      if (typeof payload.exp === 'number' && payload.exp < nowSec) {
        return 'expired';
      }
      return payload;
    } catch {
      return null;
    }
  }

  private tryVerifyHmacJwt(
    token: string,
    secret: string,
  ): Record<string, unknown> | 'expired' | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    try {
      const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64url');

      const sigBuf = Buffer.from(signatureB64);
      const expectedBuf = Buffer.from(expectedSig);

      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return null;
      }

      const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
      const payload = JSON.parse(payloadJson) as Record<string, unknown>;

      const nowSec = Math.floor(Date.now() / 1000);
      if (typeof payload.exp === 'number' && payload.exp < nowSec) {
        return 'expired';
      }
      if (typeof payload.nbf === 'number' && payload.nbf > nowSec + 30) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }
}
