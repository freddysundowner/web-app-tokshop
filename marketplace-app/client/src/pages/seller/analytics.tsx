import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Receipt,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import type { TokshopOrder, TokshopOrdersResponse } from "@shared/schema";
import { calculateOrderTotal } from "@shared/pricing";
import { useCurrency } from "@/lib/use-currency";

const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
] as const;

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const STATUS_LABELS: Record<string, string> = {
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  ended: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  processing: "hsl(var(--chart-2))",
  shipped: "hsl(var(--chart-1))",
  delivered: "hsl(var(--chart-4))",
  ended: "hsl(var(--chart-4))",
  cancelled: "hsl(var(--chart-3))",
};

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

function getOrderAmount(order: TokshopOrder): number {
  const total = Number(order.total);
  if (total > 0) return total;
  // Fall back to deriving from items + fees when the API omits `total`.
  return calculateOrderTotal(order);
}

export default function Analytics() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const [rangeDays, setRangeDays] = useState<string>("30");

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (parseInt(rangeDays, 10) - 1));
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end };
  }, [rangeDays]);

  const { data, isLoading } = useQuery<TokshopOrdersResponse>({
    queryKey: ["/api/orders", "analytics", user?.id, rangeDays],
    enabled: !!user?.id,
    queryFn: async () => {
      const limit = 200;
      const maxPages = 25; // safety cap (~5000 orders) to bound the request count
      const fetchPage = async (page: number): Promise<TokshopOrdersResponse> => {
        const params = new URLSearchParams();
        if (user?.id) params.set("userId", user.id);
        params.set("startDate", startDate.toISOString());
        params.set("endDate", endDate.toISOString());
        params.set("page", String(page));
        params.set("limit", String(limit));
        const response = await fetchWithAuth(`/api/orders?${params.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        return response.json();
      };

      const first = await fetchPage(1);
      const allOrders: TokshopOrder[] = Array.isArray(first.orders)
        ? [...first.orders]
        : [];
      const totalPages = Math.min(Number(first.pages) || 1, maxPages);
      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2)),
        );
        rest.forEach((r) => {
          if (Array.isArray(r?.orders)) allOrders.push(...r.orders);
        });
      }
      return { ...first, orders: allOrders };
    },
    staleTime: 60_000,
  });

  const orders = useMemo<TokshopOrder[]>(() => {
    const raw = Array.isArray(data?.orders) ? data!.orders : [];
    // Defensive client-side range filter in case the API ignores date params.
    return raw.filter((o) => {
      const d = getOrderDate(o);
      // Exclude undated/unparseable orders from time-window analytics.
      if (!d) return false;
      return d >= startDate && d <= endDate;
    });
  }, [data, startDate, endDate]);

  const stats = useMemo(() => {
    const totalSales = orders.reduce((sum, o) => sum + getOrderAmount(o), 0);
    const totalOrders = orders.length;
    const buyers = new Set<string>();
    orders.forEach((o) => {
      const id = o.customer?._id;
      if (id) buyers.add(id);
    });
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    return {
      totalSales,
      totalOrders,
      uniqueBuyers: buyers.size,
      avgOrderValue,
    };
  }, [orders]);

  const salesTrend = useMemo(() => {
    const days = parseInt(rangeDays, 10);
    const buckets: { key: string; label: string; sales: number; orders: number }[] = [];
    const indexByKey = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      indexByKey.set(key, buckets.length);
      buckets.push({ key, label, sales: 0, orders: 0 });
    }
    orders.forEach((o) => {
      const d = getOrderDate(o);
      if (!d) return;
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate())
        .toISOString()
        .slice(0, 10);
      const idx = indexByKey.get(key);
      if (idx === undefined) return;
      buckets[idx].sales += getOrderAmount(o);
      buckets[idx].orders += 1;
    });
    return buckets;
  }, [orders, rangeDays]);

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, number>();
    orders.forEach((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      if (items.length === 0) {
        const fallback = "Uncategorized";
        totals.set(fallback, (totals.get(fallback) || 0) + getOrderAmount(o));
        return;
      }
      items.forEach((item) => {
        const name = item.productId?.category?.name || "Uncategorized";
        const amount = (Number(item.price) || 0) * (Number(item.quantity) || 0);
        totals.set(name, (totals.get(name) || 0) + amount);
      });
    });
    return Array.from(totals.entries())
      .map(([name, value]) => ({ name, value }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [orders]);

  const statusBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    orders.forEach((o) => {
      const status = (o.status || "processing").toLowerCase();
      counts.set(status, (counts.get(status) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([status, count]) => ({
        status,
        label: STATUS_LABELS[status] || status,
        count,
        color: STATUS_COLORS[status] || "hsl(var(--chart-5))",
      }))
      .sort((a, b) => b.count - a.count);
  }, [orders]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; units: number }>();
    orders.forEach((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((item) => {
        const name = item.productId?.name || "Unknown product";
        const qty = Number(item.quantity) || 0;
        const revenue = (Number(item.price) || 0) * qty;
        const units = qty;
        const existing = map.get(name) || { name, revenue: 0, units: 0 };
        existing.revenue += revenue;
        existing.units += units;
        map.set(name, existing);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  const kpis = [
    {
      title: "Total Sales",
      value: format(stats.totalSales),
      icon: DollarSign,
      testId: "metric-total-sales",
    },
    {
      title: "Orders",
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      testId: "metric-orders",
    },
    {
      title: "Avg Order Value",
      value: format(stats.avgOrderValue),
      icon: Receipt,
      testId: "metric-avg-order-value",
    },
    {
      title: "Unique Buyers",
      value: stats.uniqueBuyers.toLocaleString(),
      icon: Users,
      testId: "metric-unique-buyers",
    },
  ];

  const hasData = orders.length > 0;

  return (
    <div className="py-6">
      <div className="px-4 sm:px-6 md:px-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-foreground"
              data-testid="text-analytics-title"
            >
              Analytics
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your sales performance, top products, and buyer activity.
            </p>
          </div>
          <Select value={rangeDays} onValueChange={setRangeDays}>
            <SelectTrigger className="w-[180px]" data-testid="select-time-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.title} className="shadow border border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </span>
                  <kpi.icon className="h-5 w-5 text-primary" />
                </div>
                {isLoading ? (
                  <div className="mt-3 h-8 w-24 animate-pulse rounded bg-muted" />
                ) : (
                  <div
                    className="mt-2 text-2xl font-bold text-foreground"
                    data-testid={kpi.testId}
                  >
                    {kpi.value}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sales trend */}
        <Card className="mb-8 shadow border border-border">
          <CardHeader className="px-6 py-4 border-b border-border">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Sales Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="h-72 animate-pulse rounded bg-muted" />
            ) : !hasData ? (
              <EmptyState message="No sales in this period yet." />
            ) : (
              <div className="h-72" data-testid="chart-sales-trend">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrend}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      interval="preserveStartEnd"
                      minTickGap={24}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      width={48}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        color: "hsl(var(--popover-foreground))",
                      }}
                      formatter={(value: number) => [format(value), "Sales"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      fill="url(#salesGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category + Status */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card className="shadow border border-border">
            <CardHeader className="px-6 py-4 border-b border-border">
              <CardTitle className="text-lg font-medium">Revenue by Category</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="h-64 animate-pulse rounded bg-muted" />
              ) : categoryBreakdown.length === 0 ? (
                <EmptyState message="No category data yet." />
              ) : (
                <div className="h-64" data-testid="chart-category-breakdown">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          color: "hsl(var(--popover-foreground))",
                        }}
                        formatter={(value: number) => format(value)}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span className="text-sm text-muted-foreground">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow border border-border">
            <CardHeader className="px-6 py-4 border-b border-border">
              <CardTitle className="text-lg font-medium">Order Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="h-64 animate-pulse rounded bg-muted" />
              ) : statusBreakdown.length === 0 ? (
                <EmptyState message="No orders in this period yet." />
              ) : (
                <div className="space-y-4" data-testid="list-status-breakdown">
                  {statusBreakdown.map((s) => {
                    const pct =
                      stats.totalOrders > 0
                        ? Math.round((s.count / stats.totalOrders) * 100)
                        : 0;
                    return (
                      <div key={s.status} data-testid={`status-row-${s.status}`}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{s.label}</span>
                          <span className="text-muted-foreground">
                            {s.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: s.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top products */}
        <Card className="shadow border border-border">
          <CardHeader className="px-6 py-4 border-b border-border">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="h-40 animate-pulse rounded bg-muted" />
            ) : topProducts.length === 0 ? (
              <EmptyState message="No product sales in this period yet." />
            ) : (
              <div className="space-y-3" data-testid="list-top-products">
                {topProducts.map((p, index) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
                    data-testid={`product-row-${index}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground" data-testid={`product-name-${index}`}>
                          {p.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {p.units} unit{p.units === 1 ? "" : "s"} sold
                        </p>
                      </div>
                    </div>
                    <span className="flex-shrink-0 font-semibold text-foreground" data-testid={`product-revenue-${index}`}>
                      {format(p.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center text-center">
      <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
