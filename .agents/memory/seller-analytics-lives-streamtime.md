---
name: Seller analytics lives & streamed time
description: How "Number of Lives" and "Streamed Time" must be derived from the room model on the external API.
---

# Lives & streamed time (external analytics controller)

A `rooms` document is created for EVERY scheduled show, and `createShow`
pre-creates a BATCH of future rooms for repeating shows — all with
`started: false`. So counting every room as a "live" massively over-reports
(one repeating show => dozens of fake lives), drowning real lives on the graph
and inflating streamed time.

**Rules:**
- A real live = `started: true`. This matches the app's own definition
  (`roomStats` uses `countDocuments({ started: true })`).
- Range/bucket lives by GO-LIVE time (`startedTime`), NOT `createdAt`. Because
  repeating rooms are pre-created in advance, a live that broadcast inside the
  window can have `createdAt` before it — `createdAt` filtering drops real lives.
  Fall back to `createdAt` only when `startedTime` is missing/0 (legacy).
- Streamed time = `endedTime - startedTime`, only when `endedTime > startedTime`.
  Still-live rooms have no `endedTime` (skip duration, still count the live).
  Cap at 24h: the platform force-ends rooms after ~24h, so a larger span means a
  corrupted/default `startedTime`.

**Why the default is dangerous:** room schema declares
`startedTime: { default: Date.now() }` WITH parentheses — evaluated once at
module load, so every room created in a server lifetime can share the same
constant timestamp. Never trust `startedTime` for non-`started` rooms.

**How to apply:** the fix lives on the EXTERNAL API (delivered as
`attached_assets/analytics-controller-fixed.js`); the Replit `/api/seller/analytics`
route is a pure passthrough and the frontend chart is already correct.
