/**
 * FIX #23: Testes unitários para NotificationsGateway.
 * Cobre: FIX #4 — limite de conexões SSE.
 */

describe('NotificationsGateway', () => {
  let gateway: any;

  beforeEach(async () => {
    process.env.SSE_MAX_CONNECTIONS = '3';
    jest.resetModules();
    const { NotificationsGateway } = await import('../notifications.gateway');
    gateway = new NotificationsGateway();
  });

  afterEach(() => {
    gateway.onModuleDestroy();
  });

  it('should accept connections within limit', () => {
    expect(() => gateway.stream()).not.toThrow();
    expect(gateway.getActiveConnections()).toBe(1);
  });

  it('should reject connections over the limit', () => {
    gateway.stream();
    gateway.stream();
    gateway.stream();
    expect(gateway.getActiveConnections()).toBe(3);
    expect(() => gateway.stream()).toThrow('Too many SSE connections');
    expect(gateway.getActiveConnections()).toBe(3);
  });

  it('should decrement connections on unsubscribe', () => {
    const obs = gateway.stream();
    expect(gateway.getActiveConnections()).toBe(1);
    const sub = obs.subscribe();
    sub.unsubscribe();
    expect(gateway.getActiveConnections()).toBe(0);
  });

  it('should broadcast events to subscribers', (done) => {
    const obs = gateway.stream();
    const sub = obs.subscribe((event: any) => {
      expect(event.type).toBe('TEST');
      sub.unsubscribe();
      done();
    });
    gateway.broadcast({ type: 'TEST', aggregateType: 'test', aggregateId: 1, payload: {} });
  });
});
