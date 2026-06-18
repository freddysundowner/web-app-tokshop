import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  BarChart3,
  Info,
} from "lucide-react";
import type { TokshopOrder, TokshopOrdersResponse } from "@shared/schema";
import { calculateOrderTotal } from "@shared/pricing";
import { useCurrency } from "@/lib/use-currency";

/* ----------------------------- metric model ----------------------------- */

type MetricType = "currency" | "number" | "duration";
type GroupKey = "sales" | "user" | "stream";

interface MetricDef {
  key: string;
  label: string;
  type: MetricType;
  split: boolean; // can be broken down into Show vs Marketplace
  timeseries: boolean; // has a per-day breakdown
  available: boolean;
  note?: string;
}

const METRIC_GROUPS: Record<
  GroupKey,
  { label: string; metrics: MetricDef[] }
> = {
  sales: {
    label: "Estimated Sales Metrics",
    metrics: [
      { key: "sales", label: "Est. Sales", type: "currency", split: true, timeseries: true, available: true },
      { key: "earnings", label: "Est. Earnings", type: "currency", split: true, timeseries: true, available: true },
      { key: "aov", label: "Est. Avg Order Value", type: "currency", split: false, timeseries: true, available: true },
      { key: "orders", label: "Est. Order Count", type: "number", split: true, timeseries: true, available: true },
    ],
  },
  user: {
    label: "User Metrics",
    metrics: [
      { key: "buyers", label: "Buyer Count", type: "number", split: true, timeseries: true, available: true },
      { key: "follows", label: "Follows", type: "number", split: false, timeseries: false, available: true, note: "Total current followers. A day-by-day breakdown isn't provided by the data source." },
      { key: "shares", label: "Buyer Shares", type: "number", split: false, timeseries: false, available: false, note: "Share tracking isn't available from the data source yet." },
      { key: "referrals", label: "Buyer Referrals", type: "number", split: false, timeseries: false, available: true, note: "Total referrals. A day-by-day breakdown isn't provided by the data source." },
    ],
  },
  stream: {
    label: "Stream Metrics",
    metrics: [
      { key: "viewers", label: "Max Concurrent Viewers", type: "number", split: false, timeseries: false, available: false, note: "Historical peak viewership isn't recorded by the data source yet." },
      { key: "lives", label: "Number of Lives", type: "number", split: false, timeseries: true, available: true },
      { key: "streamedTime", label: "Streamed Time", type: "duration", split: false, timeseries: false, available: false, note: "Stream duration isn't recorded by the data source yet." },
    ],
  },
};

const SHOW_COLOR = "hsl(var(--chart-1))";
const MARKETPLACE_COLOR = "hsl(var(--chart-5))";

