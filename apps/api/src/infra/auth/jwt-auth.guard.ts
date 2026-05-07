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

/**
 * FIX #2 (CRÍTICO): Guard global de autenticação JWT.
 *
 * Valida o token JWT do Supabase no header Authorization.
 * Endpoints marcados com @Public() são ignorados.
 *
 * Em produção com Supabase, a verificação real deve usar:
 *   - A chave pública do Supabase para verificar assinatura RS256/HS256
 *   - Ou chamar supabase.auth.getUser() server-side
 *
 * Esta implementação verifica a assinatura HMAC do JWT usando SUPABASE_JWT_SECRET
 * (disponível em Supabase Dashboard → Settings → API → JWT Secret).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly jwtSecret = process.env.SUPABASE_JWT_SECRET;

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verifica se o endpoint está marcado como @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticação ausente');
    }

    const token = authHeader.slice(7);

    if (!this.jwtSecret) {
      // Se SUPABASE_JWT_SECRET não está configurado, logamos aviso mas permitimos
      // (para não quebrar ambientes de dev sem Supabase configurado)
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('SUPABASE_JWT_SECRET not configured in production — blocking request');
        throw new UnauthorizedException('Autenticação não configurada no servidor');
      }
      this.logger.warn('SUPABASE_JWT_SECRET not set — skipping JWT validation (dev mode)');
      return true;
    }

    try {
      const payload = this.verifyJwt(token);
      request.user = payload;
      return true;
    } catch (e: any) {
      this.logger.debug(`JWT validation failed: ${e.message}`);
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  /**
   * Verificação manual de JWT (HS256) para evitar dependência extra.
   * Em produção robusta, considerar usar jose ou @nestjs/jwt.
   */
  private verifyJwt(token: string): Record<string, any> {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT structure');

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verificar assinatura HMAC-SHA256
    const data = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto
      .createHmac('sha256', this.jwtSecret!)
      .update(data)
      .digest('base64url');

    // Normalizar a assinatura recebida para base64url
    const receivedSig = signatureB64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const expectedBuf = Buffer.from(expectedSig);
    const receivedBuf = Buffer.from(receivedSig);

    if (expectedBuf.length !== receivedBuf.length ||
        !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      throw new Error('Invalid signature');
    }

    // Decodificar payload
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf-8'),
    );

    // Verificar expiração
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return payload;
  }
}
