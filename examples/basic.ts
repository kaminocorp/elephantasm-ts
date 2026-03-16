/**
 * Basic Elephantasm SDK usage
 *
 * Set environment variables:
 *   ELEPHANTASM_API_KEY=sk_live_...
 *   ELEPHANTASM_ANIMA_ID=your-anima-uuid
 *
 * Run:
 *   npx tsx examples/basic.ts
 */
import { inject, extract } from '@elephantasm/client';

async function main() {
  // 1. Get memory context for LLM injection
  const pack = await inject();

  console.log(`Loaded memory pack:`);
  console.log(`  - Session memories: ${pack.session_memory_count}`);
  console.log(`  - Knowledge items: ${pack.knowledge_count}`);
  console.log(`  - Long-term memories: ${pack.long_term_memory_count}`);
  console.log(`  - Has identity: ${pack.has_identity}`);
  console.log(`  - Token count: ${pack.token_count}/${pack.max_tokens}`);
  console.log();

  // 2. Get formatted context for system prompt
  const systemPrompt = pack.asPrompt();
  console.log('System prompt preview:');
  console.log(systemPrompt.slice(0, 500) + '...');
  console.log();

  // 3. Store events from your workflow
  const userEvent = await extract('message.in', 'Hello, how are you?');
  console.log(`Stored user message: ${userEvent.id}`);

  const assistantEvent = await extract('message.out', "I'm doing well, thanks for asking!");
  console.log(`Stored assistant message: ${assistantEvent.id}`);

  // 4. Access specific pack content
  const identity = pack.getIdentity();
  if (identity) {
    console.log(`\nIdentity: ${identity.prose || identity.personality_type}`);
  }

  const temporal = pack.getTemporalContext();
  if (temporal) {
    console.log(`Last interaction: ${temporal.formatted}`);
  }
}

main().catch(console.error);
