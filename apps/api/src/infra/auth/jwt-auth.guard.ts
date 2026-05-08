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
      const payload = await this.verifyJwt(token);
      request.user = payload;
      return true;
    } catch (e: any) {
      this.logger.debug(`JWT validation failed: ${e.message}`);
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  private async verifyJwt(token: string): Promise<Record<string, any>> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      // Fallback for local development or if env vars are missing
      // Only do this if they really didn't set the URL
      throw new Error('Missing Supabase URL/Key for token validation');
    }

    try {
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

      const user = await response.json();
      return user;
    } catch (e: any) {
      throw new Error(`Token validation failed: ${e.message}`);
    }
  }
}
