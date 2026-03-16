# @elephantasm/client

Long-Term Agentic Memory SDK for TypeScript/JavaScript.

Give your AI agents persistent memory that evolves over time.

## Installation

```bash
npm install @elephantasm/client
# or
yarn add @elephantasm/client
# or
pnpm add @elephantasm/client
```

## Quick Start

```typescript
import { inject, extract } from '@elephantasm/client';

// Set environment variables
// ELEPHANTASM_API_KEY=sk_live_...
// ELEPHANTASM_ANIMA_ID=your-anima-id

// Inject long-term memory context into your LLM
const pack = await inject();
const systemPrompt = pack.asPrompt();

// Extract events for memory synthesis
await extract('message.in', userMessage);
await extract('message.out', assistantResponse);
```

## Configuration

Set these environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `ELEPHANTASM_API_KEY` | Your API key | Yes |
| `ELEPHANTASM_ANIMA_ID` | Default anima ID | No |
| `ELEPHANTASM_ENDPOINT` | API endpoint (default: https://api.elephantasm.com) | No |

Or pass configuration to the client:

```typescript
import { Elephantasm } from '@elephantasm/client';

const client = new Elephantasm({
  apiKey: 'sk_live_...',
  animaId: 'your-anima-id',
});
```

## Core Concepts

### Anima

An anima is an agent entity that owns memories and events. Create one per agent or per user.

```typescript
import { createAnima } from '@elephantasm/client';

const anima = await createAnima('My Agent', 'A helpful assistant');
```

### inject()

Retrieve a pre-compiled memory pack for LLM context injection. Returns immediately with cached data (no LLM calls).

```typescript
const pack = await inject({
  animaId: 'your-anima-id',  // Optional if set in env
  query: 'user preferences', // Optional semantic query
  preset: 'conversational',  // Optional preset name
});

// Use the formatted context
const systemPrompt = pack.asPrompt();

// Access specific layers
const identity = pack.getIdentity();
const sessionMemories = pack.getSessionMemories();
const knowledge = pack.getKnowledge();
const longTermMemories = pack.getLongTermMemories();
```

### extract()

Capture events from your workflow for memory synthesis. Returns immediately (processing happens in background).

```typescript
await extract('message.in', userMessage, {
  sessionId: 'session-123',
  role: 'user',
  author: 'john@example.com',
});

await extract('message.out', assistantResponse, {
  sessionId: 'session-123',
  role: 'assistant',
  author: 'claude-3',
});
```

## Event Types

| Type | Description |
|------|-------------|
| `message.in` | Inbound message (user input) |
| `message.out` | Outbound message (assistant response) |
| `tool.call` | Tool/function call |
| `tool.result` | Tool/function result |
| `system` | System event |

## Using with Explicit Client

For more control, use the `Elephantasm` class directly:

```typescript
import { Elephantasm } from '@elephantasm/client';

const client = new Elephantasm({
  apiKey: 'sk_live_...',
  animaId: 'your-anima-id',
});

const pack = await client.inject();
await client.extract('message.in', 'Hello!');
```

## Error Handling

```typescript
import {
  inject,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
} from '@elephantasm/client';

try {
  const pack = await inject();
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof NotFoundError) {
    console.error('Anima not found');
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded');
  }
}
```

## License

Apache-2.0

## Links

- [Website](https://elephantasm.com)
- [Documentation](https://elephantasm.com/sdk)
- [Python SDK](https://pypi.org/project/elephantasm/)
