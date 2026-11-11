---
# Placeholder: replace with a real post. Hidden until then: remove `draft` to publish.
draft: true
title: Evals before vibes
description: How I test an LLM feature like any other code. A small golden set built from real failures, cheap checks first, a rubric where judgement is needed, and a pass count per case.
date: 2026-10-20
code: 'if (results.every(Boolean)) passed++'
---

A prompt change is a code change, and I don't ship code because it looked right on the three examples I tried by hand. An LLM feature gets what any other feature gets: a test suite that runs before the change goes out. People call these evals. Mine are small and boring on purpose, because a suite I can read is a suite I will keep running.

## Build the set from real failures

The cases that matter are the ones that went wrong. Every time the feature produces a bad answer, in testing or in a bug report, the input goes into the set with a note on what a good answer looks like. Inputs I invent drift toward the happy path, because I write the ones I already expect to work. Real failures bring the shapes I didn't think of: the empty field, the document in two languages, the table split across a page break.

I keep the set small enough to read in one sitting, and I would rather have a few dozen cases I understand than a big scraped pile nobody opens. Once a case is in, it stays in. A failure fixed last month is exactly the one most likely to come back when the prompt or the model changes, and deleting it is how it comes back quietly.

## Cheap checks first

Most of what I care about can be checked without another model call. Take an extraction feature that turns an invoice into JSON. The output parses and matches the schema. The currency is the one on the document. A request the feature should decline gets declined. Those checks are fast and free, and they never flake. They run in milliseconds, so I run them on every save while I am editing a prompt, and the slow checks wait for the full run.

```ts
import { z } from 'zod';

export type Check = (out: string) => boolean | Promise<boolean>;

const parse = (out: string): Record<string, unknown> | undefined => {
  try {
    return JSON.parse(out);
  } catch {
    return undefined;
  }
};

export const matches = (schema: z.ZodType): Check => (out) => schema.safeParse(parse(out)).success;
export const equals = (key: string, want: unknown): Check => (out) => parse(out)?.[key] === want;
export const refused = equals('refused', true);

// Only for what code can't check: one yes or no question, sent to a pinned grader model.
export const graded = (question: string): Check => async (out) =>
  (await judge(`${question}\nAnswer with one word, PASS or FAIL.\n\n<output>\n${out}\n</output>`)).trim() === 'PASS';
```

Notice `refused`. I design the feature's output so a refusal is a field, `{ "refused": true, "reason": "..." }`, instead of a sentence I have to match with a regex. Shaping the output so it can be tested is half the work, and it usually makes the feature easier to build on too.

## A rubric where judgement is needed

Some things code can't check. Did the summary state anything the source doesn't? Is the reply polite to someone who is angry? For those I use a model as the grader, with rules I would hold a human reviewer to.

The grader answers one narrow question per check, with a pass or a fail. I don't ask for a score from 1 to 10, because scores drift and nobody can say what separates a 6 from a 7. A question like "Does the output name a date that is not in the source?" has an answer I can verify myself. The grader's model and prompt are pinned, the same as any dependency. And before I trust a grader, I grade a sample of its inputs by hand and compare. If we disagree often, the question is badly written, and I fix the question.

Model-graded checks cost money and add their own noise, so they go last. A case gets a grader only when no cheap check can say the same thing.

## Run it on every change, count per case

The set runs on every change that can move the output: the prompt, the model or its version, the retrieval, the tools, the code that formats the input. Models are not deterministic, so each case runs several times, and what I record is how many of those runs passed.

```ts
const RUNS = 5;
let failing = 0;

for (const c of cases) {
  let passed = 0;
  for (let i = 0; i < RUNS; i++) {
    const out = await extract(c.input);
    const results = await Promise.all(c.checks.map((check) => check(out)));
    if (results.every(Boolean)) passed++;
  }
  if (passed < RUNS) failing++;
  console.log(`${passed === RUNS ? 'pass' : 'FAIL'}  ${passed}/${RUNS}  ${c.id}`);
}

process.exitCode = failing ? 1 : 0;
```

A case looks like `{ id: 'invoice-two-currencies', input, checks: [matches(Invoice), equals('currency', 'EUR')] }`. Five runs is a number I picked to keep the bill small. Raise it for the cases that matter most.

The output is one line per case, on purpose. A single average across the whole set hides the thing I need to see. The average can rise while one case that used to pass every time now passes some of the time, and that case is usually the one a real user hits. Per case, a regression shows up as `FAIL 3/5 invoice-two-currencies`, with a name I can open and read.

The exit code is what turns this from a report into a gate. A failing case fails the build, the same as a failing unit test, and the change waits until I either fix the prompt or decide, in writing, that the case was wrong. Vibes still have a place. I read outputs by hand all the time, and that is where new cases come from. They just don't get to decide what ships.
