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
  Info,
} from "lucide-react";
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

/* ----------------- consolidated analytics response shape ---------------- */

type Split = { all: number; show: number; marketplace: number };

interface DailyPoint {
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
  daily: DailyPoint[];
  availability: {
    shares: boolean;
    maxConcurrentViewers: boolean;
    streamedTime: boolean;
  };
  source?: "upstream" | "composed";
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

function toInputDate(d: Date): string {
  return dayKey(d);
}

// Parse a yyyy-mm-dd value from a <input type="date"> as a LOCAL date.
// `new Date("2026-06-01")` is parsed as UTC midnight, which renders as the
// previous day in any timezone behind UTC (the off-by-one "jumps to the 31st"
// bug). Building the date from local components avoids that.
function parseInputDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

/* ------------------------------ component -------------------------------- */

export default function Analytics() {
  const { user } = useAuth();
  const { format } = useCurrency();

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
    return Math.max(1, Math.floor(ms / 86_400_000) + 1);
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

  const { data: analytics, isLoading } = useQuery<SellerAnalytics>({
    queryKey: [
      "/api/seller/analytics",
      user?.id,
      rangeStart.toISOString(),
      rangeEnd.toISOString(),
    ],
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("userId", user!.id);
      params.set("startDate", rangeStart.toISOString());
      params.set("endDate", rangeEnd.toISOString());
      const response = await fetchWithAuth(
        `/api/seller/analytics?${params.toString()}`,
        { method: "GET", headers: { "Content-Type": "application/json" } },
      );
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return response.json();
    },
  });

  /* --------------------------- aggregation ------------------------------- */

  const t = analytics?.totals;
  const availability = analytics?.availability ?? {
    shares: false,
    maxConcurrentViewers: false,
    streamedTime: false,
  };

  const followsCount = t?.follows ?? 0;
  const referralsCount = t?.referrals ?? 0;

  // Per-day buckets across the selected window for the chart.
  const dailyBuckets = useMemo(() => {
    const daily = analytics?.daily ?? [];
    return daily.map((b) => {
      const d = new Date(`${b.date}T00:00:00`);
      const label = isNaN(d.getTime())
        ? b.date
        : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const totalSales = b.showSales + b.mpSales;
      const totalOrders = b.showOrders + b.mpOrders;
      return {
        label,
        showSales: b.showSales,
        mpSales: b.mpSales,
        showEarnings: b.showEarnings,
        mpEarnings: b.mpEarnings,
        showOrders: b.showOrders,
        mpOrders: b.mpOrders,
        showBuyers: b.showBuyers,
        mpBuyers: b.mpBuyers,
        showAov: b.showOrders ? b.showSales / b.showOrders : 0,
        mpAov: b.mpOrders ? b.mpSales / b.mpOrders : 0,
        aov: totalOrders ? totalSales / totalOrders : 0,
        lives: b.lives,
      };
    });
  }, [analytics]);

  // Aggregate totals for the selected window.
  const totals = useMemo(() => {
    const daily = analytics?.daily ?? [];
    // Sum lives from the daily breakdown so the metric card always matches
    // the chart bars. The upstream totals.lives can count outside the date
    // range; the daily array is already filtered to the requested window.
    const livesFromDaily = daily.reduce((sum, d) => sum + (d.lives ?? 0), 0);
    return {
      sales: t?.sales.all ?? 0,
      showSales: t?.sales.show ?? 0,
      mpSales: t?.sales.marketplace ?? 0,
      earnings: t?.earnings.all ?? 0,
      showEarnings: t?.earnings.show ?? 0,
      mpEarnings: t?.earnings.marketplace ?? 0,
      aov: t?.aov.all ?? 0,
      showAov: t?.aov.show ?? 0,
      mpAov: t?.aov.marketplace ?? 0,
      orders: t?.orders.all ?? 0,
      showOrders: t?.orders.show ?? 0,
      mpOrders: t?.orders.marketplace ?? 0,
      buyers: t?.buyers.all ?? 0,
      showBuyers: t?.buyers.show ?? 0,
      mpBuyers: t?.buyers.marketplace ?? 0,
      lives: livesFromDaily,
      shares: t?.shares ?? 0,
      maxConcurrentViewers: t?.maxConcurrentViewers ?? 0,
      streamedSeconds: t?.streamedSeconds ?? 0,
    };
  }, [t, analytics?.daily]);

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
      case "shares":
        return availability.shares ? totals.shares : null;
      case "viewers":
        return availability.maxConcurrentViewers ? totals.maxConcurrentViewers : null;
      case "streamedTime":
        return availability.streamedTime ? totals.streamedSeconds : null;
      case "lives":
        return totals.lives;
      default:
        return null; // unavailable metrics
    }
  };

  // Some stream/user metrics only exist once the data source records them.
  const metricAvailable = (def: MetricDef): boolean => {
    switch (def.key) {
      case "shares":
        return availability.shares;
      case "viewers":
        return availability.maxConcurrentViewers;
      case "streamedTime":
        return availability.streamedTime;
      default:
        return def.available;
    }
  };

  const isMetricLoading = (_key: string): boolean => isLoading;

  const formatValue = (def: MetricDef, value: number | null): string => {
    if (value === null) return "N/A";
    if (def.type === "currency") return format(value);
    if (def.type === "duration") {
      // value is in seconds
      const h = Math.floor(value / 3600);
      const m = Math.floor((value % 3600) / 60);
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
        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-analytics-title">
          Analytics
        </h1>

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
                          const d = parseInputDate(e.target.value);
                          if (d) {
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
                          const d = parseInputDate(e.target.value);
                          if (d) {
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
                              {!metricAvailable(m) && (
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
                ) : !metricAvailable(activeMetricDef) ? (
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
                {metricAvailable(activeMetricDef) && activeMetricDef.timeseries && activeMetricDef.split && (
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
