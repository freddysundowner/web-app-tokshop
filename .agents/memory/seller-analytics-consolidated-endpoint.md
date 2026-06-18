---
name: Seller analytics consolidated endpoint
description: The /analytics page must use ONE call; how the consolidated endpoint is wired and what it expects.
---

The marketplace seller analytics page (`/analytics`) loads from a SINGLE proxy
endpoint: `GET /api/seller/analytics?userId&startDate&endDate`
(`shared-backend/server/routes/analytics.ts`). It returns
`{ range, totals, daily, availability, source }` where every sales/user metric is
split `{ all, show, marketplace }`.

**Why:** the user was explicit and frustrated — the page must make ONE request,
not a fan-out of separate calls. Do not reintroduce per-metric client queries.

**How to apply:**
- The proxy first tries a dedicated upstream route `BASE_URL/sellers/:userId/analytics`
  (one Mongo aggregation). If that 404s / isn't deployed, it falls back to composing
  the same shape by fanning out to existing upstream endpoints server-side. So the
  page keeps working before the dedicated upstream route ships; once it ships the proxy
  uses it automatically (trusts it only if the body has a `totals` field).
- Metric semantics that must stay consistent with the analytics email: sales = order
  `subtotal` (no `total` field on the real model), earnings = stored `earnings`,
  `tokshow` null = marketplace else show, EXCLUDE status cancelled/canceled/refunded.
- `availability` flags gate Buyer Shares / Max Concurrent Viewers / Streamed Time —
  these only light up once rooms carry `shareCount` / `peakViewers` / `startedTime`+`endedTime`.
- Day-bucket span uses `Math.floor(ms/DAY)+1` (NOT round) in BOTH the proxy and the
  client `windowDays`, or you get an extra trailing/future empty day for a 23:59:59 end.
