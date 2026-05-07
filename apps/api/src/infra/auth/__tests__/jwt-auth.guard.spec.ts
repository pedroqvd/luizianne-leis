/**
 * FIX #23: Testes unitários para JwtAuthGuard.
 * Cobre: @Public() bypass, token ausente, token expirado, token válido.
 */
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

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
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject requests with invalid Bearer format', async () => {
    const ctx = mockContext({ authorization: 'Basic abc123' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject requests with invalid JWT structure', async () => {
    const ctx = mockContext({ authorization: 'Bearer not-a-jwt' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject expired tokens', async () => {
    // Create a token that's expired (exp in the past)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: '123', exp: 1 })).toString('base64url');
    const crypto = require('node:crypto');
    const sig = crypto.createHmac('sha256', 'test-secret-key-for-unit-tests').update(`${header}.${payload}`).digest('base64url');
    const token = `${header}.${payload}.${sig}`;

    const ctx = mockContext({ authorization: `Bearer ${token}` });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should accept valid tokens', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: 'user-123', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
    const crypto = require('node:crypto');
    const sig = crypto.createHmac('sha256', 'test-secret-key-for-unit-tests').update(`${header}.${payload}`).digest('base64url');
    const token = `${header}.${payload}.${sig}`;

    const ctx = mockContext({ authorization: `Bearer ${token}` });
    expect(await guard.canActivate(ctx)).toBe(true);
  });
});
