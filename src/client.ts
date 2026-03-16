/**
 * Main Elephantasm client class for HTTP API communication.
 */

import type {
  Anima,
  AnimaCreate,
  Event,
  EventCreate,
  EventType,
  MemoryPack,
  ElephantasmConfig,
  ExtractOptions,
  InjectOptions,
  IdentityContext,
  ScoredMemory,
  ScoredKnowledge,
  TemporalContext,
} from './types';
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  ElephantasmError,
} from './errors';

/** Valid event type values accepted by the API. */
const VALID_EVENT_TYPES = new Set([
  'message.in', 'message.out', 'tool.call', 'tool.result', 'system',
]);

/** Mapping from uppercase enum names to dot-notation API values. */
const EVENT_TYPE_ALIASES: Record<string, string> = {
  MESSAGE_IN: 'message.in',
  MESSAGE_OUT: 'message.out',
  TOOL_CALL: 'tool.call',
  TOOL_RESULT: 'tool.result',
  SYSTEM: 'system',
};

/**
 * Resolve eventType to a valid API string value.
 *
 * Accepts dot-notation strings ('tool.call'), uppercase enum names ('TOOL_CALL'),
 * and mixed case ('Tool_Call'). Throws ValidationError for unrecognized strings.
 */
export function resolveEventType(eventType: EventType | string): string {
  if (VALID_EVENT_TYPES.has(eventType)) return eventType;

  const alias = EVENT_TYPE_ALIASES[eventType.toUpperCase()];
  if (alias) return alias;

  throw new ValidationError(
    `Invalid eventType '${eventType}'. ` +
    `Valid values: ${[...VALID_EVENT_TYPES].sort().join(', ')}. ` +
    `Hint: use dot-notation strings (e.g. 'tool.call') or uppercase aliases (e.g. 'TOOL_CALL').`
  );
}

/** Extended MemoryPack with helper methods. */
export interface MemoryPackWithHelpers extends MemoryPack {
  /** Return the formatted context string for LLM injection. */
  asPrompt(): string;
  /** Extract identity context if present. */
  getIdentity(): IdentityContext | undefined;
  /** Extract session memories with scores. */
  getSessionMemories(): ScoredMemory[];
  /** Extract knowledge items with scores. */
  getKnowledge(): ScoredKnowledge[];
  /** Extract long-term memories with scores. */
  getLongTermMemories(): ScoredMemory[];
  /** Extract temporal awareness context if present. */
  getTemporalContext(): TemporalContext | undefined;
}

/**
 * HTTP client for Elephantasm Long-Term Agentic Memory API.
 *
 * @example
 * ```typescript
 * import { Elephantasm } from '@elephantasm/client';
 *
 * const client = new Elephantasm({ apiKey: 'sk_live_...', animaId: '...' });
 * const pack = await client.inject();
 * console.log(pack.asPrompt());
 * ```
 */
export class Elephantasm {
  private readonly apiKey: string;
  private readonly defaultAnimaId?: string;
  private readonly endpoint: string;
  private readonly timeout: number;

  /**
   * Initialize the Elephantasm client.
   *
   * @param config - Configuration options
   * @throws {AuthenticationError} If no API key is provided
   */
  constructor(config: ElephantasmConfig = {}) {
    this.apiKey = config.apiKey || process.env.ELEPHANTASM_API_KEY || '';
    this.defaultAnimaId = config.animaId || process.env.ELEPHANTASM_ANIMA_ID;
    this.endpoint = (
      config.endpoint ||
      process.env.ELEPHANTASM_ENDPOINT ||
      'https://api.elephantasm.com'
    ).replace(/\/$/, '');
    this.timeout = config.timeout || 30000;

    if (!this.apiKey) {
      throw new AuthenticationError(
        'API key required. Set ELEPHANTASM_API_KEY env var or pass apiKey in config.'
      );
    }
  }

