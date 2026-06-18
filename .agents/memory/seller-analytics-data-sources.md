---
name: Seller analytics data sources
description: Where real seller metrics come from vs. the placeholder dashboard widgets in marketplace-app
---

# Seller analytics data sources (marketplace-app)

The shared dashboard widgets are NOT real data:
- `components/dashboard/sales-chart.tsx` and `revenue-chart.tsx` render hardcoded arrays.
- `components/dashboard/metrics-grid.tsx` shows real totals but hardcoded "+x% from last month" deltas.

`/api/dashboard/metrics` proxies external `/orders/dashboard/orders` with NO `userId` and NO auth header forwarded — it is effectively global/unauthenticated, not seller-specific. Do not use it for per-seller analytics.

**Rule:** seller-specific analytics must be computed client-side from `GET /api/orders?userId=<user.id>` (forwards auth + startDate/endDate/page/limit). Response is `{ orders, total, pages, limits, currentPage }`.

**Order amount:** `TokshopOrder.total` is optional and can be missing; prefer it when > 0, else fall back to `calculateOrderTotal(order)` from `@shared/pricing` (items*qty + fees − discount). For per-item math use `quantity || 0` (not `|| 1`) to match shared pricing and avoid fabricated revenue.

**Why:** the seller page `/analytics` was rebuilt to be fully data-driven; trusting `/api/dashboard/metrics` or the placeholder widgets would have shown wrong/global numbers.
