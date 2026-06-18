import type { Express, Request } from "express";
import fetch from "node-fetch";
import { BASE_URL, getAccessToken } from "../utils";

/* -------------------------------------------------------------------------- */
/*  Consolidated seller analytics                                             */
/*                                                                            */
/*  ONE proxy call -> ONE dedicated upstream route:                          */
/*    GET {BASE_URL}/analytics?userId&startDate&endDate                       */
/*                                                                            */
/*  The upstream returns every metric the seller analytics page needs in a   */
/*  single payload (sales / earnings / AOV / orders / buyers split Show vs    */
/*  Marketplace, follows, referrals, shares, lives, max concurrent viewers,  */
/*  streamed time, and a per-day breakdown). This proxy just forwards auth    */
/*  and passes the response straight through.                                 */
/* -------------------------------------------------------------------------- */

function authHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAccessToken(req);
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
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

      const p = new URLSearchParams();
      p.set("userId", userId);
      p.set("startDate", start.toISOString());
      p.set("endDate", end.toISOString());

      const upstream = await fetch(`${BASE_URL}/analytics?${p.toString()}`, {
        method: "GET",
        headers: authHeaders(req),
      });

      if (!upstream.ok) {
        const body = await upstream.text().catch(() => "");
        let parsed: unknown;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = { error: body || upstream.statusText };
        }
        return res.status(upstream.status).json(parsed);
      }

      const data = await upstream.json();
      return res.json(data);
    } catch (error) {
      console.error("Error fetching seller analytics:", error);
      return res.status(500).json({ error: "Failed to fetch seller analytics" });
    }
  });
}
