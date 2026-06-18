---
name: Order subtotal is unreliable (bundling)
description: Why order.subtotal undercounts sales in the external Tokshop backend, and what to sum instead
---

# order.subtotal is broken for bundled (live-show/auction) orders

The external Tokshop backend (sandboxapi.iconaapp.com; source delivered as a zip,
`shared/functions.js` + `controllers/orders.js`) stores per-order money fields, but
`subtotal` is NOT a trustworthy sales figure.

**What happens:** an auction order is created via `createOrder()` with
`subtotal = winning bid` (auction path passes `subtotal: orderTotal` where
`orderTotal = highestBid`). In live shows a buyer wins several auctions from one
seller and the items get **bundled into a single order**. On bundle/unbundle the
order's `earnings` is re-summed across all items, but `subtotal` is left at the
first item's value (the unbundle path creates the new order WITHOUT setting
`subtotal`, so it's 0).

**Verified against live data:** `order.earnings == Σ items[].earnings` (correct),
but `order.subtotal != Σ items[].price` (e.g. a 12-item order shows subtotal=1
while Σ item.price=36). This is why analytics "earnings" comes out larger than
"sales": earnings sums every item, subtotal counts one.

**Accurate sales = `Σ order.items[].price`** (sum of each item's winning bid).
At the item level the numbers are consistent: `item.earnings ≈ item.price −
service_fee − stripe_fees`.

**Caveat:** for very large bundles the nested `items` array returned by /orders may
be capped (~20), so summing item.price client-side can itself undercount; the
durable fix is backend-side (keep order.subtotal in sync, or aggregate items).

**How to apply:** when computing seller sales, do not trust `order.subtotal`. Sum
`items[].price` per order, or fix the backend order/bundling code to re-sum
subtotal whenever items change.
