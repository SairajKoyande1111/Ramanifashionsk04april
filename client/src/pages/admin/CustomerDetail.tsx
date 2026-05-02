import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

interface OrderItem {
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

interface Customer {
  _id: string;
  phone: string;
  name: string;
  email: string;
  dob?: string;
  address?: { street?: string; city?: string; state?: string; pincode?: string; landmark?: string };
  phoneVerified: boolean;
  notifyUpdates: boolean;
  lastLogin?: string;
  createdAt: string;
  stats: { totalOrders: number; totalSpent: number; pendingOrders: number; completedOrders: number; wishlistCount: number };
  wishlistItems: { _id: string; name: string; price: number; images: string[]; colorVariants?: { color: string; images: string[] }[] }[];
}

export default function CustomerDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const adminToken = localStorage.getItem("adminToken");
  const customerId = params.id;

  const [orderPage, setOrderPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<FullOrder | null>(null);
  const orderLimit = 10;

  const { data: customerData, isLoading: customerLoading } = useQuery<Customer>({
    queryKey: ["/api/admin/customers", customerId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch customer");
      return res.json();
    },
    enabled: !!adminToken && !!customerId,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery<{
    orders: FullOrder[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>({
    queryKey: ["/api/admin/customers", customerId, "orders", orderPage],
    queryFn: async () => {
      const res = await fetch(`/api/admin/customers/${customerId}/orders?page=${orderPage}&limit=${orderLimit}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    enabled: !!adminToken && !!customerId,
  });

  const customer = customerData || null;
  const orders = ordersData?.orders || [];
  const ordersPagination = ordersData?.pagination;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);

  const formatFullDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-700",
      approved: "bg-blue-500/10 text-blue-700",
      processing: "bg-blue-500/10 text-blue-700",
      shipped: "bg-purple-500/10 text-purple-700",
      delivered: "bg-green-500/10 text-green-700",
      cancelled: "bg-red-500/10 text-red-700",
      paid: "bg-green-500/10 text-green-700",
      failed: "bg-red-500/10 text-red-700",
    };
    return map[status] || "bg-gray-500/10 text-gray-700";
  };

  if (!adminToken) {
    setLocation("/admin/ramanifashionlogin");
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setLocation("/admin/customers")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Customer Details</h1>
            {customer && <p className="text-muted-foreground">{customer.name || customer.phone}</p>}
          </div>
        </div>

        {customerLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading customer details…</div>
        ) : !customer ? (
          <div className="text-center py-16 text-muted-foreground">Customer not found.</div>
        ) : (
          <>
            {/* Info + Address */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <div className="text-muted-foreground font-medium">Phone</div>
                    <div className="flex items-center gap-2">
                      {customer.phone}
                      {customer.phoneVerified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
                    </div>
                  </div>
                  <div><div className="text-muted-foreground font-medium">Name</div><div>{customer.name || <span className="italic text-muted-foreground">Not provided</span>}</div></div>
                  <div><div className="text-muted-foreground font-medium">Email</div><div>{customer.email || <span className="italic text-muted-foreground">Not provided</span>}</div></div>
                  <div>
                    <div className="text-muted-foreground font-medium">Date of Birth</div>
                    <div>{customer.dob ? new Date(customer.dob).toLocaleDateString("en-IN") : <span className="italic text-muted-foreground">Not provided</span>}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground font-medium">Last Login</div>
                    <div>{customer.lastLogin ? formatFullDate(customer.lastLogin) : <span className="italic text-muted-foreground">Never</span>}</div>
                  </div>
                  <div><div className="text-muted-foreground font-medium">Member Since</div><div>{formatFullDate(customer.createdAt)}</div></div>
                  <div>
                    <div className="text-muted-foreground font-medium">Notifications</div>
                    <Badge variant={customer.notifyUpdates ? "default" : "secondary"}>{customer.notifyUpdates ? "Enabled" : "Disabled"}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Address</CardTitle></CardHeader>
                <CardContent className="text-sm">
                  {customer.address && (customer.address.street || customer.address.city) ? (
                    <div className="space-y-1">
                      {customer.address.street && <div>{customer.address.street}</div>}
                      {customer.address.landmark && <div>{customer.address.landmark}</div>}
                      <div>{customer.address.city}{customer.address.city && customer.address.state ? ", " : ""}{customer.address.state}</div>
                      {customer.address.pincode && <div>PIN: {customer.address.pincode}</div>}
                    </div>
                  ) : <div className="italic text-muted-foreground">No address provided</div>}
                </CardContent>
              </Card>
            </div>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {[
                { label: "Total Orders", value: customer.stats.totalOrders },
                { label: "Total Spent", value: formatCurrency(customer.stats.totalSpent) },
                { label: "Completed", value: customer.stats.completedOrders },
                { label: "Pending", value: customer.stats.pendingOrders },
              ].map(stat => (
                <Card key={stat.label}>
                  <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{stat.label}</CardTitle></CardHeader>
                  <CardContent><div className="text-xl font-bold">{stat.value}</div></CardContent>
                </Card>
              ))}
            </div>

            {/* All Orders */}
            <Card>
              <CardHeader>
                <CardTitle>All Orders ({ordersPagination?.total ?? customer.stats.totalOrders})</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading orders…</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground italic">No orders yet</div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {orders.map(order => (
                        <div key={order.orderId} className="border rounded-lg overflow-hidden">
                          <button
                            className="w-full text-left p-4 hover:bg-muted/50 transition-colors"
                            onClick={() => setSelectedOrder(selectedOrder?.orderId === order.orderId ? null : order)}
                            data-testid={`button-order-${order.orderId}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold">{order.orderNumber}</div>
                                <div className="text-sm text-muted-foreground">{formatFullDate(order.createdAt)} · {order.items.length} item(s)</div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="font-bold">{formatCurrency(order.total)}</div>
                                  <div className="flex gap-1 mt-1 justify-end">
                                    <Badge className={`text-xs ${getStatusColor(order.status)}`}>{order.status}</Badge>
                                    <Badge className={`text-xs ${getStatusColor(order.paymentStatus)}`}>{order.paymentStatus}</Badge>
                                  </div>
                                </div>
                                <span className="text-muted-foreground">{selectedOrder?.orderId === order.orderId ? "▲" : "▼"}</span>
                              </div>
                            </div>
                          </button>

                          {selectedOrder?.orderId === order.orderId && (
                            <div className="border-t bg-muted/20 p-4 space-y-4">
                              {/* Items */}
                              <div>
                                <div className="font-semibold text-sm mb-2">Order Items</div>
                                <div className="space-y-2">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-background rounded-md p-3">
                                      {item.image && (
                                        <img src={item.image} alt={item.name} className="w-14 h-16 object-cover rounded flex-shrink-0"
                                          onError={(e) => { e.currentTarget.src = "/default-saree.jpg"; }} />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{item.name}</div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {item.selectedColor && <span className="text-xs bg-muted px-2 py-0.5 rounded">Color: {item.selectedColor}</span>}
                                          {item.selectedSize && <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">Size: {item.selectedSize}</span>}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-0.5">Qty: {item.quantity} × {formatCurrency(item.price)}</div>
                                      </div>
                                      <div className="font-bold">{formatCurrency(item.price * item.quantity)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <Separator />

                              <div className="grid gap-4 md:grid-cols-2">
                                {/* Shipping */}
                                <div>
                                  <div className="font-semibold text-sm mb-2">Shipping Address</div>
                                  <div className="text-sm space-y-0.5 text-muted-foreground">
                                    {order.shippingAddress?.fullName && <div className="font-medium text-foreground">{order.shippingAddress.fullName}</div>}
                                    {order.shippingAddress?.phone && <div>{order.shippingAddress.phone}</div>}
                                    {order.shippingAddress?.address && <div>{order.shippingAddress.address}</div>}
                                    {order.shippingAddress?.locality && <div>{order.shippingAddress.locality}</div>}
                                    <div>
                                      {order.shippingAddress?.city}{order.shippingAddress?.city && order.shippingAddress?.state ? ", " : ""}{order.shippingAddress?.state}
                                      {order.shippingAddress?.pincode ? ` — ${order.shippingAddress.pincode}` : ""}
                                    </div>
                                    {order.shippingAddress?.landmark && <div>Landmark: {order.shippingAddress.landmark}</div>}
                                  </div>
                                </div>

                                {/* Summary */}
                                <div>
                                  <div className="font-semibold text-sm mb-2">Order Summary</div>
                                  <div className="text-sm space-y-1">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shippingCharges ? formatCurrency(order.shippingCharges) : "Free"}</span></div>
                                    {order.tax > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(order.tax)}</span></div>}
                                    {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatCurrency(order.discount)}</span></div>}
                                    <Separator />
                                    <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
                                    <div className="flex justify-between mt-1"><span className="text-muted-foreground">Payment Method</span><span className="capitalize">{order.paymentMethod}</span></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {ordersPagination && ordersPagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {((orderPage - 1) * orderLimit) + 1}–{Math.min(orderPage * orderLimit, ordersPagination.total)} of {ordersPagination.total} orders
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setOrderPage(p => Math.max(1, p - 1)); setSelectedOrder(null); }} disabled={orderPage <= 1}>
                            <ChevronLeft className="h-4 w-4" /> Previous
                          </Button>
                          <span className="text-sm text-muted-foreground">Page {orderPage} of {ordersPagination.totalPages}</span>
                          <Button variant="outline" size="sm" onClick={() => { setOrderPage(p => Math.min(ordersPagination.totalPages, p + 1)); setSelectedOrder(null); }} disabled={orderPage >= ordersPagination.totalPages}>
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
            {customer.wishlistItems && customer.wishlistItems.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Wishlist ({customer.stats.wishlistCount})</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {customer.wishlistItems.map(item => {
                      const imgSrc = item?.images?.[0] || item?.colorVariants?.[0]?.images?.[0] || null;
                      return (
                        <div key={item._id} className="border rounded-md p-3 space-y-2">
                          {imgSrc ? <img src={imgSrc} alt={item.name} className="w-full h-32 object-cover rounded" />
                            : <div className="w-full h-32 bg-muted rounded flex items-center justify-center text-muted-foreground text-sm">No image</div>}
                          <div className="font-medium text-sm line-clamp-2">{item.name}</div>
                          <div className="text-sm font-bold">{item.price ? formatCurrency(item.price) : "N/A"}</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
