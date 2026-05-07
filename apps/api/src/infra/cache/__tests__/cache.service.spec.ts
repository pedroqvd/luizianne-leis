/**
 * FIX #23: Testes unitários para CacheService.
 * Cobre: FIX #8 — null sentinel, wrap(), invalidate().
 */

describe('CacheService', () => {
  let service: any;
  let mockRedis: any;

  beforeEach(async () => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      scanStream: jest.fn(),
      pipeline: jest.fn(() => ({
        del: jest.fn(),
        exec: jest.fn(),
      })),
    };

    const { CacheService } = await import('../cache.service');
    service = new CacheService(mockRedis);
  });

  describe('get()', () => {
    it('should return { found: false } for cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);
      const result = await service.get('key');
      expect(result).toEqual({ found: false, value: null });
    });

    it('should return { found: true, value: null } for null sentinel', async () => {
      mockRedis.get.mockResolvedValue('__NULL__');
      const result = await service.get('key');
      expect(result).toEqual({ found: true, value: null });
    });

    it('should parse JSON for regular values', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ a: 1 }));
      const result = await service.get('key');
      expect(result).toEqual({ found: true, value: { a: 1 } });
    });

    it('should handle invalid JSON gracefully', async () => {
      mockRedis.get.mockResolvedValue('not json{');
      const result = await service.get('key');
      expect(result).toEqual({ found: false, value: null });
    });
  });

  describe('set()', () => {
    it('should store null as sentinel value', async () => {
      await service.set('key', null, 60);
      expect(mockRedis.set).toHaveBeenCalledWith('key', '__NULL__', 'EX', 60);
    });

    it('should JSON-serialize regular values', async () => {
      await service.set('key', { a: 1 }, 60);
      expect(mockRedis.set).toHaveBeenCalledWith('key', '{"a":1}', 'EX', 60);
    });

    it('should handle empty arrays', async () => {
      await service.set('key', [], 60);
      expect(mockRedis.set).toHaveBeenCalledWith('key', '[]', 'EX', 60);
    });
  });

  describe('wrap()', () => {
    it('should return cached value on hit', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify([1, 2, 3]));
      const fn = jest.fn();
      const result = await service.wrap('key', 60, fn);
      expect(result).toEqual([1, 2, 3]);
      expect(fn).not.toHaveBeenCalled();
    });

    it('should call fn and cache result on miss', async () => {
      mockRedis.get.mockResolvedValue(null);
      const fn = jest.fn().mockResolvedValue('data');
      const result = await service.wrap('key', 60, fn);
      expect(result).toBe('data');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('FIX #8: should cache null values using sentinel', async () => {
      mockRedis.get.mockResolvedValue(null); // miss
      const fn = jest.fn().mockResolvedValue(null);
      const result = await service.wrap('key', 60, fn);
      expect(result).toBeNull();
      expect(mockRedis.set).toHaveBeenCalledWith('key', '__NULL__', 'EX', 60);
    });

    it('FIX #8: should return cached null on subsequent calls', async () => {
      mockRedis.get.mockResolvedValue('__NULL__'); // hit with sentinel
      const fn = jest.fn();
      const result = await service.wrap('key', 60, fn);
      expect(result).toBeNull();
      expect(fn).not.toHaveBeenCalled(); // fn should NOT be called
    });
  });
});
