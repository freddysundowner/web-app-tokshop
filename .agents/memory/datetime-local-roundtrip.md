---
name: Date input timezone round-trip
description: How <input type="date"> and type="datetime-local" must convert to/from stored epochs in the marketplace app to avoid off-by-N-hours / off-by-one-day bugs.
---

# Date/time input round-trip must use LOCAL components

The marketplace stores show/auction times as UTC epoch ms. HTML `type="date"`
and `type="datetime-local"` inputs read and write **local wall-clock** strings
(`yyyy-mm-dd`, `yyyy-mm-ddThh:mm`). Mixing the two with the wrong helper shifts
the time by the user's timezone offset.

**Rules:**
- To FILL an input from a stored epoch: build the string from LOCAL getters
  (`getFullYear/getMonth/getDate/getHours/getMinutes`), NOT `toISOString()`
  (which is UTC and shifts the displayed value by the offset, e.g. ~4h for US
  Eastern).
- To PARSE an input value back: `new Date("yyyy-mm-ddThh:mm")` is correct — the
  spec parses datetime-local (no offset) as LOCAL, so `.getTime()` yields the
  right UTC epoch. BUT `new Date("yyyy-mm-dd")` (date-only) is parsed as UTC
  midnight → previous day in any timezone behind UTC. For date-only inputs,
  split and build `new Date(y, m-1, d)` instead.
- Display lists with date-fns `format(new Date(epoch), ...)` (local) — this is
  already correct and is the reference the inputs must match.

**Why:** Two separate off-by bugs hit this codebase — the seller analytics
"Edit Dates" picker (date-only, off-by-one day) and the schedule-show edit
populate (datetime-local filled via `toISOString`, off by ~4h). Both are the
same UTC-vs-local mismatch.

**How to apply:** Any time you fill or parse a date/datetime input, confirm both
directions use local components so the round-trip is lossless and matches the
list display.
