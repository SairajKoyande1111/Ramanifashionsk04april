import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IndianRupee,
  ShoppingBag,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  XCircle,
  ArrowRight,
  PackageCheck,
  Package,
  Truck,
  CheckCircle2,
  Ban,
  CalendarDays,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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

function formatINR(amount: number) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function GrowthBadge({ value }: { value: number }) {
  if (value > 0) return (
    <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
      <TrendingUp className="h-3 w-3" /> +{value}% vs last month
    </span>
  );
  if (value < 0) return (
    <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
      <TrendingDown className="h-3 w-3" /> {value}% vs last month
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-gray-400 text-xs font-medium">
      <Minus className="h-3 w-3" /> No change vs last month
    </span>
  );
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; badge: string }> = {
  pending:    { label: "Pending",    color: "#f59e0b", icon: Clock,         badge: "bg-amber-100 text-amber-700" },
  approved:   { label: "Approved",   color: "#3b82f6", icon: PackageCheck,  badge: "bg-blue-100 text-blue-700" },
  processing: { label: "Processing", color: "#3b82f6", icon: PackageCheck,  badge: "bg-blue-100 text-blue-700" },
  shipped:    { label: "Shipped",    color: "#8b5cf6", icon: Truck,         badge: "bg-violet-100 text-violet-700" },
  delivered:  { label: "Delivered",  color: "#10b981", icon: CheckCircle2,  badge: "bg-emerald-100 text-emerald-700" },
  cancelled:  { label: "Cancelled",  color: "#ef4444", icon: Ban,           badge: "bg-red-100 text-red-700" },
};

function OrderStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
      {cfg.label}
    </span>
  );
}

const CustomTooltipRevenue = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-pink-600 font-medium">Revenue: {formatINR(payload[0]?.value ?? 0)}</p>
      {payload[1] && <p className="text-blue-600 font-medium">Orders: {payload[1]?.value}</p>}
    </div>
  );
};

