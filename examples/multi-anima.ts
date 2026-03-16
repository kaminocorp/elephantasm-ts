/**
 * Multiple animas (per-user agents)
 *
 * This example demonstrates creating separate animas for different users,
 * allowing each user to have their own isolated memory space.
 *
 * Set environment variables:
 *   ELEPHANTASM_API_KEY=sk_live_...
 *
 * Run:
 *   npx tsx examples/multi-anima.ts
 */
import { Elephantasm } from '@elephantasm/client';

// Initialize client without default animaId (we'll specify per-request)
const el = new Elephantasm({
  apiKey: process.env.ELEPHANTASM_API_KEY,
});

interface UserAgent {
  userId: string;
  animaId: string;
}

// Store user-to-anima mappings (in production, persist to database)
const userAgents = new Map<string, UserAgent>();

/**
 * Get or create an anima for a user.
 */
async function getOrCreateUserAgent(userId: string): Promise<UserAgent> {
  // Check cache first
  const cached = userAgents.get(userId);
  if (cached) {
    return cached;
  }

  // Create new anima for this user
  const anima = await el.createAnima(
    `Agent for ${userId}`,
    `Personal assistant for user ${userId}`,
    { user_id: userId, created_via: 'multi-anima-example' }
  );

  const agent: UserAgent = {
    userId,
    animaId: anima.id,
  };

  userAgents.set(userId, agent);
  console.log(`Created new anima ${anima.id} for user ${userId}`);

  return agent;
}

/**
 * Handle a message for a specific user.
 */
async function handleUserMessage(
  userId: string,
  message: string,
  sessionId: string
): Promise<void> {
  const agent = await getOrCreateUserAgent(userId);

  // Get memory context for this user's anima
  const pack = await el.inject({ animaId: agent.animaId });

  console.log(`[${userId}] Memory context: ${pack.token_count} tokens`);
  console.log(`[${userId}] Session memories: ${pack.session_memory_count}`);
  console.log(`[${userId}] Knowledge items: ${pack.knowledge_count}`);

  // Store the user's message
  await el.extract('message.in', message, {
    animaId: agent.animaId,
    sessionId,
    role: 'user',
    author: userId,
  });

  console.log(`[${userId}] Stored message: "${message.slice(0, 50)}..."`);
}

async function main() {
  // Simulate multiple users interacting
  const users = ['user-alice', 'user-bob', 'user-charlie'];

  for (const userId of users) {
    const sessionId = `${userId}-session-${Date.now()}`;

    // Each user sends a message
    await handleUserMessage(
      userId,
      `Hello! I'm ${userId.split('-')[1]} and I prefer dark mode.`,
      sessionId
    );
  }

  console.log('\n--- User agents created ---');
  for (const [userId, agent] of userAgents) {
    console.log(`${userId} -> ${agent.animaId}`);
  }

  // Demonstrate isolated memory retrieval
  console.log('\n--- Memory isolation demo ---');
  for (const userId of users) {
    const agent = userAgents.get(userId)!;
    const pack = await el.inject({ animaId: agent.animaId });
    console.log(`${userId}: ${pack.session_memory_count} session memories`);
  }
}

main().catch(console.error);
