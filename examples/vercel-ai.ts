/**
 * Elephantasm with Vercel AI SDK
 *
 * This example shows how to integrate long-term memory with the Vercel AI SDK.
 *
 * Install dependencies:
 *   npm install ai @ai-sdk/anthropic @elephantasm/client
 *
 * Set environment variables:
 *   ELEPHANTASM_API_KEY=sk_live_...
 *   ELEPHANTASM_ANIMA_ID=your-anima-uuid
 *   ANTHROPIC_API_KEY=sk-ant-...
 *
 * Run:
 *   npx tsx examples/vercel-ai.ts
 */
import { Elephantasm } from '@elephantasm/client';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

// Initialize client with explicit config (or use env vars)
const el = new Elephantasm({
  apiKey: process.env.ELEPHANTASM_API_KEY,
  animaId: process.env.ELEPHANTASM_ANIMA_ID,
});

async function chat(userMessage: string, sessionId: string): Promise<string> {
  // 1. Inject long-term memory context
  const pack = await el.inject();
  const systemPrompt = pack.asPrompt();

  console.log(`[Memory] Loaded ${pack.token_count} tokens of context`);

  // 2. Call LLM with memory-enriched system prompt
  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: systemPrompt,
    prompt: userMessage,
  });

  // 3. Extract events (fire-and-forget for production, await for demo)
  await Promise.all([
    el.extract('message.in', userMessage, { sessionId, role: 'user' }),
    el.extract('message.out', text, { sessionId, role: 'assistant' }),
  ]);

  console.log(`[Memory] Stored interaction events`);

  return text;
}

async function main() {
  const sessionId = `session-${Date.now()}`;

  // Simulate a conversation
  const messages = [
    'What did we talk about last time?',
    'Can you remember my preferences?',
    'Tell me something interesting based on what you know about me.',
  ];

  for (const message of messages) {
    console.log(`\nUser: ${message}`);
    const response = await chat(message, sessionId);
    console.log(`Assistant: ${response}`);
  }
}

main().catch(console.error);
