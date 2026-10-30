---
title: 'Function overloads in TypeScript'
description: 'Multiple signatures, one implementation: how overloads make a flexible function type-safe.'
date: 2023-08-09
code: 'function f(x: string): string;'
---

Function overloads let you declare several signatures for one function. Each signature names a set of parameter types and the return type that goes with it. TypeScript checks calls against the signatures, not the implementation, so a function that behaves differently depending on its arguments can still return a precise type.

## What an overload looks like

The overload signatures go directly above the implementation. They have no body. The implementation follows and has to be compatible with every signature above it.

```ts title="add.ts"
// Adding two numbers returns a number
function add(a: number, b: number): number;

// Concatenating two strings returns a string
function add(a: string, b: string): string;

// One implementation handles both
function add(a: any, b: any): any {
  return a + b;
}

add(1, 2); // number
add('a', 'b'); // string
add(1, 'b'); // error: no overload matches this call
```

Callers only see the two overload signatures. The `any` implementation signature is hidden, which is the point: it can be loose internally while the public surface stays strict.

## The problem overloads solve

Here is a function that returns either a number or its string form, depending on a flag.

```ts title="convert.ts"
function convertToUnit(value: number, convertToString?: boolean) {
  if (convertToString) return value.toString();
  return value;
}

const a = convertToUnit(10, true); // string | number
const b = convertToUnit(10); // string | number
```

The inferred return type is `string | number` for every call. That union follows the value around. You cannot call `.toUpperCase()` on `a` without narrowing it first, even though you know it is a string. The flag decided the type at the call site and TypeScript threw that information away.

## Fixing it with overloads

Add one signature per case. The flag becomes a literal type, `true`, so TypeScript can match it.

```ts title="convert.ts"
// Returns a string when convertToString is true
function convertToUnit(value: number, convertToString: true): string;

// Returns a number otherwise
function convertToUnit(value: number): number;

function convertToUnit(value: number, convertToString?: boolean) {
  if (convertToString) return value.toString();
  return value;
}

const converted = convertToUnit(10, true); // string
const raw = convertToUnit(10); // number
```

`converted` now gets string autocompletion and `raw` gets number autocompletion. Nothing changed in the implementation; the two signatures did the work.

## When to reach for it

Overloads earn their place when a function's return type genuinely depends on its arguments and a union would force every caller to narrow. If the cases are unrelated, two functions with two names are usually clearer. And when the relationship between input and output can be expressed with a generic or a conditional type, that is often simpler than a stack of overloads.

Try the examples in the [TypeScript playground](https://www.typescriptlang.org/play?#code=PTAEDEFcDsGMBcCWB7aoDOiDm0CG9IAnAU1ADNlDRcATGxaLUaSAWwCNjD1robQSBQtAZNczNp0IAoMjAQo0tGgApcALgkcuAGlDtNLbYQCUhyVwDc06SAjykqDNjxDSFKrFSx8xV6Ix4QlEeXD4BYiERRmpA4MZZB0VqOjVNdCDRPQM40TNcxmtbMCg4RzREVgAHABtiVj94fGT4AAt8UHa+Op52ZDbQH3RidESy5OU03gBPbM0w6fyF0ABvaVAIqNiAan1rAF8bOwB1RBqazaI0DPimRDJB1AA3LngAFWQAZUyYxB4gyDEMYKJxeaAvQjvZAAVRE8BUT1wNUB5mMejBEKh31umgBxHyN1ERTsAHczhdBFctFJQPdHuDXh9sQE-uQkcNgeV6ZiPrDEPDEcjiKipPkjFIinJxqDnoyYXCEUiUdTdI8eV8flgAPyaPrIOphEyrda0h4qLzq5mMI2U4SgQWAgB08A1txUJmsG1taAdxAONjBGW5r2INCtWAAakrSABeYOQ3kKgCMAAY9HiPcUNtmAHpagOoIMYkM0ABybCjQtAceLCfl-JUqczdmzoDzNmkQA).

---

Also published on [Hashnode](https://script.thoughtlessmind.dev/function-overload-in-typescript).
