/**
 * FIX #23: Testes unitários para JwtAuthGuard.
 * Cobre: @Public() bypass, token ausente, token expirado, token válido.
 */
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as crypto from 'node:crypto';

// Mock do environment
const originalEnv = process.env;

describe('JwtAuthGuard', () => {
  let guard: any;
  let reflector: Reflector;

  // Dynamic import para permitir mock de env vars
  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'production', SUPABASE_JWT_SECRET: 'test-secret-key-for-unit-tests' };
    reflector = new Reflector();
    const { JwtAuthGuard } = await import('../jwt-auth.guard');
    guard = new JwtAuthGuard(reflector);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function mockContext(headers: Record<string, string> = {}, isPublic = false): ExecutionContext {
    const request = { headers, user: undefined };
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

  it('should reject expired tokens or failed auth via API', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: 'Unauthorized',
    });

    const ctx = mockContext({ authorization: `Bearer some-token` });
    await expect(guard.canActivate(ctx)).rejects.toThrow('Token inválido ou expirado');
  });

  it('should accept valid tokens via API', async () => {
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