const CustomTooltipPie = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-3 py-2 text-sm">
      <p className="font-semibold" style={{ color: payload[0].payload.color }}>{payload[0].name}</p>
      <p className="text-gray-700">{payload[0].value} orders</p>
    </div>
  );
};

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const adminToken = localStorage.getItem("adminToken");

  if (!adminToken) {
    window.location.href = "/admin/ramanifashionlogin";
    return null;
  }

  const { data: a, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/analytics"],
    enabled: !!adminToken,
    refetchInterval: 60000,
  });

  const salesData: any[] = a?.salesData ?? [];
  const statusBreakdown: any[] = a?.orderStatusBreakdown ?? [];

  const currentMonth = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> {currentMonth}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/admin/orders")}
            className="hidden sm:flex items-center gap-2"
            data-testid="button-view-orders"
          >
            View All Orders <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Loading dashboard…</p>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Revenue This Month */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-pink-500 to-rose-600 text-white" data-testid="card-revenue-month">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-pink-100 text-xs font-medium uppercase tracking-wide">Revenue This Month</p>
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <IndianRupee className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold mb-1" data-testid="text-revenue-month">
                    {formatINR(a?.currentMonthRevenue ?? 0)}
                  </p>
                  <p className="text-pink-100 text-xs">
                    Total: {formatINR(a?.totalRevenue ?? 0)}
                  </p>
                  <div className="mt-2">
                    {a?.growthStats?.revenueGrowth !== undefined ? (
                      <span className={`text-xs font-medium flex items-center gap-1 ${a.growthStats.revenueGrowth >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                        {a.growthStats.revenueGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {a.growthStats.revenueGrowth >= 0 ? '+' : ''}{a.growthStats.revenueGrowth}% vs last month
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              {/* Orders This Month */}
              <Card className="border-0 shadow-sm" data-testid="card-orders-month">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Orders This Month</p>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <ShoppingBag className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1" data-testid="text-orders-month">
                    {a?.currentMonthOrders ?? 0}
                  </p>
                  <p className="text-muted-foreground text-xs mb-2">Total all time: {a?.totalOrders ?? 0}</p>
                  <GrowthBadge value={a?.growthStats?.orderGrowth ?? 0} />
                </CardContent>
              </Card>

              {/* Total Customers */}
              <Card className="border-0 shadow-sm" data-testid="card-customers">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Total Customers</p>
                    <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                      <Users className="h-4 w-4 text-violet-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1" data-testid="text-total-customers">
                    {a?.totalCustomers ?? 0}
                  </p>
                  <p className="text-muted-foreground text-xs mb-2">
                    +{a?.currentMonthCustomers ?? 0} joined this month
                  </p>
                  <GrowthBadge value={a?.growthStats?.customerGrowthPercentage ?? 0} />
                </CardContent>
              </Card>

              {/* Pending Orders */}
              <Card className={`border-0 shadow-sm ${(a?.pendingOrders ?? 0) > 0 ? 'ring-2 ring-amber-300 ring-offset-1' : ''}`} data-testid="card-pending-orders">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Pending Orders</p>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1" data-testid="text-pending-orders">
                    {a?.pendingOrders ?? 0}
                  </p>
                  <p className="text-muted-foreground text-xs mb-2">
                    {a?.todayOrders ?? 0} new today
                  </p>
                  {(a?.pendingOrders ?? 0) > 0 && (
                    <button
                      onClick={() => navigate("/admin/orders")}
                      className="text-xs text-amber-600 font-medium flex items-center gap-1 hover:underline"
                      data-testid="button-go-pending-orders"
                    >
                      Review now <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Revenue & Orders Trend */}
              <Card className="border-0 shadow-sm lg:col-span-2" data-testid="card-revenue-chart">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue and orders over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  {salesData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-56 text-muted-foreground space-y-2">
                      <Package className="h-10 w-10 opacity-20" />
                      <p className="text-sm">No order data yet</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={salesData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatINR(v)} width={60} />
                        <Tooltip content={<CustomTooltipRevenue />} />
                        <Area type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={2.5} fill="url(#gradRevenue)" dot={false} activeDot={{ r: 5, fill: '#ec4899' }} />
                        <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} fill="url(#gradOrders)" dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} yAxisId={0} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                  <div className="flex gap-4 mt-2 justify-end">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-0.5 bg-pink-500 inline-block rounded" /> Revenue</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> Orders</span>
                  </div>
                </CardContent>
              </Card>

              {/* Order Status Breakdown */}
              <Card className="border-0 shadow-sm" data-testid="card-order-status">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Order Status</CardTitle>
                  <CardDescription>All-time breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {statusBreakdown.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-56 text-muted-foreground space-y-2">
                      <ShoppingBag className="h-10 w-10 opacity-20" />
                      <p className="text-sm">No orders yet</p>
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={statusBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={78}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {statusBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltipPie />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-1">
                        {statusBreakdown.map((s) => (
                          <div key={s.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                              <span className="text-xs text-gray-600 dark:text-gray-400">{s.name}</span>
                            </div>
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Recent Orders */}
              <Card className="border-0 shadow-sm lg:col-span-2" data-testid="card-recent-orders">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
                    <CardDescription>Latest customer purchases</CardDescription>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => navigate("/admin/orders")} className="text-xs text-pink-600 hover:text-pink-700" data-testid="button-all-orders">
                    See all <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  {!a?.recentOrders?.length ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground space-y-2">
                      <ShoppingBag className="h-10 w-10 opacity-20" />
                      <p className="text-sm">No orders yet</p>
                    </div>
                  ) : (
                    <div className="space-y-0 divide-y divide-gray-50 dark:divide-gray-800">
                      {a.recentOrders.slice(0, 6).map((order: any) => (
                        <div
                          key={order._id}
                          className="flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-1 px-1 rounded-lg transition-colors cursor-pointer"
                          onClick={() => navigate(`/admin/orders`)}
                          data-testid={`row-order-${order._id}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center flex-shrink-0">
                              <ShoppingBag className="h-4 w-4 text-pink-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate" data-testid={`text-order-number-${order._id}`}>
                                {order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.shippingAddress?.fullName || order.userId?.name || "Customer"} · {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <OrderStatusBadge status={order.orderStatus} />
                            <span className="text-sm font-bold text-gray-900 dark:text-white" data-testid={`text-order-amount-${order._id}`}>
                              {formatINR(order.total ?? 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Inventory & Quick Actions */}
              <div className="space-y-4">
                {/* Inventory Alerts */}
                <Card className="border-0 shadow-sm" data-testid="card-inventory-alerts">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Inventory Alerts</CardTitle>
                    <CardDescription>Stock levels needing attention</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div
                      className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 cursor-pointer hover:bg-amber-100 transition-colors"
                      onClick={() => navigate("/admin/inventory")}
                      data-testid="card-low-stock"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-amber-900 dark:text-amber-200">Low Stock</span>
                      </div>
                      <span className="text-xl font-bold text-amber-600" data-testid="text-low-stock">
                        {a?.lowStockProducts ?? 0}
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 cursor-pointer hover:bg-red-100 transition-colors"
                      onClick={() => navigate("/admin/inventory")}
                      data-testid="card-out-of-stock"
                    >
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-900 dark:text-red-200">Out of Stock</span>
                      </div>
                      <span className="text-xl font-bold text-red-600" data-testid="text-out-of-stock">
                        {a?.outOfStockProducts ?? 0}
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                      data-testid="card-total-products"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Products</span>
                      </div>
                      <span className="text-xl font-bold text-gray-700 dark:text-gray-200" data-testid="text-total-products">
                        {a?.totalProducts ?? 0}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => navigate("/admin/inventory")}
                      data-testid="button-go-inventory"
                    >
                      Manage Inventory <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Category Breakdown */}
                {a?.categoryData?.length > 0 && (
                  <Card className="border-0 shadow-sm" data-testid="card-category-breakdown">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">Products by Category</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      {a.categoryData.map((cat: any, i: number) => (
                        <div key={cat.name} className="flex items-center gap-2" data-testid={`row-category-${i}`}>
                          <span className="text-xs text-gray-500 w-24 truncate">{cat.name}</span>
                          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${cat.percentage ?? 0}%`,
                                backgroundColor: ['#ec4899','#8b5cf6','#06b6d4','#f59e0b','#10b981'][i % 5]
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 text-right">{cat.value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
