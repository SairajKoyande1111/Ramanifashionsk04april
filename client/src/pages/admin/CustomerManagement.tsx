import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Eye, Users, ShoppingBag, Heart, Package, ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  completedOrders: number;
  wishlistCount: number;
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  selectedColor?: string | null;
  selectedSize?: string | null;
}

interface FullOrder {
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  shippingCharges: number;
  tax: number;
  discount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: {
    fullName?: string;
    phone?: string;
    address?: string;
    locality?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  };
  createdAt: string;
}

interface WishlistItem {
  _id: string;
  name: string;
  price: number;
  images: string[];
  colorVariants?: { color: string; images: string[] }[];
}

interface Customer {
  _id: string;
  phone: string;
  name: string;
  email: string;
  dob?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  };
  phoneVerified: boolean;
  notifyUpdates: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  stats: CustomerStats;
  recentOrders: { orderId: string; orderNumber: string; total: number; status: string; paymentStatus: string; createdAt: string }[];
  wishlistItems: WishlistItem[];
}

export default function CustomerManagement() {
  const [location, setLocation] = useLocation();
  const adminToken = localStorage.getItem("adminToken");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [page, setPage] = useState(1);
  const [paidUsersOnly, setPaidUsersOnly] = useState(false);
  const [filterCity, setFilterCity] = useState("");
  const [filterState, setFilterState] = useState("");
  const [lastActivityDays, setLastActivityDays] = useState("");
  const limit = 10;

  // Order detail dialog inside customer dialog
  const [selectedOrder, setSelectedOrder] = useState<FullOrder | null>(null);
  const [orderPage, setOrderPage] = useState(1);
  const orderLimit = 10;

  const { data: customersData, isLoading, error } = useQuery<{
    customers: Customer[];
    summary: { totalRevenue: number; totalOrders: number };
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>({
    queryKey: ["/api/admin/customers", searchQuery, sortBy, sortOrder, page, limit, paidUsersOnly, filterCity, filterState, lastActivityDays],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      params.set('sort', sortBy);
      params.set('order', sortOrder);
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (paidUsersOnly) params.set('paidUsers', 'true');
      if (filterCity) params.set('city', filterCity);
      if (filterState) params.set('state', filterState);
      if (lastActivityDays && lastActivityDays !== 'all') params.set('lastActivityDays', lastActivityDays);
      const res = await fetch(`/api/admin/customers?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch customers: ${res.statusText}`);
      return res.json();
    },
    enabled: !!adminToken,
    refetchInterval: 30000,
  });

  // Fetch full paginated orders for selected customer
  const { data: ordersData, isLoading: ordersLoading } = useQuery<{
    orders: FullOrder[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>({
    queryKey: ["/api/admin/customers", selectedCustomer?._id, "orders", orderPage, orderLimit],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/customers/${selectedCustomer!._id}/orders?page=${orderPage}&limit=${orderLimit}`,
        { headers: { 'Authorization': `Bearer ${adminToken}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    enabled: !!adminToken && !!selectedCustomer,
  });

  const customers = customersData?.customers || [];
  const pagination = customersData?.pagination;
  const summary = customersData?.summary;
  const customerOrders = ordersData?.orders || [];
  const ordersPagination = ordersData?.pagination;

  const getUniqueCaseInsensitive = (values: string[]): string[] => {
    const seenLower = new Map<string, string>();
    values.forEach(value => {
      const lower = value.toLowerCase();
      if (!seenLower.has(lower)) seenLower.set(lower, value);
    });
    return Array.from(seenLower.values()).sort();
  };

  const { uniqueCities, uniqueStates } = useMemo(() => {
    const cities: string[] = [];
    const states: string[] = [];
    customers.forEach(c => {
      if (c.address?.city) cities.push(c.address.city);
      if (c.address?.state) states.push(c.address.state);
    });
    return { uniqueCities: getUniqueCaseInsensitive(cities), uniqueStates: getUniqueCaseInsensitive(states) };
  }, [customers]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const formatDate = (date: string | undefined) => {
    if (!date) return "Never";
    try { return formatDistanceToNow(new Date(date), { addSuffix: true }); } catch { return "Invalid date"; }
  };

  const formatFullDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      approved: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      processing: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      shipped: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
      delivered: "bg-green-500/10 text-green-700 dark:text-green-400",
      cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
      paid: "bg-green-500/10 text-green-700 dark:text-green-400",
      failed: "bg-red-500/10 text-red-700 dark:text-red-400",
    };
    return map[status] || "bg-gray-500/10 text-gray-700";
  };

  const handleOpenCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOrderPage(1);
    setSelectedOrder(null);
  };

  const handleCloseCustomer = () => {
    setSelectedCustomer(null);
    setSelectedOrder(null);
    setOrderPage(1);
  };

  if (!adminToken) {
    setLocation("/admin/login");
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Customer Management</h1>
          <p className="text-muted-foreground">View and manage customer information</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-customers">{pagination?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-orders">
                {summary?.totalOrders ?? customers.reduce((sum, c) => sum + c.stats.totalOrders, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-revenue">
                {formatCurrency(summary?.totalRevenue ?? customers.reduce((sum, c) => sum + c.stats.totalSpent, 0))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wishlists</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-wishlists">
                {customers.reduce((sum, c) => sum + c.stats.wishlistCount, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Search & Filter</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by phone, name, or email..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    className="pl-8"
                    data-testid="input-search-customers"
                  />
                </div>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]" data-testid="select-sort-by">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Join Date</SelectItem>
                  <SelectItem value="lastLogin">Last Login</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="phone">Phone Number</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(v: "asc" | "desc") => setSortOrder(v)}>
                <SelectTrigger className="w-[150px]" data-testid="select-sort-order">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 border-t pt-4">
              <div className="text-sm font-medium">Advanced Filters</div>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[150px]">
                  <Select value={filterCity || "all"} onValueChange={(v) => { setFilterCity(v === "all" ? "" : v); setPage(1); }}>
                    <SelectTrigger data-testid="select-filter-city"><SelectValue placeholder="Filter by city..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {uniqueCities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Select value={filterState || "all"} onValueChange={(v) => { setFilterState(v === "all" ? "" : v); setPage(1); }}>
                    <SelectTrigger data-testid="select-filter-state"><SelectValue placeholder="Filter by state..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {uniqueStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={lastActivityDays} onValueChange={(v) => { setLastActivityDays(v); setPage(1); }}>
                  <SelectTrigger className="w-[180px]" data-testid="select-last-activity"><SelectValue placeholder="Last Activity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7">Active in 7 days</SelectItem>
                    <SelectItem value="30">Active in 30 days</SelectItem>
                    <SelectItem value="90">Active in 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant={paidUsersOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setPaidUsersOnly(!paidUsersOnly); setPage(1); }}
                  data-testid="button-paid-users-filter"
                >
                  {paidUsersOnly ? "✓ Paid Users" : "Paid Users"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Customers ({pagination?.total || 0})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading customers...</div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No customers found</div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Total Orders</TableHead>
                        <TableHead>Total Spent</TableHead>
                        <TableHead>Wishlist</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer._id} data-testid={`row-customer-${customer._id}`}>
                          <TableCell className="font-medium" data-testid={`text-phone-${customer._id}`}>
                            {customer.phone}
                            {customer.phoneVerified && <Badge variant="secondary" className="ml-2 text-xs">Verified</Badge>}
                          </TableCell>
                          <TableCell data-testid={`text-name-${customer._id}`}>
                            {customer.name
                              ? customer.name
                              : customer.shippingName
                                ? <span>{customer.shippingName} <span className="text-xs text-muted-foreground">(from order)</span></span>
                                : <span className="text-muted-foreground italic">Not provided</span>
                            }
                          </TableCell>
                          <TableCell data-testid={`text-email-${customer._id}`}>
                            {customer.email || <span className="text-muted-foreground italic">Not provided</span>}
                          </TableCell>
                          <TableCell data-testid={`text-orders-${customer._id}`}>
                            <Badge variant="outline">{customer.stats.totalOrders}</Badge>
                          </TableCell>
                          <TableCell data-testid={`text-spent-${customer._id}`}>
                            {formatCurrency(customer.stats.totalSpent)}
                          </TableCell>
                          <TableCell data-testid={`text-wishlist-${customer._id}`}>
                            <Badge variant="outline">{customer.stats.wishlistCount}</Badge>
                          </TableCell>
                          <TableCell data-testid={`text-last-login-${customer._id}`}>{formatDate(customer.lastLogin)}</TableCell>
                          <TableCell data-testid={`text-joined-${customer._id}`}>{formatDate(customer.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenCustomer(customer)}
                              data-testid={`button-view-${customer._id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {error && <div className="text-center py-4 text-destructive">Error loading customers. Please try again.</div>}

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, pagination.total)} of {pagination.total} customers
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1 || isLoading} data-testid="button-prev-page">
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</span>
                      <Button variant="outline" size="sm" onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page >= pagination.totalPages || isLoading} data-testid="button-next-page">
                        Next <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={handleCloseCustomer}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle>
                Customer Details — {selectedCustomer?.name || selectedCustomer?.phone}
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedCustomer) {
                    setLocation(`/admin/customers/${selectedCustomer._id}`);
                    handleCloseCustomer();
                  }
                }}
                data-testid="button-open-full-page"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open Full Page
              </Button>
            </div>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Personal Info + Address */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <div className="text-muted-foreground font-medium">Phone</div>
                      <div className="flex items-center gap-2">
                        <span data-testid="detail-phone">{selectedCustomer.phone}</span>
                        {selectedCustomer.phoneVerified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground font-medium">Name</div>
                      <div data-testid="detail-name">{selectedCustomer.name || <span className="italic text-muted-foreground">Not provided</span>}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground font-medium">Email</div>
                      <div data-testid="detail-email">{selectedCustomer.email || <span className="italic text-muted-foreground">Not provided</span>}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground font-medium">Date of Birth</div>
                      <div>{selectedCustomer.dob ? new Date(selectedCustomer.dob).toLocaleDateString('en-IN') : <span className="italic text-muted-foreground">Not provided</span>}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground font-medium">Last Login</div>
                      <div>{selectedCustomer.lastLogin ? formatFullDate(selectedCustomer.lastLogin) : <span className="italic text-muted-foreground">Never</span>}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground font-medium">Member Since</div>
                      <div>{formatFullDate(selectedCustomer.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground font-medium">Notifications</div>
                      <Badge variant={selectedCustomer.notifyUpdates ? "default" : "secondary"}>
                        {selectedCustomer.notifyUpdates ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Address</CardTitle></CardHeader>
                  <CardContent className="text-sm">
                    {selectedCustomer.address && (selectedCustomer.address.street || selectedCustomer.address.city) ? (
                      <div className="space-y-1">
                        {selectedCustomer.address.street && <div>{selectedCustomer.address.street}</div>}
                        {selectedCustomer.address.landmark && <div>{selectedCustomer.address.landmark}</div>}
                        <div>
                          {selectedCustomer.address.city}{selectedCustomer.address.city && selectedCustomer.address.state ? ', ' : ''}{selectedCustomer.address.state}
                        </div>
                        {selectedCustomer.address.pincode && <div>PIN: {selectedCustomer.address.pincode}</div>}
                      </div>
                    ) : <div className="italic text-muted-foreground">No address provided</div>}
                  </CardContent>
                </Card>
              </div>

              {/* Stats */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {[
                  { label: "Total Orders", value: selectedCustomer.stats.totalOrders },
                  { label: "Total Spent", value: formatCurrency(selectedCustomer.stats.totalSpent) },
                  { label: "Completed", value: selectedCustomer.stats.completedOrders },
                  { label: "Pending", value: selectedCustomer.stats.pendingOrders },
                ].map(stat => (
                  <Card key={stat.label}>
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{stat.label}</CardTitle></CardHeader>
                    <CardContent><div className="text-xl font-bold">{stat.value}</div></CardContent>
                  </Card>
                ))}
              </div>

              {/* All Orders with Pagination */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    All Orders ({ordersPagination?.total ?? selectedCustomer.stats.totalOrders})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="text-center py-6 text-muted-foreground">Loading orders…</div>
                  ) : customerOrders.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground italic">No orders yet</div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {customerOrders.map((order) => (
                          <div key={order.orderId}>
                            <button
                              className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                              onClick={() => setSelectedOrder(selectedOrder?.orderId === order.orderId ? null : order)}
                              data-testid={`button-order-${order.orderId}`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-sm">{order.orderNumber}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">{formatFullDate(order.createdAt)}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="font-semibold">{formatCurrency(order.total)}</div>
                                    <div className="flex gap-1 mt-1 justify-end">
                                      <Badge className={`text-xs ${getStatusColor(order.status)}`}>{order.status}</Badge>
                                      <Badge className={`text-xs ${getStatusColor(order.paymentStatus)}`}>{order.paymentStatus}</Badge>
                                    </div>
                                  </div>
                                  <span className="text-muted-foreground text-xs">{selectedOrder?.orderId === order.orderId ? "▲" : "▼"}</span>
                                </div>
                              </div>
                            </button>

                            {/* Expanded Order Detail */}
                            {selectedOrder?.orderId === order.orderId && (
                              <div className="border border-t-0 rounded-b-lg p-4 bg-muted/30 space-y-4">
                                {/* Order Items */}
                                <div>
                                  <div className="text-sm font-semibold mb-2">Items</div>
                                  <div className="space-y-2">
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-3 bg-background rounded-md p-2">
                                        {item.image && (
                                          <img src={item.image} alt={item.name} className="w-12 h-14 object-cover rounded flex-shrink-0"
                                            onError={(e) => { e.currentTarget.src = '/default-saree.jpg'; }} />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">{item.name}</div>
                                          <div className="flex flex-wrap gap-1 mt-0.5">
                                            {item.selectedColor && (
                                              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Color: {item.selectedColor}</span>
                                            )}
                                            {item.selectedSize && (
                                              <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-medium">Size: {item.selectedSize}</span>
                                            )}
                                          </div>
                                          <div className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity} × {formatCurrency(item.price)}</div>
                                        </div>
                                        <div className="font-semibold text-sm">{formatCurrency(item.price * item.quantity)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <Separator />

                                {/* Shipping + Summary side by side */}
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <div className="text-sm font-semibold mb-2">Shipping Address</div>
                                    <div className="text-sm space-y-0.5 text-muted-foreground">
                                      {order.shippingAddress?.fullName && <div className="font-medium text-foreground">{order.shippingAddress.fullName}</div>}
                                      {order.shippingAddress?.phone && <div>{order.shippingAddress.phone}</div>}
                                      {order.shippingAddress?.address && <div>{order.shippingAddress.address}</div>}
                                      {order.shippingAddress?.locality && <div>{order.shippingAddress.locality}</div>}
                                      <div>
                                        {order.shippingAddress?.city}{order.shippingAddress?.city && order.shippingAddress?.state ? ', ' : ''}{order.shippingAddress?.state}
                                        {order.shippingAddress?.pincode ? ` — ${order.shippingAddress.pincode}` : ''}
                                      </div>
                                      {order.shippingAddress?.landmark && <div>Landmark: {order.shippingAddress.landmark}</div>}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold mb-2">Order Summary</div>
                                    <div className="text-sm space-y-1">
                                      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shippingCharges ? formatCurrency(order.shippingCharges) : 'Free'}</span></div>
                                      {order.tax > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(order.tax)}</span></div>}
                                      {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatCurrency(order.discount)}</span></div>}
                                      <Separator />
                                      <div className="flex justify-between font-bold"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
                                      <div className="flex justify-between mt-1"><span className="text-muted-foreground">Payment</span><span className="capitalize">{order.paymentMethod}</span></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Orders Pagination */}
                      {ordersPagination && ordersPagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-muted-foreground">
                            Showing {((orderPage - 1) * orderLimit) + 1}–{Math.min(orderPage * orderLimit, ordersPagination.total)} of {ordersPagination.total} orders
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setOrderPage(p => Math.max(1, p - 1)); setSelectedOrder(null); }} disabled={orderPage <= 1 || ordersLoading}>
                              <ChevronLeft className="h-4 w-4" /> Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">Page {orderPage} of {ordersPagination.totalPages}</span>
                            <Button variant="outline" size="sm" onClick={() => { setOrderPage(p => Math.min(ordersPagination.totalPages, p + 1)); setSelectedOrder(null); }} disabled={orderPage >= ordersPagination.totalPages || ordersLoading}>
                              Next <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Wishlist */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Wishlist ({selectedCustomer.stats.wishlistCount})</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCustomer.wishlistItems && selectedCustomer.wishlistItems.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {selectedCustomer.wishlistItems.map((item) => {
                        const imgSrc = item?.images?.[0] || item?.colorVariants?.[0]?.images?.[0] || null;
                        return (
                          <div key={item._id} className="border rounded-md p-3 space-y-2">
                            {imgSrc ? (
                              <img src={imgSrc} alt={item?.name || 'Product'} className="w-full h-32 object-cover rounded" />
                            ) : (
                              <div className="w-full h-32 bg-muted rounded flex items-center justify-center text-muted-foreground text-sm">No image</div>
                            )}
                            <div className="font-medium text-sm line-clamp-2">{item?.name || 'Unnamed Product'}</div>
                            <div className="text-sm font-bold">{item?.price ? formatCurrency(item.price) : 'Price N/A'}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground italic">Wishlist is empty</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
