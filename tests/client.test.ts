/**
 * Tests for Elephantasm TypeScript SDK.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Elephantasm,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  ElephantasmError,
} from '../src';

describe('Elephantasm', () => {
  const originalEnv = { ...process.env };
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset env before each test
    process.env = { ...originalEnv };
    delete process.env.ELEPHANTASM_API_KEY;
    delete process.env.ELEPHANTASM_ANIMA_ID;
    delete process.env.ELEPHANTASM_ENDPOINT;

    // Create fresh mock for each test
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  describe('constructor', () => {
    it('throws AuthenticationError when no API key', () => {
      expect(() => new Elephantasm()).toThrow(AuthenticationError);
      expect(() => new Elephantasm()).toThrow('API key required');
    });

    it('accepts apiKey in config', () => {
      const client = new Elephantasm({ apiKey: 'sk_test_123' });
      expect(client).toBeInstanceOf(Elephantasm);
    });

    it('reads apiKey from env var', () => {
      process.env.ELEPHANTASM_API_KEY = 'sk_test_env';
      const client = new Elephantasm();
      expect(client).toBeInstanceOf(Elephantasm);
    });

    it('reads animaId from env var', () => {
      process.env.ELEPHANTASM_API_KEY = 'sk_test_123';
      process.env.ELEPHANTASM_ANIMA_ID = 'anima-from-env';
      const client = new Elephantasm();
      expect(client).toBeInstanceOf(Elephantasm);
    });

    it('reads endpoint from env var', () => {
      process.env.ELEPHANTASM_API_KEY = 'sk_test_123';
      process.env.ELEPHANTASM_ENDPOINT = 'https://custom.api.com';
      const client = new Elephantasm();
      expect(client).toBeInstanceOf(Elephantasm);
    });
  });

  describe('inject', () => {
    const mockPack = {
      id: 'pack-1',
      anima_id: 'anima-1',
      session_memory_count: 2,
      knowledge_count: 1,
      long_term_memory_count: 3,
      has_identity: true,
      token_count: 500,
      max_tokens: 2000,
      content: {
        context: 'You are a helpful assistant.\n\nSession memories:\n- User prefers dark mode',
        identity: {
          personality_type: 'INTJ',
          communication_style: 'direct',
          prose: 'A thoughtful analytical agent',
        },
        session_memories: [
          { id: 'm1', summary: 'User prefers dark mode', score: 0.9, breakdown: { recency: 0.5, importance: 0.4 } },
        ],
        knowledge: [
          { id: 'k1', content: 'User timezone is PST', type: 'preference', score: 0.8 },
        ],
        long_term_memories: [
          { id: 'm2', summary: 'User is a software engineer', score: 0.7, breakdown: { recency: 0.3, importance: 0.4 } },
        ],
        temporal_context: {
          last_event_at: '2026-01-12T10:00:00Z',
          hours_ago: 2,
          formatted: '2 hours ago',
        },
      },
      compiled_at: '2026-01-12T12:00:00Z',
      created_at: '2026-01-12T12:00:00Z',
    };

    it('returns MemoryPack with helper methods', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPack,
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123', animaId: 'anima-1' });
      const pack = await client.inject();

      expect(pack.session_memory_count).toBe(2);
      expect(pack.asPrompt()).toContain('helpful assistant');
      expect(pack.asPrompt()).toContain('dark mode');
    });

    it('getIdentity returns identity context', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPack,
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123', animaId: 'anima-1' });
      const pack = await client.inject();

      const identity = pack.getIdentity();
      expect(identity?.personality_type).toBe('INTJ');
      expect(identity?.prose).toBe('A thoughtful analytical agent');
    });

    it('getSessionMemories returns session memories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPack,
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123', animaId: 'anima-1' });
      const pack = await client.inject();

      const memories = pack.getSessionMemories();
      expect(memories).toHaveLength(1);
      expect(memories[0].summary).toBe('User prefers dark mode');
    });

    it('getKnowledge returns knowledge items', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPack,
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123', animaId: 'anima-1' });
      const pack = await client.inject();

      const knowledge = pack.getKnowledge();
      expect(knowledge).toHaveLength(1);
      expect(knowledge[0].type).toBe('preference');
    });

    it('getLongTermMemories returns long-term memories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPack,
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123', animaId: 'anima-1' });
      const pack = await client.inject();

      const memories = pack.getLongTermMemories();
      expect(memories).toHaveLength(1);
      expect(memories[0].summary).toBe('User is a software engineer');
    });

    it('getTemporalContext returns temporal context', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPack,
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123', animaId: 'anima-1' });
      const pack = await client.inject();

      const temporal = pack.getTemporalContext();
      expect(temporal?.hours_ago).toBe(2);
      expect(temporal?.formatted).toBe('2 hours ago');
    });

    it('returns null when API returns null (no packs exist)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => null,
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123', animaId: 'anima-1' });
      const pack = await client.inject();

      expect(pack).toBeNull();
    });

    it('handles pack with null content gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ...mockPack,
          content: null,
        }),
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123', animaId: 'anima-1' });
      const pack = await client.inject();

      expect(pack).not.toBeNull();
      expect(pack!.asPrompt()).toBe('');
      expect(pack!.getSessionMemories()).toEqual([]);
      expect(pack!.getKnowledge()).toEqual([]);
      expect(pack!.getLongTermMemories()).toEqual([]);
      expect(pack!.getIdentity()).toBeUndefined();
      expect(pack!.getTemporalContext()).toBeUndefined();
    });

    it('throws NotFoundError on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: 'Anima not found' }),
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123', animaId: 'invalid-id' });
      await expect(client.inject()).rejects.toThrow(NotFoundError);
    });

    it('throws Error when no animaId provided', async () => {
      const client = new Elephantasm({ apiKey: 'sk_test_123' });
      await expect(client.inject()).rejects.toThrow('anima_id required');
    });

    it('accepts animaId in options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPack,
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123' });
      const pack = await client.inject({ animaId: 'anima-1' });

      expect(pack.anima_id).toBe('anima-1');
    });

    it('passes query and preset parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPack,
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123', animaId: 'anima-1' });
      await client.inject({ query: 'user preferences', preset: 'conversational' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('query=user+preferences'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('preset=conversational'),
        expect.any(Object)
      );
    });
  });

  describe('extract', () => {
    const mockEvent = {
      id: 'evt-1',
      anima_id: 'anima-1',
      event_type: 'message.in',
      content: 'Hello!',
      role: 'user',
      meta: {},
      created_at: '2026-01-12T12:00:00Z',
      updated_at: '2026-01-12T12:00:00Z',
    };

    it('sends event to API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockEvent,
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123', animaId: 'anima-1' });
      const event = await client.extract('message.in', 'Hello!');

      expect(event.content).toBe('Hello!');
      expect(event.event_type).toBe('message.in');
    });

    it('includes Authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockEvent,
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123', animaId: 'anima-1' });
      await client.extract('message.in', 'Hello!');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer sk_test_123',
          }),
        })
      );
    });

    it('includes optional fields in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockEvent,
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123', animaId: 'anima-1' });
      await client.extract('message.in', 'Hello!', {
        sessionId: 'session-123',
        role: 'user',
        author: 'john@example.com',
        importanceScore: 0.8,
      });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.session_id).toBe('session-123');
      expect(body.role).toBe('user');
      expect(body.author).toBe('john@example.com');
      expect(body.importance_score).toBe(0.8);
    });

    it('throws Error when no animaId provided', async () => {
      const client = new Elephantasm({ apiKey: 'sk_test_123' });
      await expect(client.extract('message.in', 'Hello!')).rejects.toThrow('anima_id required');
    });

    it('accepts animaId in options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockEvent,
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123' });
      const event = await client.extract('message.in', 'Hello!', { animaId: 'anima-1' });

      expect(event.anima_id).toBe('anima-1');
    });
  });

  describe('createAnima', () => {
    const mockAnima = {
      id: 'anima-new',
      name: 'Test Agent',
      description: 'A test agent',
      meta: {},
      created_at: '2026-01-12T12:00:00Z',
      updated_at: '2026-01-12T12:00:00Z',
    };

    it('creates anima via API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockAnima,
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123' });
      const anima = await client.createAnima('Test Agent', 'A test agent');

      expect(anima.name).toBe('Test Agent');
      expect(anima.description).toBe('A test agent');
    });

    it('sends POST request to /animas', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockAnima,
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123' });
      await client.createAnima('Test Agent');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/animas'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('includes meta in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockAnima,
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123' });
      await client.createAnima('Test Agent', 'A test agent', { tags: ['test'] });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.meta).toEqual({ tags: ['test'] });
    });
  });

  describe('error handling', () => {
    it('throws AuthenticationError on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'Invalid API key' }),
      });

      const client = new Elephantasm({ apiKey: 'sk_invalid' });
      await expect(client.createAnima('Test')).rejects.toThrow(AuthenticationError);
    });

    it('throws NotFoundError on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: 'Resource not found' }),
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123', animaId: 'invalid' });
      await expect(client.inject()).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError on 422', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({ detail: 'Invalid data' }),
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123' });
      await expect(client.createAnima('')).rejects.toThrow(ValidationError);
    });

    it('throws RateLimitError on 429', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ detail: 'Rate limit exceeded' }),
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123' });
      await expect(client.createAnima('Test')).rejects.toThrow(RateLimitError);
    });

    it('throws ServerError on 5xx', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ detail: 'Server error' }),
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123' });
      await expect(client.createAnima('Test')).rejects.toThrow(ServerError);
    });

    it('throws ElephantasmError on other status codes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 418,
        statusText: "I'm a teapot",
        json: async () => ({ detail: 'Teapot error' }),
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123' });
      await expect(client.createAnima('Test')).rejects.toThrow(ElephantasmError);
    });

    it('handles JSON parse errors in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123' });
      await expect(client.createAnima('Test')).rejects.toThrow(ServerError);
    });
  });

  describe('endpoint configuration', () => {
    it('uses default endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'test', content: {} }),
      });

      const client = new Elephantasm({ apiKey: 'sk_test_123', animaId: 'anima-1' });
      await client.inject();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.elephantasm.com'),
        expect.any(Object)
      );
    });

    it('uses custom endpoint from config', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'test', content: {} }),
      });

      const client = new Elephantasm({
        apiKey: 'sk_test_123',
        animaId: 'anima-1',
        endpoint: 'https://custom.api.com',
      });
      await client.inject();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://custom.api.com'),
        expect.any(Object)
      );
    });

    it('strips trailing slash from endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'test', content: {} }),
      });

      const client = new Elephantasm({
        apiKey: 'sk_test_123',
        animaId: 'anima-1',
        endpoint: 'https://custom.api.com/',
      });
      await client.inject();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/https:\/\/custom\.api\.com\/api\//),
        expect.any(Object)
      );
    });
  });
});