  /**
   * Make an HTTP request to the API.
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.endpoint}/api${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return (await response.json()) as T;
      }

      // Handle error responses
      let detail: string;
      try {
        const errorData = (await response.json()) as { detail?: string };
        detail = errorData.detail || response.statusText;
      } catch {
        detail = response.statusText;
      }

      const status = response.status;

      if (status === 401) throw new AuthenticationError(detail);
      if (status === 404) throw new NotFoundError(detail);
      if (status === 422) throw new ValidationError(detail);
      if (status === 429) throw new RateLimitError(detail);
      if (status >= 500) throw new ServerError(detail);

      throw new ElephantasmError(detail, status);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ElephantasmError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ElephantasmError(`Request timeout after ${this.timeout}ms`);
      }

      throw new ElephantasmError(`Request failed: ${error}`);
    }
  }

  /**
   * Get anima ID from parameter or default.
   */
  private getAnimaId(providedId?: string): string {
    const animaId = providedId || this.defaultAnimaId;
    if (!animaId) {
      throw new Error(
        'anima_id required. Set ELEPHANTASM_ANIMA_ID env var, pass to constructor, or pass to method.'
      );
    }
    return animaId;
  }

  /**
   * Create a new anima (agent entity).
   *
   * @param name - Human-readable name for the anima
   * @param description - Optional description
   * @param meta - Optional metadata dictionary
   * @returns Created Anima object
   */
  async createAnima(
    name: string,
    description?: string,
    meta?: Record<string, unknown>
  ): Promise<Anima> {
    const data: AnimaCreate = { name };
    if (description !== undefined) data.description = description;
    if (meta !== undefined) data.meta = meta;

    return this.request<Anima>('/animas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Retrieve the latest memory pack for context injection.
   *
   * @param options - Inject options (animaId, query, preset)
   * @returns MemoryPack with context ready for LLM injection
   */
  async inject(options: InjectOptions = {}): Promise<MemoryPackWithHelpers | null> {
    const animaId = this.getAnimaId(options.animaId);

    const params = new URLSearchParams();
    if (options.query) params.set('query', options.query);
    if (options.preset) params.set('preset', options.preset);

    const queryString = params.toString();
    const path = `/animas/${animaId}/memory-packs/latest${queryString ? `?${queryString}` : ''}`;

    const pack = await this.request<MemoryPack | null>(path);

    if (!pack) return null;

    return this.wrapMemoryPack(pack);
  }

  /**
   * Capture an event (message, tool call, etc.) for memory synthesis.
   *
   * @param eventType - Type of event (e.g., 'message.in')
   * @param content - Event content (message text, tool output, etc.)
   * @param options - Additional options (animaId, sessionId, role, etc.)
   * @returns Created Event object
   */
  async extract(
    eventType: EventType | string,
    content: string,
    options: ExtractOptions = {}
  ): Promise<Event> {
    const animaId = this.getAnimaId(options.animaId);

    const data: EventCreate = {
      anima_id: animaId,
      event_type: resolveEventType(eventType),
      content,
    };

    if (options.sessionId !== undefined) data.session_id = options.sessionId;
    if (options.role !== undefined) data.role = options.role;
    if (options.author !== undefined) data.author = options.author;
    if (options.occurredAt !== undefined) data.occurred_at = options.occurredAt;
    if (options.meta !== undefined) data.meta = options.meta;
    if (options.importanceScore !== undefined) {
      data.importance_score = options.importanceScore;
    }

    return this.request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Wrap a MemoryPack with helper methods.
   */
  private wrapMemoryPack(pack: MemoryPack): MemoryPackWithHelpers {
    const content = pack.content || {};
    return {
      ...pack,
      asPrompt(): string {
        return content.context || '';
      },
      getIdentity(): IdentityContext | undefined {
        return content.identity;
      },
      getSessionMemories(): ScoredMemory[] {
        return content.session_memories || [];
      },
      getKnowledge(): ScoredKnowledge[] {
        return content.knowledge || [];
      },
      getLongTermMemories(): ScoredMemory[] {
        return content.long_term_memories || [];
      },
      getTemporalContext(): TemporalContext | undefined {
        return content.temporal_context;
      },
    };
  }
}
