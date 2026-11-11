---
# Placeholder: replace with a real post. Hidden until then: remove `draft` to publish.
draft: true
title: A budget for every model call
description: The wrapper I put around every language model call. A time limit, a token limit, retries only when they can help, a fallback that always answers, and a log line per call.
date: 2026-10-13
code: 'AbortSignal.timeout(8000)'
---

A model call is a network call to a slow, expensive service that sometimes says no. I treat it like any other dependency I don't control: it gets a time limit, a size limit and a plan for when it fails, and I decide all three before the feature ships. None of this is specific to AI. It is what you would do for a payment provider, applied to a dependency that people tend to treat as magic.

## A time limit the user can feel

Every call gets a ceiling on wall time, chosen from the product, not from the model. If a person is waiting on a reply suggestion, the budget might be a few seconds, say 8. If it is a nightly batch job, minutes are fine. The number belongs to the feature.

`AbortSignal.timeout(8000)` gives you a signal that aborts itself after 8 seconds. Pass it to the SDK or to `fetch` and the request is cancelled when time runs out, instead of hanging until the provider's own timeout, which is usually far longer than any person will wait. I create one signal per logical call and share it across retries, so the budget covers the whole attempt, not each try.

## A token limit you set yourself

Tokens are the other budget, and they are money as well as time. Output is capped with the request's max tokens parameter, set to what the feature needs: a two sentence summary does not need room for an essay. Input is capped before it goes out. I trim what I send to the parts the model needs, and when the input comes from users, I check its size and refuse or truncate on my side, so one huge paste can't turn into one huge bill. Providers have token counting endpoints if you need the exact number before you send.

Agents need one more ceiling. A task that calls the model in a loop can stay inside every per-call limit and still run up a bill, so the task as a whole gets a cap on calls and tokens, and it stops and reports when it hits the cap.

## Retries only for errors that can heal

Some failures are worth a second try: a rate limit (429), a request timeout (408), a server error (500 and up). Most are not. A 400 means my request is wrong and will be wrong again. A 401 means my key is wrong. Retrying those wastes the budget and hides the bug.

Retries wait, with backoff and some jitter, so a fleet of clients doesn't retry in lockstep. And they stop when the remaining budget can't cover another attempt. One more thing: SDKs often retry for you. The Anthropic TypeScript client defaults to 2 retries. If you wrap calls in your own retry loop, turn the SDK's off, or you will retry your retries.

```ts
type Usage = { inputTokens: number; outputTokens: number };
type Run<T> = (signal: AbortSignal) => Promise<{ value: T; usage: Usage }>;

const retryable = (err: unknown) => {
  const status = (err as { status?: number } | null)?.status;
  return status === 408 || status === 429 || (status !== undefined && status >= 500);
};

export async function callModel<T>(
  name: string,
  run: Run<T>,
  fallback: () => T | Promise<T>,
  { budgetMs = 8000, tries = 3 } = {},
): Promise<T> {
  const signal = AbortSignal.timeout(budgetMs);
  const start = performance.now();
  const ms = () => Math.round(performance.now() - start);

  for (let attempt = 1; ; attempt++) {
    try {
      const { value, usage } = await run(signal);
      console.log(JSON.stringify({ name, ok: true, attempt, ms: ms(), ...usage }));
      return value;
    } catch (err) {
      const wait = 250 * 2 ** (attempt - 1) * (1 + Math.random());
      if (!retryable(err) || attempt === tries || ms() + wait > budgetMs) {
        console.log(JSON.stringify({ name, ok: false, attempt, ms: ms(), error: String(err) }));
        return fallback();
      }
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
}
```

When the signal fires, the SDK throws an abort error with no HTTP status, so `retryable` says no and the wrapper goes straight to the fallback. That is the behaviour I want: a timeout means the budget is spent.

## A fallback that always answers

`callModel` never throws. It returns the model's answer or the fallback's, and the caller doesn't need a try block. The fallback is the part people skip, and it is the part users notice.

There are a few kinds. A smaller, faster model for the same prompt. A cached answer for the same input. Or a plain path with no model at all, which is my favourite, because it can't time out. A reply suggestion that fails can show no suggestion. A summary that fails can show the first lines of the original. The feature gets worse for one request; it doesn't break.

```ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ maxRetries: 0 }); // callModel owns the retries

const summary = await callModel(
  'ticket-summary',
  async (signal) => {
    const msg = await client.messages.create(
      {
        model: 'claude-haiku-4-5',
        max_tokens: 200,
        messages: [{ role: 'user', content: `Summarise this support ticket in two sentences:\n\n${ticket.body}` }],
      },
      { signal },
    );
    const text = msg.content.find((block) => block.type === 'text')?.text ?? '';
    return { value: text, usage: { inputTokens: msg.usage.input_tokens, outputTokens: msg.usage.output_tokens } };
  },
  () => ticket.body.slice(0, 280), // the plain path: the ticket's opening lines
);
```

If a fallback is another model call, it gets its own budget. Chaining two slow calls without one is how an 8 second ceiling quietly becomes 30.

## Stream it, and log every call

Streaming doesn't make a call cheaper, but it changes what waiting feels like. A reply that starts appearing at once and finishes later feels faster than one that arrives all at once at the end, even when the total time is the same. For anything a person reads as it arrives, I stream, and the time budget then covers the whole stream.

Every call writes one log line: which feature, how many attempts, how long it took, input and output tokens, and whether it fell back. That line is how I find out which feature costs the most, how often each fallback fires, and whether a new model version made things slower. Without it, the monthly invoice is the first report you get, and it can't tell you which feature to fix.
