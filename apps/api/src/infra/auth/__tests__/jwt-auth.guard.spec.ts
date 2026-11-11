/**
 * Testes unitários para JwtAuthGuard.
 * Cobre: @Public() bypass, token ausente, validação HMAC-SHA256 local, token expirado, e fallback API.
 */
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as crypto from 'node:crypto';

const originalEnv = process.env;
const TEST_SECRET = 'test-secret-key-for-unit-tests';

function signHmacJwt(payload: Record<string, unknown>, secret = TEST_SECRET): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${sig}`;
}

describe('JwtAuthGuard', () => {
  let guard: any;
  let reflector: Reflector;

  beforeEach(async () => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      SUPABASE_JWT_SECRET: TEST_SECRET,
    };
    reflector = new Reflector();
    const { JwtAuthGuard } = await import('../jwt-auth.guard');
    guard = new JwtAuthGuard(reflector);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function mockContext(
    headers: Record<string, string> = {},
    isPublic = false,
    query: Record<string, string> = {},
  ): ExecutionContext {
    const request = { headers, query, user: undefined };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);
    return context;
  }

  it('should allow @Public() endpoints without token', async () => {
    const ctx = mockContext({}, true);
    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('should reject requests without Authorization header', async () => {
    const ctx = mockContext({});
    await expect(guard.canActivate(ctx)).rejects.toThrow('Token de autenticação ausente');
  });

  it('should reject requests with invalid Bearer format', async () => {
    const ctx = mockContext({ authorization: 'Basic abc123' });
    await expect(guard.canActivate(ctx)).rejects.toThrow('Token de autenticação ausente');
  });

  it('should reject requests with invalid JWT structure', async () => {
    const ctx = mockContext({ authorization: 'Bearer not-a-jwt' });
    await expect(guard.canActivate(ctx)).rejects.toThrow('Token inválido ou expirado');
  });

  it('should validate a properly signed HMAC-SHA256 JWT locally without network calls', async () => {
    const token = signHmacJwt({
      sub: 'user-uuid-123',
      email: 'senadora@luizianne.leg.br',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const ctx = mockContext({ authorization: `Bearer ${token}` });
    expect(await guard.canActivate(ctx)).toBe(true);
    const req = ctx.switchToHttp().getRequest();
    expect(req.user.sub).toBe('user-uuid-123');
  });

  it('should reject an expired HMAC-SHA256 JWT', async () => {
    const expiredToken = signHmacJwt({
      sub: 'user-uuid-123',
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    const ctx = mockContext({ authorization: `Bearer ${expiredToken}` });
    await expect(guard.canActivate(ctx)).rejects.toThrow('Token inválido ou expirado');
  });

  it('should reject a JWT signed with the wrong secret', async () => {
    const forgedToken = signHmacJwt(
      { sub: 'attacker', exp: Math.floor(Date.now() / 1000) + 3600 },
      'wrong-secret',
    );
    const ctx = mockContext({ authorization: `Bearer ${forgedToken}` });
    await expect(guard.canActivate(ctx)).rejects.toThrow('Token inválido ou expirado');
  });

  it('should reject expired tokens or failed auth via API fallback', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: 'Unauthorized',
    });

    const ctx = mockContext({ authorization: `Bearer some-token` });
    await expect(guard.canActivate(ctx)).rejects.toThrow('Token inválido ou expirado');
  });

  it('should accept valid tokens via API fallback', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'user-123' }),
    });

    const ctx = mockContext({ authorization: `Bearer valid-token` });
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('http://localhost/auth/v1/user', expect.anything());
  });
});
