/**
 * Type definitions for Elephantasm SDK.
 * Matches backend API schemas.
 */

/** Event types for message capture. */
export type EventType =
  | 'message.in'
  | 'message.out'
  | 'tool.call'
  | 'tool.result'
  | 'system';

/** Lifecycle states for memory recall and curation. */
export type MemoryState = 'active' | 'decaying' | 'archived';

/** Agent entity that owns memories and events. */
export interface Anima {
  id: string;
  name: string;
  description?: string;
  meta?: Record<string, unknown>;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

/** Data required to create an Anima. */
export interface AnimaCreate {
  name: string;
  description?: string;
  meta?: Record<string, unknown>;
}

/** Atomic unit of experience (message, tool call, etc.). */
export interface Event {
  id: string;
  anima_id: string;
  event_type: string;
  role?: string;
  author?: string;
  summary?: string;
  content: string;
  occurred_at?: string;
  session_id?: string;
  meta: Record<string, unknown>;
  source_uri?: string;
  dedupe_key?: string;
  importance_score?: number;
  created_at: string;
  updated_at: string;
}

/** Data required to create an Event. */
export interface EventCreate {
  anima_id: string;
  event_type: string;
  content: string;
  role?: string;
  author?: string;
  summary?: string;
  occurred_at?: string;
  session_id?: string;
  meta?: Record<string, unknown>;
  source_uri?: string;
  dedupe_key?: string;
  importance_score?: number;
}

/** Subjective interpretation of events. */
export interface Memory {
  id: string;
  anima_id: string;
  content?: string;
  summary?: string;
  importance?: number;
  confidence?: number;
  state?: MemoryState;
  recency_score?: number;
  decay_score?: number;
  time_start?: string;
  time_end?: string;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Memory with scoring breakdown from pack compilation. */
export interface ScoredMemory {
  id: string;
  summary?: string;
  score: number;
  reason?: string;
  breakdown: Record<string, number>;
  similarity?: number;
}

/** Knowledge item with similarity score from pack compilation. */
export interface ScoredKnowledge {
  id: string;
  content: string;
  type: string;
  score: number;
  similarity?: number;
}

/** Temporal awareness context for bridging session gaps. */
export interface TemporalContext {
  last_event_at: string;
  hours_ago: number;
  memory_summary?: string;
  formatted: string;
}

/** Identity layer context from pack compilation. */
export interface IdentityContext {
  personality_type?: string;
  communication_style?: string;
  self_reflection?: Record<string, unknown>;
  prose?: string;
}

/** Content structure within MemoryPack. */
export interface MemoryPackContent {
  context?: string;
  identity?: IdentityContext;
  session_memories?: ScoredMemory[];
  knowledge?: ScoredKnowledge[];
  long_term_memories?: ScoredMemory[];
  temporal_context?: TemporalContext;
}

/** Compiled memory pack for LLM context injection. */
export interface MemoryPack {
  id: string;
  anima_id: string;
  query?: string;
  preset_name?: string;
  session_memory_count: number;
  knowledge_count: number;
  long_term_memory_count: number;
  has_identity: boolean;
  token_count: number;
  max_tokens: number;
  content: MemoryPackContent;
  compiled_at: string;
  created_at: string;
}

/** Configuration options for Elephantasm client. */
export interface ElephantasmConfig {
  apiKey?: string;
  animaId?: string;
  endpoint?: string;
  timeout?: number;
}

/** Options for extract() method. */
export interface ExtractOptions {
  animaId?: string;
  sessionId?: string;
  role?: string;
  author?: string;
  occurredAt?: string;
  meta?: Record<string, unknown>;
  importanceScore?: number;
}

/** Options for inject() method. */
export interface InjectOptions {
  animaId?: string;
  query?: string;
  preset?: string;
}
