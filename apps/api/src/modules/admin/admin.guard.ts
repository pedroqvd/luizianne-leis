import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const rawHeader = request.headers?.['x-admin-token'];
    const token = typeof rawHeader === 'string' ? rawHeader.trim() : '';

    const expected = process.env.ADMIN_TOKEN?.trim();
    if (!expected) throw new ForbiddenException('ADMIN_TOKEN não configurado no servidor');
    if (!token) throw new ForbiddenException('token ausente');

    const tokenBuf = Buffer.from(token, 'utf8');
    const expectedBuf = Buffer.from(expected, 'utf8');

    if (tokenBuf.length !== expectedBuf.length || !timingSafeEqual(tokenBuf, expectedBuf)) {
      throw new ForbiddenException('token inválido');
    }

    return true;
  }
}
