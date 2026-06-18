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

## Whatnot-style metric → real data mapping (analytics.tsx)

The `/analytics` page mirrors Whatnot (3 metric groups, More dropdowns, one chart driven by selected metric, Show vs Marketplace split via order `tokshow._id`):
- Real & per-day chartable from orders: Est. Sales, Est. Earnings (total − service_fee − stripe_fees), Est. Avg Order Value, Est. Order Count, Buyer Count. All split Show vs Marketplace.
- Real aggregate only (no per-day series from API): Follows (`/api/users/followers/:id` → `totalDoc`), Buyer Referrals (`/api/referral/stats/:id`).
- Number of Lives: count rooms from `GET /api/rooms?userid=<id>` (paginate by page until a page < limit; response may be array | `{data}` | `{rooms}`).
- NOT available from external API (render honest "N/A", never mock): Max Concurrent Viewers (no historical peak), Streamed Time (no duration field), Buyer Shares.

**Why:** user demanded it be "100% like Whatnot"; core principle forbids mock data, so unavailable metrics show N/A states instead of fabricated charts. Any source-filter (All/Show/Marketplace) metric must respect the split on BOTH the card number and the chart (earnings was the bug that broke parity).
