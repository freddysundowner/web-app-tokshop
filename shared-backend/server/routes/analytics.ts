import type { Express, Request } from "express";
import fetch from "node-fetch";
import { BASE_URL, getAccessToken } from "../utils";

/* -------------------------------------------------------------------------- */
/*  Consolidated seller analytics                                             */
/*                                                                            */
/*  ONE endpoint returns every metric the seller analytics page needs:        */
/*  sales / earnings / AOV / order count / buyers (split Show vs Marketplace) */
/*  + follows + referrals + buyer shares + number of lives + max concurrent   */
/*  viewers + streamed time + a per-day breakdown for the chart.              */
/*                                                                            */
/*  Strategy:                                                                 */
/*   1. Try a dedicated route on the external Node backend                    */
/*        GET {BASE_URL}/sellers/:userId/analytics?startDate&endDate          */
/*      (one efficient Mongo aggregation). If present, return it.             */
/*   2. Otherwise compose the same shape here by fanning out to the existing  */
/*      upstream endpoints, so the page keeps working before that route ships.*/
/* -------------------------------------------------------------------------- */

type Split = { all: number; show: number; marketplace: number };

interface DailyBucket {
  date: string; // YYYY-MM-DD
  showSales: number;
  mpSales: number;
  showEarnings: number;
  mpEarnings: number;
  showOrders: number;
  mpOrders: number;
  showBuyers: number;
  mpBuyers: number;
  lives: number;
}

interface SellerAnalytics {
  range: { startDate: string; endDate: string };
  totals: {
    sales: Split;
    earnings: Split;
    aov: Split;
    orders: Split;
    buyers: Split;
    follows: number;
    referrals: number;
    shares: number;
    lives: number;
    maxConcurrentViewers: number;
    streamedSeconds: number;
  };
  daily: DailyBucket[];
  availability: {
    shares: boolean;
    maxConcurrentViewers: boolean;
    streamedTime: boolean;
  };
  source: "upstream" | "composed";
}

function authHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAccessToken(req);
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getOrderDate(o: any): Date | null {
  if (o?.createdAt) {
    const d = new Date(o.createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof o?.date === "number") {
    const d = new Date(o.date);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function getOrderSales(o: any): number {
  const total = num(o?.total);
  if (total > 0) return total;
  const subtotal = num(o?.subtotal);
  if (subtotal > 0) return subtotal;
  // last resort: subtotal + fees-style fallback
  return num(o?.subtotal) + num(o?.shipping_fee) + num(o?.tax);
}

function getOrderEarnings(o: any): number {
  const stored = num(o?.earnings);
  if (stored > 0) return stored;
  const sales = getOrderSales(o);
  const serviceFee = num(o?.service_fee) || num(o?.servicefee);
  const stripeFees = num(o?.stripe_fees);
  const e = sales - serviceFee - stripeFees;
  return e > 0 ? e : 0;
}

const EXCLUDED_ORDER_STATUSES = new Set(["cancelled", "canceled", "refunded"]);

function isCountableOrder(o: any): boolean {
  const status = String(o?.status || "").toLowerCase();
  return !EXCLUDED_ORDER_STATUSES.has(status);
}

function isShowOrder(o: any): boolean {
  const t = o?.tokshow;
  if (!t) return false;
  if (typeof t === "string") return t.length > 0;
  return !!t._id;
}

function buyerIdOf(o: any): string | null {
  const c = o?.customer;
  if (!c) return null;
  return typeof c === "string" ? c : c._id || null;
}

async function fetchAllPages(
  buildUrl: (page: number) => string,
  extract: (payload: any) => any[],
  req: Request,
  maxPages = 25,
  limit = 200,
): Promise<any[]> {
  const all: any[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const resp = await fetch(buildUrl(page), { method: "GET", headers: authHeaders(req) });
    if (!resp.ok) {
      if (page === 1) throw new Error(`Upstream ${resp.status}`);
      break;
    }
    const batch = extract(await resp.json());
    all.push(...batch);
    if (batch.length < limit) break;
  }
  return all;
}

async function composeAnalytics(
  req: Request,
  userId: string,
  start: Date,
  end: Date,
): Promise<SellerAnalytics> {
  const startISO = start.toISOString();
  const endISO = end.toISOString();

  // ---- fan out (in parallel) to the existing upstream endpoints ----------
  const ordersP = fetchAllPages(
    (page) => {
      const p = new URLSearchParams();
      p.set("userId", userId);
      p.set("startDate", startISO);
      p.set("endDate", endISO);
      p.set("page", String(page));
      p.set("limit", "200");
      return `${BASE_URL}/orders?${p.toString()}`;
    },
    (payload) => (Array.isArray(payload?.orders) ? payload.orders : Array.isArray(payload) ? payload : []),
    req,
  );

  const roomsP = fetchAllPages(
    (page) => {
      const p = new URLSearchParams();
      p.set("userid", userId);
      p.set("page", String(page));
      p.set("limit", "200");
      return `${BASE_URL}/rooms?${p.toString()}`;
    },
    (payload) =>
      Array.isArray(payload?.rooms)
        ? payload.rooms
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [],
    req,
  );

  const followsP = fetch(`${BASE_URL}/users/followers/${userId}?page=1&limit=1`, {
    method: "GET",
    headers: authHeaders(req),
  })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  const referralP = fetch(`${BASE_URL}/users/referalstats/${userId}`, {
    method: "GET",
    headers: authHeaders(req),
  })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  const [ordersRaw, roomsRaw, followsData, referralData] = await Promise.all([
    ordersP.catch(() => [] as any[]),
    roomsP.catch(() => [] as any[]),
    followsP,
    referralP,
  ]);

  // ---- date-window filter ------------------------------------------------
  const orders = ordersRaw.filter((o) => {
    if (!isCountableOrder(o)) return false; // exclude cancelled/refunded
    const d = getOrderDate(o);
    return d && d >= start && d <= end;
  });
  const rooms = roomsRaw.filter((r) => {
    const ds = r?.createdAt || r?.date;
    if (!ds) return false;
    const d = new Date(ds);
    return !isNaN(d.getTime()) && d >= start && d <= end;
  });

  // ---- daily buckets -----------------------------------------------------
  const windowDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1);
  const buckets = new Map<string, DailyBucket & { _showBuyers: Set<string>; _mpBuyers: Set<string> }>();
  const order: string[] = [];
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    const key = dayKey(d);
    order.push(key);
    buckets.set(key, {
      date: key,
      showSales: 0,
      mpSales: 0,
      showEarnings: 0,
      mpEarnings: 0,
      showOrders: 0,
      mpOrders: 0,
      showBuyers: 0,
      mpBuyers: 0,
      lives: 0,
      _showBuyers: new Set(),
      _mpBuyers: new Set(),
    });
  }

  let showSales = 0,
    mpSales = 0,
    showEarnings = 0,
    mpEarnings = 0,
    showOrders = 0,
    mpOrders = 0;
  const allBuyers = new Set<string>();
  const showBuyersAll = new Set<string>();
  const mpBuyersAll = new Set<string>();

  for (const o of orders) {
    const d = getOrderDate(o);
    if (!d) continue;
    const b = buckets.get(dayKey(d));
    const sales = getOrderSales(o);
    const earnings = getOrderEarnings(o);
    const buyer = buyerIdOf(o);
    if (isShowOrder(o)) {
      showSales += sales;
      showEarnings += earnings;
      showOrders += 1;
      if (buyer) {
        showBuyersAll.add(buyer);
        allBuyers.add(buyer);
      }
      if (b) {
        b.showSales += sales;
        b.showEarnings += earnings;
        b.showOrders += 1;
        if (buyer) b._showBuyers.add(buyer);
      }
    } else {
      mpSales += sales;
      mpEarnings += earnings;
      mpOrders += 1;
      if (buyer) {
        mpBuyersAll.add(buyer);
        allBuyers.add(buyer);
      }
      if (b) {
        b.mpSales += sales;
        b.mpEarnings += earnings;
        b.mpOrders += 1;
        if (buyer) b._mpBuyers.add(buyer);
      }
    }
  }

  // ---- stream metrics from rooms ----------------------------------------
  let lives = 0;
  let shares = 0;
  let maxConcurrentViewers = 0;
  let streamedSeconds = 0;
  let hasShares = false;
  let hasPeak = false;
  let hasStreamed = false;

  for (const r of rooms) {
    lives += 1;
    const ds = r?.createdAt || r?.date;
    const d = ds ? new Date(ds) : null;
    if (d && !isNaN(d.getTime())) {
      const b = buckets.get(dayKey(d));
      if (b) b.lives += 1;
    }
    if (r?.shareCount != null) {
      hasShares = true;
      shares += num(r.shareCount);
    }
    if (r?.peakViewers != null) {
      hasPeak = true;
      maxConcurrentViewers = Math.max(maxConcurrentViewers, num(r.peakViewers));
    }
    const startedTime = num(r?.startedTime);
    const endedTime = num(r?.endedTime);
    if (startedTime > 0 && endedTime > startedTime) {
      hasStreamed = true;
      streamedSeconds += Math.round((endedTime - startedTime) / 1000);
    }
  }

  const daily: DailyBucket[] = order.map((key) => {
    const b = buckets.get(key)!;
    return {
      date: b.date,
      showSales: b.showSales,
      mpSales: b.mpSales,
      showEarnings: b.showEarnings,
      mpEarnings: b.mpEarnings,
      showOrders: b.showOrders,
      mpOrders: b.mpOrders,
      showBuyers: b._showBuyers.size,
      mpBuyers: b._mpBuyers.size,
      lives: b.lives,
    };
  });

  const follows =
    num(followsData?.totalDoc) ||
    num(followsData?.total) ||
    (Array.isArray(followsData?.data) ? followsData.data.length : 0);

  const refRoot = referralData?.data ?? referralData ?? {};
  const referrals =
    num(refRoot?.count) ||
    num(refRoot?.total) ||
    num(refRoot?.totalReferrals) ||
    num(refRoot?.referrals);

  const sales = showSales + mpSales;
  const earnings = showEarnings + mpEarnings;
  const orderCount = showOrders + mpOrders;

  return {
    range: { startDate: startISO, endDate: endISO },
    totals: {
      sales: { all: sales, show: showSales, marketplace: mpSales },
      earnings: { all: earnings, show: showEarnings, marketplace: mpEarnings },
      orders: { all: orderCount, show: showOrders, marketplace: mpOrders },
      buyers: { all: allBuyers.size, show: showBuyersAll.size, marketplace: mpBuyersAll.size },
      aov: {
        all: orderCount > 0 ? sales / orderCount : 0,
        show: showOrders > 0 ? showSales / showOrders : 0,
        marketplace: mpOrders > 0 ? mpSales / mpOrders : 0,
      },
      follows,
      referrals,
      shares,
      lives,
      maxConcurrentViewers,
      streamedSeconds,
    },
    daily,
    availability: {
      shares: hasShares,
      maxConcurrentViewers: hasPeak,
      streamedTime: hasStreamed,
    },
    source: "composed",
  };
}

export function registerAnalyticsRoutes(app: Express) {
  app.get("/api/seller/analytics", async (req, res) => {
    try {
      const userId =
        (req.query.userId as string) ||
        (req.query.userid as string) ||
        (req as any).session?.user?._id ||
        "";
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const now = new Date();
      const defStart = new Date(now);
      defStart.setDate(defStart.getDate() - 13);
      defStart.setHours(0, 0, 0, 0);

      const start = req.query.startDate ? new Date(req.query.startDate as string) : defStart;
      const end = req.query.endDate ? new Date(req.query.endDate as string) : now;
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "Invalid startDate/endDate" });
      }

      // 1) Try a dedicated upstream route (one efficient aggregation).
      try {
        const p = new URLSearchParams();
        p.set("startDate", start.toISOString());
        p.set("endDate", end.toISOString());
        const upstreamUrl = `${BASE_URL}/sellers/${userId}/analytics?${p.toString()}`;
        const upstream = await fetch(upstreamUrl, { method: "GET", headers: authHeaders(req) });
        if (upstream.ok) {
          const data = await upstream.json();
          // Only trust it if it looks like our shape.
          if (data && typeof data === "object" && (data as any).totals) {
            return res.json({ ...(data as any), source: "upstream" });
          }
        }
      } catch {
        // ignore — fall through to composed
      }

      // 2) Compose from existing upstream endpoints.
      const composed = await composeAnalytics(req, userId, start, end);
      return res.json(composed);
    } catch (error) {
      console.error("Error building seller analytics:", error);
      return res.status(500).json({ error: "Failed to build seller analytics" });
    }
  });
}
