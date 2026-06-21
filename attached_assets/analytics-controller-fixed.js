// controllers/analytics.js
const mongoose = require("mongoose");
const itemModel = require("../models/item");
const orderModel = require("../models/order");
const roomModel = require("../models/room");
const userModel = require("../models/user");
const ReferralLog = require("../models/referral_log"); // adjust path/name to yours

const EXCLUDED = ["cancelled", "canceled", "refunded"];
const DAY = 86_400_000;

function dayKey(ms) {
    const d = new Date(ms);
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${d.getUTCFullYear()}-${m}-${day}`;
}

// Snap a date to the start (00:00:00.000) or end (23:59:59.999) of its UTC day,
// so daily buckets line up with the UTC dayKey() the items are assigned to and
// the window day-count is never off by one.
function utcDayStart(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}
function utcDayEnd(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

exports.getSellerAnalytics = async (req, res) => {
    try {
        // The endpoint is called as /analytics?userId=... (query string).
        // Read from query first, fall back to params. Guard against a missing /
        // invalid id so we fail loudly with 400 instead of letting
        // `new mongoose.Types.ObjectId(undefined)` mint a RANDOM id that
        // silently matches nothing and returns all zeros.
        const userId = req.query.userId || req.params.userId;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "A valid userId is required" });
        }
        const sellerId = new mongoose.Types.ObjectId(userId);

        // Parse + validate the range. Reject unparseable dates and inverted
        // ranges with a clear 400 instead of letting NaN times reach the query.
        const rawStart = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 13 * DAY);
        const rawEnd = req.query.endDate ? new Date(req.query.endDate) : new Date();
        if (isNaN(rawStart.getTime()) || isNaN(rawEnd.getTime())) {
            return res.status(400).json({ error: "Invalid startDate or endDate" });
        }
        if (rawStart.getTime() > rawEnd.getTime()) {
            return res.status(400).json({ error: "startDate must be before endDate" });
        }
        // Snap to UTC day boundaries so the inclusive [start, end] range and the
        // daily buckets always agree on day count and alignment.
        const start = utcDayStart(rawStart);
        const end = utcDayEnd(rawEnd);
        const startMs = start.getTime();
        const endMs = end.getTime();

        // ----- ITEMS are the source of truth -----------------------------------
        // order.subtotal is unreliable: when live-show / auction items are bundled
        // into one order, the order's `earnings` is re-summed but `subtotal` is
        // left stuck on a single item (and the unbundle path never sets it). Each
        // ITEM, however, carries its own real price (winning bid) + earnings, plus
        // seller / customer / tokshow / status / createdAt. So we aggregate items.
        // An item can still read as "processing" while its parent order was
        // cancelled/refunded. Fetch the cancelled order ids for this seller in
        // range and exclude their items too, so sales/earnings don't count
        // money that was reversed.
        const cancelledOrders = await orderModel
            .find({ seller: sellerId, status: { $in: EXCLUDED } })
            .select("_id")
            .lean();
        const cancelledOrderIds = cancelledOrders.map((o) => o._id);

        const items = await itemModel
            .find({
                seller: sellerId,
                status: { $nin: EXCLUDED },
                orderId: { $nin: cancelledOrderIds },
                createdAt: { $gte: start, $lte: end },
            })
            .select("price earnings tokshow customer orderId createdAt")
            .lean();

        // ----- rooms = live shows (lives, streamed time) -----
        // A room document is created for EVERY scheduled show, and `createShow`
        // even pre-creates a batch of future rooms for repeating shows. Most of
        // those never actually broadcast. The app's own definition of a "live"
        // (see roomStats: countDocuments({ started: true })) is `started: true`,
        // so we only count rooms that actually went live. Counting every room
        // inflated the live count (e.g. one repeating show => dozens of fake
        // lives) which both skewed the graph and made streamed time wrong
        // (never-started rooms carry a default/auto-end timestamp that produced
        // bogus durations).
        // Range by GO-LIVE time, not creation time: repeating shows are
        // pre-created in advance (createShow inserts future rooms immediately),
        // so a real live that broadcast inside the window can have a createdAt
        // before it. Match on startedTime within the window, and fall back to
        // createdAt only for rooms whose startedTime is missing/zero (legacy).
        const rooms = await roomModel
            .find({
                owner: sellerId,
                started: true,
                $or: [
                    { startedTime: { $gte: startMs, $lte: endMs } },
                    { startedTime: { $in: [null, 0] }, createdAt: { $gte: start, $lte: end } },
                ],
            })
            .select("createdAt startedTime endedTime started ended peakViewers shareCount")
            .lean();

        // ----- followers + referrals -----
        const [userDoc, refAgg] = await Promise.all([
            userModel.findById(sellerId).select("followers followersCount").lean(),
            ReferralLog.aggregate([
                { $match: { referrerId: sellerId } },
                { $lookup: { from: "users", localField: "referredUserId", foreignField: "_id", as: "ru" } },
                { $unwind: "$ru" },
                { $match: { "ru.awarded_referal_credit": true } },
                { $count: "count" },
            ]),
        ]);

        // ----- build daily buckets -----
        const windowDays = Math.max(1, Math.floor((endMs - startMs) / DAY) + 1);
        const buckets = new Map();
        const orderKeys = [];
        for (let i = 0; i < windowDays; i++) {
            const key = dayKey(startMs + i * DAY);
            orderKeys.push(key);
            buckets.set(key, {
                date: key, showSales: 0, mpSales: 0, showEarnings: 0, mpEarnings: 0,
                _showO: new Set(), _mpO: new Set(), _showB: new Set(), _mpB: new Set(), lives: 0,
            });
        }

        let showSales = 0, mpSales = 0, showEarnings = 0, mpEarnings = 0;
        const allB = new Set(), showB = new Set(), mpB = new Set();
        const allO = new Set(), showO = new Set(), mpO = new Set();

        for (const it of items) {
            const b = buckets.get(dayKey(new Date(it.createdAt).getTime()));
            const sales = Number(it.price) || 0;       // real per-item price (winning bid)
            const earn = Number(it.earnings) || 0;     // real per-item earnings
            const buyer = it.customer ? String(it.customer) : null;
            const ord = it.orderId ? String(it.orderId) : null;
            const isShow = !!it.tokshow;
            if (isShow) {
                showSales += sales; showEarnings += earn;
                if (buyer) { showB.add(buyer); allB.add(buyer); }
                if (ord) { showO.add(ord); allO.add(ord); }
                if (b) {
                    b.showSales += sales; b.showEarnings += earn;
                    if (buyer) b._showB.add(buyer);
                    if (ord) b._showO.add(ord);
                }
            } else {
                mpSales += sales; mpEarnings += earn;
                if (buyer) { mpB.add(buyer); allB.add(buyer); }
                if (ord) { mpO.add(ord); allO.add(ord); }
                if (b) {
                    b.mpSales += sales; b.mpEarnings += earn;
                    if (buyer) b._mpB.add(buyer);
                    if (ord) b._mpO.add(ord);
                }
            }
        }

        let lives = 0, shares = 0, maxConcurrentViewers = 0, streamedSeconds = 0;
        let hasShares = false, hasPeak = false, hasStreamed = false;
        for (const r of rooms) {
            lives++;
            // Bucket each live on the day it actually went live (startedTime).
            // Fall back to createdAt when startedTime is missing or lands outside
            // the requested window.
            const startMsR = Number(r.startedTime) || 0;
            const bucketMs =
                startMsR >= startMs && startMsR <= endMs ? startMsR : new Date(r.createdAt).getTime();
            const b = buckets.get(dayKey(bucketMs));
            if (b) b.lives++;
            if (r.shareCount != null) { hasShares = true; shares += Number(r.shareCount) || 0; }
            if (r.peakViewers != null) { hasPeak = true; maxConcurrentViewers = Math.max(maxConcurrentViewers, Number(r.peakViewers) || 0); }
            // Streamed time = endedTime - startedTime, only for lives that have
            // actually ended with a sane end-after-start timestamp. A still-live
            // room has no endedTime and is skipped (it still counts as a live).
            // Cap at 24h: the platform force-ends rooms after ~24h, so a larger
            // span means a corrupted/default startedTime and is excluded.
            const e = Number(r.endedTime) || 0;
            const durSec = startMsR > 0 && e > startMsR ? Math.round((e - startMsR) / 1000) : 0;
            if (durSec > 0 && durSec <= 86_400) { hasStreamed = true; streamedSeconds += durSec; }
        }

        const daily = orderKeys.map((k) => {
            const b = buckets.get(k);
            return {
                date: b.date, showSales: b.showSales, mpSales: b.mpSales,
                showEarnings: b.showEarnings, mpEarnings: b.mpEarnings,
                showOrders: b._showO.size, mpOrders: b._mpO.size,
                showBuyers: b._showB.size, mpBuyers: b._mpB.size, lives: b.lives,
            };
        });

        const sales = showSales + mpSales;
        const earnings = showEarnings + mpEarnings;
        const orderCount = allO.size, showOrderCount = showO.size, mpOrderCount = mpO.size;

        return res.json({
            range: { startDate: start.toISOString(), endDate: end.toISOString() },
            totals: {
                sales: { all: sales, show: showSales, marketplace: mpSales },
                earnings: { all: earnings, show: showEarnings, marketplace: mpEarnings },
                orders: { all: orderCount, show: showOrderCount, marketplace: mpOrderCount },
                buyers: { all: allB.size, show: showB.size, marketplace: mpB.size },
                aov: {
                    all: orderCount ? sales / orderCount : 0,
                    show: showOrderCount ? showSales / showOrderCount : 0,
                    marketplace: mpOrderCount ? mpSales / mpOrderCount : 0,
                },
                follows: userDoc?.followers?.length || Number(userDoc?.followersCount) || 0,
                referrals: refAgg[0]?.count || 0,
                shares, lives, maxConcurrentViewers, streamedSeconds,
            },
            daily,
            availability: { shares: hasShares, maxConcurrentViewers: hasPeak, streamedTime: hasStreamed },
        });
    } catch (err) {
        console.error("getSellerAnalytics error:", err);
        return res.status(500).json({ error: "Failed to build seller analytics" });
    }
};
