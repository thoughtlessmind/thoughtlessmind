---
# Placeholder: replace with a real post.
title: Make extracted data check itself
description: Most documents already carry a check on their own data, like running balances, totals and counts. Use it to prove an extraction lost nothing, and fail loudly when it doesn't add up.
date: 2026-09-24
code: 'prev + row.amount == row.balance'
---

An extraction you can't verify is a guess with good formatting. Whether a hand-written parser or a language model pulls the rows out of a document, the output looks equally confident when a row is missing. The fix is to stop trusting the extractor and check the output against something the document already guarantees. Most documents carry that check for free.

## The document already has a checksum

I wrote a tool to turn bank statement PDFs into CSV. Statements are a hard source: there are no ruling lines in the table, narration wraps onto extra lines, some pages are scans, and every bank lays them out differently. Any of that can make a parser drop a row or read a debit as a credit. A dropped row in a statement is a quiet disaster, because the CSV still looks complete.

But a statement prints a running balance on every row. Each balance must equal the previous balance plus the row's credit, minus its debit. The opening balance anchors the start, and the closing balance anchors the end. That chain is a checksum the bank computed for me. If my extraction missed a row, misread an amount or put a number in the wrong column, the chain breaks at that exact spot.

So the tool has to prove it lost nothing. After parsing, every statement runs through a balance chain check, and a break fails the run.

## The check is a few lines

```python
from dataclasses import dataclass
from decimal import Decimal


@dataclass
class Row:
    date: str
    description: str
    amount: Decimal  # credits positive, debits negative
    balance: Decimal  # as printed on the statement


def breaks(opening: Decimal, rows: list[Row], closing: Decimal) -> list[str]:
    found = []
    prev = opening
    for i, row in enumerate(rows):
        if prev + row.amount != row.balance:
            found.append(f"row {i + 1} ({row.date}): expected {prev + row.amount}, printed {row.balance}")
        prev = row.balance  # re-anchor, so one bad row reports once
    if prev != closing:
        found.append(f"closing: last balance {prev}, statement says {closing}")
    return found
```

Three details make it work in practice. Money is `Decimal`, never `float`, or the check fails on rounding instead of on real errors. After a break, the chain re-anchors on the printed balance, so a single missing row reports one break near where it happened, instead of a cascade down the rest of the page. And the closing balance is checked too, because a row missing from the very end leaves every earlier link intact.

The sign rule depends on the account. On a savings account the balance rises with credits. On a loan account it rises with debits, so the same check runs with the sign flipped. Getting that wrong is itself a break, which is the point: the check catches its own bad assumptions.

## Fail loudly, never guess

When the chain breaks, the run exits with a non-zero code and prints each break with its row and the expected and printed balances. It still writes the CSV, so I can open it and look at the rows around the break, but nothing downstream treats that file as good.

The tempting move is to repair the data: find the missing amount from the gap and invent a row to fill it. I never do that. The gap tells you something is wrong; it does not tell you what. A made-up row with the right amount and the wrong date is worse than an honest failure, because now the bad data passes the check.

The same goes for formats. When the tool sees a statement layout it doesn't recognise, it stops with a clear message instead of trying its best. A half-wrong CSV that looks finished is the most expensive output there is, because someone will trust it.

## The same idea, past bank statements

Almost every structured document carries a check like this, if you look for it:

- An invoice's line items sum to its subtotal, and subtotal plus tax equals the total.
- A report prints how many results it found; the table should have that many rows.
- A ledger's debits and credits balance.
- A paginated export prints "page N of M"; you should end up with M pages.

This matters even more when a language model does the extraction. A model can drop a row as easily as a parser can, and it can also write a plausible row that was never there, round an amount, or quietly correct a figure it thinks is a typo. So I check model output the same way: extract the totals and the counts along with the rows, recompute them in code, and compare. The model never grades its own work, and it never gets to fill a gap.

If the numbers disagree, a retry with the failing rows pointed out can help, since the break says exactly where to look. If it still doesn't add up, the document goes to a person. That is a slower path, and it is the only honest one.

Before I write an extractor now, I look for the invariant first. If the document has one, the extractor gets a check for free. If it has none, I know up front that the output will need a person to look at it, and I plan for that instead of discovering it later.