/* ------------------------------- helpers -------------------------------- */

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function getOrderDate(order: TokshopOrder): Date | null {
  if (order.createdAt) {
    const d = new Date(order.createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof order.date === "number") {
    const d = new Date(order.date);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function getOrderSales(order: TokshopOrder): number {
  const total = Number(order.total);
  if (total > 0) return total;
  return calculateOrderTotal(order);
}

function getOrderEarnings(order: TokshopOrder): number {
  const sales = getOrderSales(order);
  const serviceFee = Number(order.service_fee) || Number(order.servicefee) || 0;
  const stripeFees = Number(order.stripe_fees) || 0;
  const earnings = sales - serviceFee - stripeFees;
  return earnings > 0 ? earnings : 0;
}

function isShowOrder(order: TokshopOrder): boolean {
  return !!order.tokshow?._id;
}

function toInputDate(d: Date): string {
  return dayKey(d);
}

/* ------------------------------ component -------------------------------- */

export default function Analytics() {
  const { user } = useAuth();
  const { format } = useCurrency();

  const [activeTab, setActiveTab] = useState<"overview" | "premier">("overview");

  // Default date window: last 14 days (inclusive)
  const [rangeStart, setRangeStart] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 13);
    return d;
  });
  const [rangeEnd, setRangeEnd] = useState<Date>(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  });

  const [selected, setSelected] = useState<Record<GroupKey, string>>({
    sales: "sales",
    user: "buyers",
    stream: "lives",
  });
  const [activeGroup, setActiveGroup] = useState<GroupKey>("sales");
  const [sourceFilter, setSourceFilter] = useState<"all" | "show" | "marketplace">("all");

  const windowDays = useMemo(() => {
    const ms = rangeEnd.getTime() - rangeStart.getTime();
    return Math.max(1, Math.round(ms / 86_400_000) + 1);
  }, [rangeStart, rangeEnd]);

  const shiftRange = (direction: -1 | 1) => {
    const deltaMs = windowDays * 86_400_000;
    setRangeStart((prev) => {
      const d = new Date(prev.getTime() + direction * deltaMs);
      d.setHours(0, 0, 0, 0);
      return d;
    });
    setRangeEnd((prev) => {
      const d = new Date(prev.getTime() + direction * deltaMs);
      d.setHours(23, 59, 59, 999);
      return d;
    });
  };

  /* ------------------------------ data ----------------------------------- */

  const { data: ordersData, isLoading: ordersLoading } = useQuery<TokshopOrdersResponse>({
    queryKey: ["/api/orders", "analytics", user?.id, rangeStart.toISOString(), rangeEnd.toISOString()],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const limit = 200;
      const maxPages = 25;
      const fetchPage = async (page: number): Promise<TokshopOrdersResponse> => {
        const params = new URLSearchParams();
        if (user?.id) params.set("userId", user.id);
        params.set("startDate", rangeStart.toISOString());
        params.set("endDate", rangeEnd.toISOString());
        params.set("page", String(page));
        params.set("limit", String(limit));
        const response = await fetchWithAuth(`/api/orders?${params.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return response.json();
      };
      const first = await fetchPage(1);
      const all: TokshopOrder[] = Array.isArray(first.orders) ? [...first.orders] : [];
      const totalPages = Math.min(Number(first.pages) || 1, maxPages);
      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2)),
        );
        rest.forEach((r) => {
          if (Array.isArray(r?.orders)) all.push(...r.orders);
        });
      }
      return { ...first, orders: all };
    },
  });

  const { data: roomsData, isLoading: roomsLoading } = useQuery<any[]>({
    queryKey: ["/api/rooms", "analytics", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const limit = 200;
      const maxPages = 25;
      const extractRooms = (payload: any): any[] =>
        Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.rooms)
              ? payload.rooms
              : [];
      const fetchPage = async (page: number): Promise<any[]> => {
        const params = new URLSearchParams();
        if (user?.id) params.set("userid", user.id);
        params.set("page", String(page));
        params.set("limit", String(limit));
        const response = await fetchWithAuth(`/api/rooms?${params.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return extractRooms(await response.json());
      };
      const all: any[] = [];
      for (let page = 1; page <= maxPages; page++) {
        const batch = await fetchPage(page);
        all.push(...batch);
        if (batch.length < limit) break;
      }
      return all;
    },
  });

  const { data: followersData, isLoading: followersLoading } = useQuery<any>({
    queryKey: ["/api/users/followers", user?.id],
    enabled: !!user?.id,
    staleTime: 300_000,
    queryFn: async () => {
      const response = await fetchWithAuth(
        `/api/users/followers/${user!.id}?page=1&limit=1`,
        { method: "GET", headers: { "Content-Type": "application/json" } },
      );
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return response.json();
    },
  });

  const { data: referralData, isLoading: referralLoading } = useQuery<any>({
    queryKey: ["/api/referral/stats", user?.id],
    enabled: !!user?.id,
    staleTime: 300_000,
    queryFn: async () => {
      const response = await fetchWithAuth(`/api/referral/stats/${user!.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return response.json();
    },
  });

  /* --------------------------- aggregation ------------------------------- */

  const orders = useMemo<TokshopOrder[]>(() => {
    const raw = Array.isArray(ordersData?.orders) ? ordersData!.orders : [];
    return raw.filter((o) => {
      const d = getOrderDate(o);
      if (!d) return false;
      return d >= rangeStart && d <= rangeEnd;
    });
  }, [ordersData, rangeStart, rangeEnd]);

  const rooms = useMemo<any[]>(() => {
    const raw = Array.isArray(roomsData) ? roomsData : [];
    return raw.filter((r: any) => {
      const ds = r?.createdAt || r?.date;
      if (!ds) return false;
      const d = new Date(ds);
      if (isNaN(d.getTime())) return false;
      return d >= rangeStart && d <= rangeEnd;
    });
  }, [roomsData, rangeStart, rangeEnd]);

  const followsCount = useMemo(() => {
    return (
      Number(followersData?.totalDoc) ||
      Number(followersData?.total) ||
      (Array.isArray(followersData?.data) ? followersData.data.length : 0) ||
      0
    );
  }, [followersData]);

  const referralsCount = useMemo(() => {
    const d = referralData?.data ?? referralData ?? {};
    return (
      Number(d?.totalReferrals) ||
      Number(d?.total) ||
      Number(d?.count) ||
      Number(d?.referrals) ||
      (Array.isArray(d?.referredUsers) ? d.referredUsers.length : 0) ||
      0
    );
  }, [referralData]);

  // Per-day buckets across the selected window for every chartable metric.
  const dailyBuckets = useMemo(() => {
    const buckets = new Map<
      string,
      {
        label: string;
        showSales: number;
        mpSales: number;
        showEarnings: number;
        mpEarnings: number;
        showOrders: number;
        mpOrders: number;
        showBuyers: Set<string>;
        mpBuyers: Set<string>;
        lives: number;
      }
    >();
    const order: string[] = [];
    for (let i = 0; i < windowDays; i++) {
      const d = new Date(rangeStart.getTime() + i * 86_400_000);
      const key = dayKey(d);
      order.push(key);
      buckets.set(key, {
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        showSales: 0,
        mpSales: 0,
        showEarnings: 0,
        mpEarnings: 0,
        showOrders: 0,
        mpOrders: 0,
        showBuyers: new Set(),
        mpBuyers: new Set(),
        lives: 0,
      });
    }

    orders.forEach((o) => {
      const d = getOrderDate(o);
      if (!d) return;
      const b = buckets.get(dayKey(d));
      if (!b) return;
      const isShow = isShowOrder(o);
      const sales = getOrderSales(o);
      const earnings = getOrderEarnings(o);
      const buyerId = o.customer?._id;
      if (isShow) {
        b.showSales += sales;
        b.showEarnings += earnings;
        b.showOrders += 1;
        if (buyerId) b.showBuyers.add(buyerId);
      } else {
        b.mpSales += sales;
        b.mpEarnings += earnings;
        b.mpOrders += 1;
        if (buyerId) b.mpBuyers.add(buyerId);
      }
    });

    rooms.forEach((r: any) => {
      const ds = r?.createdAt || r?.date;
      const d = new Date(ds);
      const b = buckets.get(dayKey(d));
      if (b) b.lives += 1;
    });

    return order.map((key) => {
      const b = buckets.get(key)!;
      return {
        label: b.label,
        showSales: b.showSales,
        mpSales: b.mpSales,
        showEarnings: b.showEarnings,
        mpEarnings: b.mpEarnings,
        showOrders: b.showOrders,
        mpOrders: b.mpOrders,
        showBuyers: b.showBuyers.size,
        mpBuyers: b.mpBuyers.size,
        showAov: b.showOrders ? b.showSales / b.showOrders : 0,
        mpAov: b.mpOrders ? b.mpSales / b.mpOrders : 0,
        aov:
          b.showOrders + b.mpOrders > 0
            ? (b.showSales + b.mpSales) / (b.showOrders + b.mpOrders)
            : 0,
        lives: b.lives,
      };
    });
  }, [orders, rooms, rangeStart, windowDays]);

  // Aggregate totals for the selected window.
  const totals = useMemo(() => {
    const showSales = orders.filter(isShowOrder).reduce((s, o) => s + getOrderSales(o), 0);
    const mpSales = orders.filter((o) => !isShowOrder(o)).reduce((s, o) => s + getOrderSales(o), 0);
    const sales = showSales + mpSales;
    const showEarnings = orders.filter(isShowOrder).reduce((s, o) => s + getOrderEarnings(o), 0);
    const mpEarnings = orders.filter((o) => !isShowOrder(o)).reduce((s, o) => s + getOrderEarnings(o), 0);
    const earnings = showEarnings + mpEarnings;
    const orderCount = orders.length;
    const showOrders = orders.filter(isShowOrder).length;
    const mpOrders = orderCount - showOrders;
    const buyers = new Set<string>();
    const showBuyers = new Set<string>();
    const mpBuyers = new Set<string>();
    orders.forEach((o) => {
      const id = o.customer?._id;
      if (!id) return;
      buyers.add(id);
      if (isShowOrder(o)) showBuyers.add(id);
      else mpBuyers.add(id);
    });
    return {
      sales,
      showSales,
      mpSales,
      earnings,
      showEarnings,
      mpEarnings,
      aov: orderCount ? sales / orderCount : 0,
      orders: orderCount,
      showOrders,
      mpOrders,
      buyers: buyers.size,
      showBuyers: showBuyers.size,
      mpBuyers: mpBuyers.size,
      lives: rooms.length,
    };
  }, [orders, rooms]);

  /* --------------------------- metric values ----------------------------- */

  const metricValue = (key: string): number | null => {
    switch (key) {
      case "sales":
        return sourceFilter === "show" ? totals.showSales : sourceFilter === "marketplace" ? totals.mpSales : totals.sales;
      case "earnings":
        return sourceFilter === "show" ? totals.showEarnings : sourceFilter === "marketplace" ? totals.mpEarnings : totals.earnings;
      case "aov":
        return totals.aov;
      case "orders":
        return sourceFilter === "show" ? totals.showOrders : sourceFilter === "marketplace" ? totals.mpOrders : totals.orders;
      case "buyers":
        return sourceFilter === "show" ? totals.showBuyers : sourceFilter === "marketplace" ? totals.mpBuyers : totals.buyers;
      case "follows":
        return followsCount;
      case "referrals":
        return referralsCount;
      case "lives":
        return totals.lives;
      default:
        return null; // unavailable metrics
    }
  };

  const isMetricLoading = (key: string): boolean => {
    switch (key) {
      case "sales":
      case "earnings":
      case "aov":
      case "orders":
      case "buyers":
        return ordersLoading;
      case "follows":
        return followersLoading;
      case "referrals":
        return referralLoading;
      case "lives":
        return roomsLoading;
      default:
        return false;
    }
  };

  const formatValue = (def: MetricDef, value: number | null): string => {
    if (value === null) return "N/A";
    if (def.type === "currency") return format(value);
    if (def.type === "duration") {
      const h = Math.floor(value / 60);
      const m = Math.round(value % 60);
      return `${h}h ${m}m`;
    }
    return value.toLocaleString();
  };

  /* ------------------------------ chart ---------------------------------- */

  const activeMetricKey = selected[activeGroup];
  const activeMetricDef = METRIC_GROUPS[activeGroup].metrics.find(
    (m) => m.key === activeMetricKey,
  )!;

  const chartData = useMemo(() => {
    return dailyBuckets.map((b) => {
      switch (activeMetricKey) {
        case "sales":
          return { label: b.label, show: b.showSales, marketplace: b.mpSales };
        case "earnings":
          return { label: b.label, show: b.showEarnings, marketplace: b.mpEarnings };
        case "orders":
          return { label: b.label, show: b.showOrders, marketplace: b.mpOrders };
        case "buyers":
          return { label: b.label, show: b.showBuyers, marketplace: b.mpBuyers };
        case "aov":
          return { label: b.label, value: b.aov };
        case "lives":
          return { label: b.label, value: b.lives };
        default:
          return { label: b.label, value: 0 };
      }
    });
  }, [dailyBuckets, activeMetricKey]);

  const showSeries = sourceFilter !== "marketplace";
  const mpSeries = sourceFilter !== "show";

  const tooltipFormatter = (val: number) =>
    activeMetricDef.type === "currency" ? format(val) : val.toLocaleString();

  /* ------------------------------ render --------------------------------- */

  const rangeLabel = `${rangeStart.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} - ${rangeEnd.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  return (
    <div className="py-6">
      <div className="px-4 sm:px-6 md:px-8">
        {/* Title + tabs */}
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-analytics-title">
          Analytics
        </h1>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            data-testid="tab-overview"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("premier")}
            data-testid="tab-premier"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "premier"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Premier Shop
          </button>
        </div>

        {activeTab === "premier" ? (
          <div className="mt-8">
            <Card className="border border-border">
              <CardContent className="flex h-64 flex-col items-center justify-center text-center">
                <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="font-medium text-foreground">Premier Shop analytics</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Premier Shop is a dedicated storefront program. These metrics will
                  appear here once your shop is enrolled.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Date range */}
            <div className="mt-6 flex flex-col gap-2">
              <p className="text-sm font-medium text-muted-foreground">Seller Analytics</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => shiftRange(-1)}
                  data-testid="button-range-prev"
                  aria-label="Previous period"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-xl font-semibold text-foreground" data-testid="text-date-range">
                  {rangeLabel}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => shiftRange(1)}
                  data-testid="button-range-next"
                  aria-label="Next period"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-edit-dates">
                      <Calendar className="mr-2 h-4 w-4" />
                      Edit Dates
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="start-date">Start date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={toInputDate(rangeStart)}
                        max={toInputDate(rangeEnd)}
                        onChange={(e) => {
                          const d = new Date(e.target.value);
                          if (!isNaN(d.getTime())) {
                            d.setHours(0, 0, 0, 0);
                            setRangeStart(d);
                          }
                        }}
                        data-testid="input-start-date"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="end-date">End date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={toInputDate(rangeEnd)}
                        min={toInputDate(rangeStart)}
                        max={toInputDate(new Date())}
                        onChange={(e) => {
                          const d = new Date(e.target.value);
                          if (!isNaN(d.getTime())) {
                            d.setHours(23, 59, 59, 999);
                            setRangeEnd(d);
                          }
                        }}
                        data-testid="input-end-date"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Metric group cards */}
            <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
              {(Object.keys(METRIC_GROUPS) as GroupKey[]).map((groupKey) => {
                const group = METRIC_GROUPS[groupKey];
                const def = group.metrics.find((m) => m.key === selected[groupKey])!;
                const isActive = activeGroup === groupKey;
                const value = metricValue(def.key);
                return (
                  <button
                    key={groupKey}
                    onClick={() => setActiveGroup(groupKey)}
                    data-testid={`metric-group-${groupKey}`}
                    className={`relative bg-card p-5 text-left transition-colors hover:bg-accent/40 ${
                      isActive ? "" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {group.label}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <span
                            className="flex cursor-pointer items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                            data-testid={`dropdown-${groupKey}`}
                          >
                            More <ChevronDown className="h-3 w-3" />
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {group.metrics.map((m) => (
                            <DropdownMenuItem
                              key={m.key}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelected((prev) => ({ ...prev, [groupKey]: m.key }));
                                setActiveGroup(groupKey);
                              }}
                              data-testid={`metric-option-${m.key}`}
                            >
                              <span className="flex-1">{m.label}</span>
                              {!m.available && (
                                <span className="ml-2 text-xs text-muted-foreground">N/A</span>
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-3">
                      {isMetricLoading(def.key) ? (
                        <div className="h-8 w-28 animate-pulse rounded bg-muted" />
                      ) : (
                        <div
                          className="text-2xl font-bold text-foreground"
                          data-testid={`metric-value-${def.key}`}
                        >
                          {formatValue(def, value)}
                        </div>
                      )}
                      <div className="mt-1 text-sm text-muted-foreground">{def.label}</div>
                    </div>
                    <div
                      className={`absolute bottom-0 left-0 h-0.5 w-full transition-colors ${
                        isActive ? "bg-primary" : "bg-transparent"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Chart */}
            <Card className="mt-6 border border-border">
              <CardContent className="p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-medium text-foreground">{activeMetricDef.label}</h3>
                  {activeMetricDef.split && (
                    <Select
                      value={sourceFilter}
                      onValueChange={(v) => setSourceFilter(v as typeof sourceFilter)}
                    >
                      <SelectTrigger className="w-[150px]" data-testid="select-source-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="show">Show</SelectItem>
                        <SelectItem value="marketplace">Marketplace</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {isMetricLoading(activeMetricKey) ? (
                  <div className="h-72 animate-pulse rounded bg-muted" />
                ) : !activeMetricDef.available ? (
                  <ChartEmpty
                    icon={<Info className="mb-3 h-10 w-10 text-muted-foreground/50" />}
                    message={activeMetricDef.note || "This metric isn't available yet."}
                  />
                ) : !activeMetricDef.timeseries ? (
                  <div className="flex h-72 flex-col items-center justify-center text-center">
                    <div className="text-4xl font-bold text-foreground" data-testid="aggregate-value">
                      {formatValue(activeMetricDef, metricValue(activeMetricKey))}
                    </div>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                      {activeMetricDef.note}
                    </p>
                  </div>
                ) : (
                  <div className="h-72" data-testid="chart-main">
                    <ResponsiveContainer width="100%" height="100%">
                      {activeMetricDef.split ? (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" minTickGap={20} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={56} tickFormatter={(v) => (activeMetricDef.type === "currency" ? format(v).replace(/\.00$/, "") : v)} />
                          <Tooltip
                            contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))" }}
                            formatter={(val: number, name: string) => [tooltipFormatter(val), name === "show" ? "Show" : "Marketplace"]}
                          />
                          {showSeries && <Bar dataKey="show" stackId="a" fill={SHOW_COLOR} radius={mpSeries ? [0, 0, 0, 0] : [4, 4, 0, 0]} name="show" />}
                          {mpSeries && <Bar dataKey="marketplace" stackId="a" fill={MARKETPLACE_COLOR} radius={[4, 4, 0, 0]} name="marketplace" />}
                        </BarChart>
                      ) : activeMetricKey === "lives" ? (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" minTickGap={20} />
                          <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={40} />
                          <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))" }} formatter={(val: number) => [val.toLocaleString(), "Lives"]} />
                          <Bar dataKey="value" fill={SHOW_COLOR} radius={[4, 4, 0, 0]} name="Lives" />
                        </BarChart>
                      ) : (
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" minTickGap={20} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={56} tickFormatter={(v) => (activeMetricDef.type === "currency" ? format(v).replace(/\.00$/, "") : v)} />
                          <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))" }} formatter={(val: number) => [tooltipFormatter(val), activeMetricDef.label]} />
                          <Line type="monotone" dataKey="value" stroke={SHOW_COLOR} strokeWidth={2} dot={{ r: 3, fill: SHOW_COLOR }} name={activeMetricDef.label} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Legend */}
                {activeMetricDef.available && activeMetricDef.timeseries && activeMetricDef.split && (
                  <div className="mt-4 flex items-center gap-5 text-sm">
                    {showSeries && (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SHOW_COLOR }} />
                        Show
                      </span>
                    )}
                    {mpSeries && (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: MARKETPLACE_COLOR }} />
                        Marketplace
                      </span>
                    )}
                  </div>
                )}

                <p className="mt-4 text-right text-xs text-muted-foreground">
                  Times shown in your local time zone. Data may take up to a day to update.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function ChartEmpty({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex h-72 flex-col items-center justify-center text-center">
      {icon}
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
