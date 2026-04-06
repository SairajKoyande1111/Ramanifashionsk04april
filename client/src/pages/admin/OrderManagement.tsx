import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { Search, Eye, LayoutGrid, List, Package, CheckCircle, XCircle, PackageCheck, Banknote } from "lucide-react";

interface Order {
  _id: string;
  orderNumber: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    productId: string;
    name: string;
    description?: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    locality: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  subtotal: number;
  shippingCharges: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  phonePeTransactionId?: string;
  phonePeMerchantOrderId?: string;
  phonePeOrderId?: string;
  phonePePaymentState?: string;
  phonePePaymentDetails?: any;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function OrderManagement() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const adminToken = localStorage.getItem("adminToken");

  // View mode and filters
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [searchQuery, setSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Order detail dialog
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Image preview dialog
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageOpen, setPreviewImageOpen] = useState(false);

  // Rejection reason state (shown inline)
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionInput, setShowRejectionInput] = useState(false);

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (orderStatusFilter !== 'all') params.append('orderStatus', orderStatusFilter);
    if (paymentStatusFilter !== 'all') params.append('paymentStatus', paymentStatusFilter);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('sort', sortBy);
    params.append('order', sortOrder);
    params.append('page', currentPage.toString());
    params.append('limit', '20');
    return params.toString();
  }, [searchQuery, orderStatusFilter, paymentStatusFilter, startDate, endDate, sortBy, sortOrder, currentPage]);

  const { data: ordersData, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['/api/admin/orders', queryParams],
    queryFn: async () => {
      const response = await apiRequest(`/api/admin/orders?${queryParams}`, "GET");
      return response;
    },
    enabled: !!adminToken,
    refetchInterval: 30000,
  });

  const approveOrderMutation = useMutation({
    mutationFn: (orderId: string) => {
      console.log('\n🚀 APPROVING ORDER (ONLY)');
      console.log('Order ID:', orderId);
      console.log('Timestamp:', new Date().toISOString());
      return apiRequest(`/api/admin/orders/${orderId}/approve-only`, "POST");
    },
    onSuccess: (data) => {
      console.log('✅ Order approved successfully!', data);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ 
        title: "Order approved!", 
        description: "You can now send it to a shipping partner." 
      });
      setDetailDialogOpen(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      console.error('❌ Order approval failed:', error);
      console.error('Error message:', error.message);
      console.error('Full error:', JSON.stringify(error, null, 2));
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const markDeliveredMutation = useMutation({
    mutationFn: ({ orderId, paymentReceived }: { orderId: string; paymentReceived?: boolean }) =>
      apiRequest(`/api/admin/orders/${orderId}/deliver`, "POST", { paymentReceived: paymentReceived ?? false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Order marked as delivered!" });
      setDetailDialogOpen(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const rejectOrderMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) => 
      apiRequest(`/api/admin/orders/${orderId}/reject`, "POST", { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Order rejected successfully!" });
      setDetailDialogOpen(false);
      setSelectedOrder(null);
      setRejectionReason("");
      setShowRejectionInput(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: ({ orderId, paymentStatus }: { orderId: string; paymentStatus: string }) =>
      apiRequest(`/api/admin/orders/${orderId}/payment-status`, "PATCH", { paymentStatus }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "Payment status updated!" });
      setSelectedOrder(data);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const getDisplayPaymentStatus = (order: Order): string => {
    if (order.orderStatus === 'cancelled' && order.paymentStatus === 'pending' && order.paymentMethod === 'cod') {
      return 'cancelled';
    }
    return order.paymentStatus;
  };

  const getDisplayPaymentStatusColor = (order: Order): string => {
    const status = getDisplayPaymentStatus(order);
    if (status === 'cancelled') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    return getStatusColor(status, 'payment');
  };

  const handleViewDetails = async (orderId: string) => {
    try {
      const order = await apiRequest(`/api/admin/orders/${orderId}`, "GET");
      setSelectedOrder(order);
      setDetailDialogOpen(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRejectOrder = () => {
    if (!selectedOrder || !rejectionReason.trim()) {
      toast({ 
        title: "Error", 
        description: "Please provide a rejection reason", 
        variant: "destructive" 
      });
      return;
    }
    rejectOrderMutation.mutate({ 
      orderId: selectedOrder._id, 
      reason: rejectionReason 
    });
  };

  const getStatusColor = (status: string, type: 'order' | 'payment') => {
    if (type === 'order') {
      switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case 'approved': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
        case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      }
    } else {
      switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      }
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!ordersData?.orders) return { total: 0, pending: 0, processing: 0, revenue: 0 };
    
    const orders = ordersData.orders;
    return {
      total: ordersData.pagination.total,
      pending: orders.filter(o => o.orderStatus === 'pending').length,
      processing: orders.filter(o => o.orderStatus === 'processing').length,
      revenue: orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0)
    };
  }, [ordersData]);

  if (!adminToken) {
    setLocation("/login");
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Order Management
          </h1>
          <p className="text-muted-foreground">
            Track and manage all customer orders
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground" data-testid="text-total-orders-label">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-orders">
                {stats.total}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground" data-testid="text-pending-orders-label">
                Pending Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-orders">
                {stats.pending}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground" data-testid="text-processing-orders-label">
                Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="text-processing-orders">
                {stats.processing}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground" data-testid="text-revenue-label">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-revenue">
                ₹{stats.revenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    data-testid="input-search"
                    placeholder="Order #, customer name, email, phone..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sort">Sort By</Label>
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger id="sort" data-testid="select-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                    <SelectItem value="total-desc">Highest Amount</SelectItem>
                    <SelectItem value="total-asc">Lowest Amount</SelectItem>
                    <SelectItem value="orderNumber-asc">Order Number (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="orderStatus">Order Status</Label>
                <Select value={orderStatusFilter} onValueChange={(value) => {
                  setOrderStatusFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger id="orderStatus" data-testid="select-order-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select value={paymentStatusFilter} onValueChange={(value) => {
                  setPaymentStatusFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger id="paymentStatus" data-testid="select-payment-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  data-testid="input-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  data-testid="input-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setOrderStatusFilter("all");
                    setPaymentStatusFilter("all");
                    setStartDate("");
                    setEndDate("");
                    setSortBy("createdAt");
                    setSortOrder("desc");
                    setCurrentPage(1);
                  }}
                  data-testid="button-clear-filters"
                  className="flex-1"
                >
                  Clear Filters
                </Button>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    data-testid="button-view-list"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'card' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('card')}
                    data-testid="button-view-card"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Display */}
        {isLoading ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">Loading orders...</div>
            </CardContent>
          </Card>
        ) : !ordersData?.orders || ordersData.orders.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No orders found matching your filters</p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'list' ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Order Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersData.orders.map((order) => (
                    <TableRow key={order._id} data-testid={`row-order-${order._id}`}>
                      <TableCell className="font-medium" data-testid={`text-order-number-${order._id}`}>
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium" data-testid={`text-customer-name-${order._id}`}>
                            {order.userId?.name || 'Unknown'}
                          </span>
                          <span className="text-xs text-muted-foreground" data-testid={`text-customer-email-${order._id}`}>
                            {order.userId?.email || ''}
                          </span>
                          <span className="text-xs text-muted-foreground" data-testid={`text-customer-phone-${order._id}`}>
                            {order.userId?.phone || ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-items-count-${order._id}`}>
                        {order.items.length} item(s)
                      </TableCell>
                      <TableCell data-testid={`cell-product-${order._id}`}>
                        <div className="space-y-1">
                          <div className="font-bold text-sm" data-testid={`text-product-name-${order._id}`}>
                            {order.items[0]?.name}
                          </div>
                          {order.items[0]?.description && (
                            <div className="text-xs text-muted-foreground line-clamp-2" data-testid={`text-product-desc-${order._id}`}>
                              {order.items[0].description}
                            </div>
                          )}
                          {order.items[0]?.image && (
                            <img 
                              src={order.items[0].image} 
                              alt={order.items[0].name}
                              className="h-20 w-20 object-cover rounded-md cursor-pointer hover-elevate"
                              onClick={() => {
                                if (order.items[0]?.image) {
                                  setPreviewImage(order.items[0].image);
                                  setPreviewImageOpen(true);
                                }
                              }}
                              data-testid={`img-product-${order._id}`}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold" data-testid={`text-total-${order._id}`}>
                        ₹{order.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={getStatusColor(order.orderStatus, 'order')}
                          data-testid={`badge-order-status-${order._id}`}
                        >
                          {order.orderStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={getDisplayPaymentStatusColor(order)}
                          data-testid={`badge-payment-status-${order._id}`}
                        >
                          {getDisplayPaymentStatus(order)}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-date-${order._id}`}>
                        {format(new Date(order.createdAt), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleViewDetails(order._id)}
                          data-testid={`button-view-${order._id}`}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ordersData.orders.map((order) => (
              <Card key={order._id} className="hover-elevate" data-testid={`card-order-${order._id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg" data-testid={`text-card-order-number-${order._id}`}>
                        {order.orderNumber}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground" data-testid={`text-card-date-${order._id}`}>
                        {format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                    <Badge 
                      className={getStatusColor(order.orderStatus, 'order')}
                      data-testid={`badge-card-status-${order._id}`}
                    >
                      {order.orderStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-1">Customer</div>
                    <div className="text-sm space-y-0.5">
                      <div className="font-medium" data-testid={`text-card-customer-${order._id}`}>
                        {order.userId?.name || 'Unknown'}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {order.userId?.email || ''}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {order.userId?.phone || ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <div className="text-xs text-muted-foreground">Items</div>
                      <div className="font-medium" data-testid={`text-card-items-${order._id}`}>
                        {order.items.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Payment</div>
                      <Badge 
                        className={getDisplayPaymentStatusColor(order)}
                        data-testid={`badge-card-payment-${order._id}`}
                      >
                        {getDisplayPaymentStatus(order)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="font-bold text-lg" data-testid={`text-card-total-${order._id}`}>
                        ₹{order.total.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleViewDetails(order._id)}
                      data-testid={`button-card-view-${order._id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {ordersData && ordersData.pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing page {ordersData.pagination.page} of {ordersData.pagination.pages} 
              ({ordersData.pagination.total} total orders)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                data-testid="button-prev-page"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(ordersData.pagination.pages, p + 1))}
                disabled={currentPage === ordersData.pagination.pages}
                data-testid="button-next-page"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Order Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Order Status</div>
                    <Badge className={getStatusColor(selectedOrder.orderStatus, 'order')}>
                      {selectedOrder.orderStatus}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Payment Status</div>
                    <Badge className={getStatusColor(selectedOrder.paymentStatus, 'payment')}>
                      {selectedOrder.paymentStatus}
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Customer Information</div>
                  <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                    <div><strong>Name:</strong> {selectedOrder.userId?.name || 'Unknown'}</div>
                    <div><strong>Email:</strong> {selectedOrder.userId?.email || 'N/A'}</div>
                    <div><strong>Phone:</strong> {selectedOrder.userId?.phone || 'N/A'}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Shipping Address</div>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <div>{selectedOrder.shippingAddress.fullName}</div>
                    <div>{selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.locality}</div>
                    <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</div>
                    {selectedOrder.shippingAddress.landmark && <div>Landmark: {selectedOrder.shippingAddress.landmark}</div>}
                    <div>Phone: {selectedOrder.shippingAddress.phone}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Order Items</div>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-muted rounded-md">
                        <img
                          src={item.image || "/default-saree.jpg"}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded flex-shrink-0"
                          onError={(e) => { e.currentTarget.src = '/default-saree.jpg'; }}
                        />
                        <div className="flex-1">
                          <div className="font-bold">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground line-clamp-2 mb-1">
                              {item.description}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                          </div>
                        </div>
                        <div className="font-semibold">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Order Summary</div>
                  <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{selectedOrder.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping Charges:</span>
                      <span>₹{selectedOrder.shippingCharges.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>₹{selectedOrder.tax.toLocaleString()}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-₹{selectedOrder.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>₹{selectedOrder.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Payment Method</div>
                    <div className="font-medium">{selectedOrder.paymentMethod}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Order Date</div>
                    <div className="font-medium">
                      {format(new Date(selectedOrder.createdAt), 'dd MMM yyyy, HH:mm')}
                    </div>
                  </div>
                </div>

                {selectedOrder.paymentMethod === 'PhonePe' && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Payment Details (PhonePe)</div>
                    <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                      {selectedOrder.phonePeTransactionId && (
                        <div><strong>Transaction ID:</strong> {selectedOrder.phonePeTransactionId}</div>
                      )}
                      {selectedOrder.phonePeMerchantOrderId && (
                        <div><strong>Merchant Order ID:</strong> {selectedOrder.phonePeMerchantOrderId}</div>
                      )}
                      {selectedOrder.phonePeOrderId && (
                        <div><strong>PhonePe Order ID:</strong> {selectedOrder.phonePeOrderId}</div>
                      )}
                      {selectedOrder.phonePePaymentState && (
                        <div><strong>Payment State:</strong> {selectedOrder.phonePePaymentState}</div>
                      )}
                      {selectedOrder.phonePePaymentDetails && selectedOrder.phonePePaymentDetails.paymentInstrument && (
                        <>
                          {selectedOrder.phonePePaymentDetails.paymentInstrument.type && (
                            <div><strong>Payment Type:</strong> {selectedOrder.phonePePaymentDetails.paymentInstrument.type}</div>
                          )}
                          {selectedOrder.phonePePaymentDetails.paymentInstrument.utr && (
                            <div><strong>UTR:</strong> {selectedOrder.phonePePaymentDetails.paymentInstrument.utr}</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {selectedOrder.approved && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Approval Information</div>
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md space-y-1 text-sm">
                      <div><strong>Approved By:</strong> {selectedOrder.approvedBy || 'Admin'}</div>
                      <div><strong>Approved At:</strong> {selectedOrder.approvedAt ? format(new Date(selectedOrder.approvedAt), 'dd MMM yyyy, HH:mm') : 'N/A'}</div>
                    </div>
                  </div>
                )}

                {selectedOrder.orderStatus === 'cancelled' && selectedOrder.rejectedBy && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Rejection Information</div>
                    <div className="bg-red-50 dark:bg-red-950 p-3 rounded-md space-y-1 text-sm">
                      <div><strong>Rejected By:</strong> {selectedOrder.rejectedBy}</div>
                      {selectedOrder.rejectedAt && (
                        <div><strong>Rejected At:</strong> {format(new Date(selectedOrder.rejectedAt), 'dd MMM yyyy, HH:mm')}</div>
                      )}
                      {selectedOrder.rejectionReason && (
                        <div><strong>Reason:</strong> {selectedOrder.rejectionReason}</div>
                      )}
                    </div>
                  </div>
                )}

                {!selectedOrder.approved && (selectedOrder.orderStatus === 'pending' || selectedOrder.orderStatus === 'processing') && (
                  <div className="space-y-3 pt-4 border-t">
                    {selectedOrder.paymentMethod !== 'cod' && selectedOrder.paymentStatus !== 'paid' && (
                      <div className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md">
                        ⚠️ This is a prepaid order. Payment has not been completed yet. Cannot reject a prepaid order.
                      </div>
                    )}
                    
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => approveOrderMutation.mutate(selectedOrder._id)}
                        disabled={approveOrderMutation.isPending || (selectedOrder.paymentMethod !== 'cod' && selectedOrder.paymentStatus !== 'paid')}
                        className="flex-1 min-w-[120px]"
                        data-testid="button-approve-order"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {approveOrderMutation.isPending ? 'Approving...' : 'Approve'}
                      </Button>
                      {selectedOrder.paymentMethod === 'cod' && (
                        <Button
                          variant="destructive"
                          onClick={() => setShowRejectionInput(!showRejectionInput)}
                          disabled={rejectOrderMutation.isPending}
                          className="flex-1 min-w-[120px]"
                          data-testid="button-reject-order"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {showRejectionInput ? 'Cancel' : 'Reject Order'}
                        </Button>
                      )}
                    </div>

                    {showRejectionInput && (
                      <div className="space-y-2">
                        <Label htmlFor="rejectionReason">Reason for Rejection</Label>
                        <Input
                          id="rejectionReason"
                          placeholder="Enter reason for rejecting this order..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          data-testid="input-rejection-reason"
                        />
                        <Button 
                          variant="destructive"
                          onClick={handleRejectOrder}
                          disabled={rejectOrderMutation.isPending || !rejectionReason.trim()}
                          className="w-full"
                          data-testid="button-confirm-reject"
                        >
                          {rejectOrderMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {selectedOrder.approved && selectedOrder.orderStatus !== 'delivered' && selectedOrder.orderStatus !== 'cancelled' && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 p-3 rounded-md">
                      ✅ Order is approved. Mark it as delivered once the customer receives it.
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => markDeliveredMutation.mutate({ orderId: selectedOrder._id, paymentReceived: false })}
                        disabled={markDeliveredMutation.isPending}
                        className="flex-1 min-w-[140px]"
                        data-testid="button-mark-delivered"
                      >
                        <PackageCheck className="h-4 w-4 mr-2" />
                        {markDeliveredMutation.isPending ? 'Updating...' : 'Delivery Completed'}
                      </Button>
                      {selectedOrder.paymentMethod === 'cod' && (
                        <Button
                          variant="outline"
                          onClick={() => markDeliveredMutation.mutate({ orderId: selectedOrder._id, paymentReceived: true })}
                          disabled={markDeliveredMutation.isPending}
                          className="flex-1 min-w-[200px] border-green-600 text-green-700 hover:bg-green-50"
                          data-testid="button-mark-delivered-payment-received"
                        >
                          <Banknote className="h-4 w-4 mr-2" />
                          {markDeliveredMutation.isPending ? 'Updating...' : 'Delivered + Payment Received'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {selectedOrder.orderStatus === 'delivered' && selectedOrder.paymentStatus === 'pending' && selectedOrder.paymentMethod === 'cod' && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md">
                      💰 Order delivered but payment not yet received. Update payment status when collected.
                    </div>
                    <Button
                      onClick={() => updatePaymentStatusMutation.mutate({ orderId: selectedOrder._id, paymentStatus: 'paid' })}
                      disabled={updatePaymentStatusMutation.isPending}
                      className="w-full border-green-600 bg-green-600 hover:bg-green-700 text-white"
                      data-testid="button-mark-payment-received"
                    >
                      <Banknote className="h-4 w-4 mr-2" />
                      {updatePaymentStatusMutation.isPending ? 'Updating...' : 'Mark Payment Received'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Image Preview Dialog */}
        <Dialog open={previewImageOpen} onOpenChange={setPreviewImageOpen}>
          <DialogContent className="max-w-2xl" data-testid="dialog-image-preview">
            <DialogHeader>
              <DialogTitle>Product Image</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              {previewImage && (
                <img 
                  src={previewImage} 
                  alt="Product preview"
                  className="max-h-[500px] max-w-full object-contain rounded-md"
                  data-testid="img-preview"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
