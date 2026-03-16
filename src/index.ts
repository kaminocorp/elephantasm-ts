/**
 * Elephantasm - Long-Term Agentic Memory SDK
 *
 * @example
 * ```typescript
 * import { inject, extract, createAnima } from '@elephantasm/client';
 *
 * // Get memory context
 * const pack = await inject({ animaId: 'your-anima-id' });
 * const systemPrompt = pack.asPrompt();
 *
 * // Store events
 * await extract('message.in', userMessage);
 * await extract('message.out', assistantResponse);
 * ```
 *
 * @packageDocumentation
 */

export { Elephantasm, resolveEventType, type MemoryPackWithHelpers } from './client';
export * from './types';
export * from './errors';

// Module-level convenience functions
import { Elephantasm } from './client';
import type { MemoryPackWithHelpers } from './client';
import type {
  Anima,
  Event,
  EventType,
  ExtractOptions,
  InjectOptions,
} from './types';

let defaultClient: Elephantasm | null = null;

/**
 * Get or create the default client instance.
 * Uses environment variables for configuration.
 */
function getClient(): Elephantasm {
  if (!defaultClient) {
    defaultClient = new Elephantasm();
  }
  return defaultClient;
}

/**
 * Create a new anima (agent entity).
 *
 * @param name - Human-readable name for the anima
 * @param description - Optional description
 * @param meta - Optional metadata dictionary
 * @returns Created Anima object
 *
 * @example
 * ```typescript
 * const anima = await createAnima('My Agent', 'A helpful assistant');
 * ```
 */
export async function createAnima(
  name: string,
  description?: string,
  meta?: Record<string, unknown>
): Promise<Anima> {
  return getClient().createAnima(name, description, meta);
}

/**
 * Retrieve the latest memory pack for context injection.
 *
 * @param options - Inject options (animaId, query, preset)
 * @returns MemoryPack with context ready for LLM injection
 *
 * @example
 * ```typescript
 * // Using default anima from env var
 * const pack = await inject();
 * console.log(pack.asPrompt());
 *
 * // With specific anima and query
 * const pack = await inject({
 *   animaId: 'your-anima-id',
 *   query: 'user preferences',
 * });
 * ```
 */
export async function inject(
  options: InjectOptions = {}
): Promise<MemoryPackWithHelpers | null> {
  return getClient().inject(options);
}

/**
 * Capture an event (message, tool call, etc.) for memory synthesis.
 *
 * @param eventType - Type of event (e.g., 'message.in')
 * @param content - Event content (message text, tool output, etc.)
 * @param options - Additional options (animaId, sessionId, role, etc.)
 * @returns Created Event object
 *
 * @example
 * ```typescript
 * // Simple usage
 * await extract('message.in', 'Hello!');
 * await extract('message.out', 'Hi there!');
 *
 * // With options
 * await extract('message.in', 'Hello!', {
 *   sessionId: 'session-123',
 *   role: 'user',
 *   author: 'john@example.com',
 * });
 * ```
 */
export async function extract(
  eventType: EventType | string,
  content: string,
  options: ExtractOptions = {}
): Promise<Event> {
  return getClient().extract(eventType, content, options);
}
