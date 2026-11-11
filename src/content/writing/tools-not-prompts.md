---
# Placeholder: replace with a real post. Hidden until then: remove `draft` to publish.
draft: true
title: Give the model tools, not paragraphs
description: How I design MCP tools for an agent. A few narrow, typed tools over the product's real actions, errors the model can recover from, and writes kept apart from reads.
date: 2026-10-27
code: "server.registerTool('find_order', …)"
---

Most of what makes an agent good at a product lives in its tools. A system prompt can explain how cancellations work in three careful paragraphs, and the model will still improvise the details. A tool called `cancel_order` that takes an order ID does the cancellation the way the product does it, every time. When I build an MCP server for a product, I spend my time on the tool list and keep the prompt short.

## Few tools, cut along real actions

The model reads every tool's name, description and input schema on every turn, then picks one. Each tool you add costs context and adds one more way to choose wrong. Two tools that overlap are worse than one, because the model has to guess which you meant, and it won't guess the same way twice.

So I start from the actions the product already has: the buttons a person presses, the endpoints the app already calls. Find an order. Cancel an order. Start a return. Each becomes one tool with one job. I stay away from generic escape hatches like `run_sql` or `call_api`. They hand the model the whole system and ask it to rediscover rules your backend already enforces, and a generic tool walks straight past them.

Names and descriptions are written for the model, so I write them like instructions to a careful new colleague. What the tool does, when to use it, what it returns, what it will not do. The description is the prompt now, and it arrives at the moment the model is choosing, which is the only moment it matters. Parameter descriptions count too. A `.describe()` on a zod field ends up in the JSON Schema the model reads.

## Typed inputs, checked at the boundary

Here is a read tool with the TypeScript SDK, `@modelcontextprotocol/sdk`:

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const server = new McpServer({ name: 'shop', version: '1.0.0' });

server.registerTool(
  'find_order',
  {
    title: 'Find an order',
    description:
      'Look up one order by its ID. Returns its status, items, total and whether it can still be cancelled. ' +
      'Read only. Call this before you change an order.',
    inputSchema: {
      orderId: z.string().regex(/^ORD-\d{5}$/).describe('Order ID, like ORD-10423'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ orderId }) => {
    const order = await orders.get(orderId); // your data layer
    if (!order) return notFound(orderId);
    return { content: [{ type: 'text', text: JSON.stringify(order) }] };
  },
);
```

The SDK validates the arguments against that shape before my handler runs. A call with `orderId: "10423"` never reaches the database: the SDK turns the zod failure into an error result, and the model reads the validation message. Enums do the same job for choices. `status: z.enum(['open', 'shipped', 'cancelled'])` gives the model three options and gives me three cases to handle, where a free string gives me every spelling of "canceled".

Validation is the floor. A well-formed ID can still point at nothing.

## Errors the model can act on

When a call fails, the model reads whatever comes back and decides what to do next. A thrown exception that surfaces as `Error: not found` gives it nothing to work with, so it repeats the same call, or worse, carries on as if the call had worked. I return failures as results that say what went wrong and what to try:

```ts
function notFound(orderId: string) {
  return {
    isError: true,
    content: [
      {
        type: 'text' as const,
        text:
          `No order ${orderId}. Order IDs are ORD- and five digits; check the ID with the user. ` +
          'If they only have an email address, call search_orders with it instead.',
      },
    ],
  };
}
```

`isError: true` tells the client and the model that the call failed, so neither treats the text as data. The message names the next move, using the name of another tool. That one sentence is often the difference between an agent that recovers and one that apologises and gives up. A generic message gets a generic recovery.

The same rule covers business errors. If `cancel_order` is called on an order that has already shipped, it does not throw. It returns an error result that says the order shipped on a date, cannot be cancelled, and that `start_return` is the tool for this.

## Reads and writes are different tools

Read tools should be cheap and safe to call twice, and I mark them with `readOnlyHint: true` so clients can let the model call them freely. Write tools get their own names and narrow inputs. I never fold a write into a read through a flag, like `find_order` with `cancel: true`, because then every lookup is one wrong argument away from a cancellation.

The annotations have defaults worth knowing. A tool that is not marked read only is assumed to be destructive, so an additive tool should say `destructiveHint: false`, and one that is safe to repeat should say `idempotentHint: true`. They are hints, though. The SDK's own docs say clients should never make tool use decisions based on annotations from untrusted servers. So the server enforces its own rules: the order's state is checked in the handler, not in the description.

For anything destructive I want a person to confirm, and the model can't be that person. A `confirm: true` argument only proves the model typed it. The approval has to come from outside the model: the client's prompt before a destructive call, or MCP elicitation, where the server asks the user directly through the client and waits for the answer. The model proposes the cancellation. A human approves it, and the tool does exactly what was approved.
