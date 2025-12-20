import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingCart, Eye, Search, Filter, X, MoreVertical, DollarSign, Gift, Truck, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AdminShippingDrawer } from "@/components/shipping/shipping-drawer";
import { ScanFormViewerDialog } from "@/components/shipping/scan-form-viewer-dialog";

export default function AdminOrders() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  const [shippingDrawerOpen, setShippingDrawerOpen] = useState(false);
  const [shippingDrawerOrder, setShippingDrawerOrder] = useState<any>(null);
  const [scanFormDialogOpen, setScanFormDialogOpen] = useState(false);
  const [scanFormViewerOpen, setScanFormViewerOpen] = useState(false);
  const [scanForms, setScanForms] = useState<any[]>([]);
  const [isLoadingScanForms, setIsLoadingScanForms] = useState(false);

  // Fetch regular orders
  const { data: ordersData, isLoading: isLoadingOrders } = useQuery<any>({
    queryKey: ['admin-orders', activeTab === "orders" ? statusFilter : null],
    queryFn: async () => {
      console.log('Fetching regular orders...');
      const params = new URLSearchParams();
      if (activeTab === "orders" && statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      const queryString = params.toString();
      const url = queryString ? `/api/orders?${queryString}` : `/api/orders`;
      const response = await fetch(url, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return await response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });

  // Fetch giveaway orders (platform_order: true)
  const { data: giveawayOrdersData, isLoading: isLoadingGiveaways } = useQuery<any>({
    queryKey: ['admin-giveaway-orders', activeTab === "giveaways" ? statusFilter : null],
    queryFn: async () => {
      console.log('Fetching giveaway orders with platform_order=true...');
      const params = new URLSearchParams();
      params.set("platform_order", "true");
      if (activeTab === "giveaways" && statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      const response = await fetch(`/api/orders?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch giveaway orders');
      }
      return await response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });

  const isLoading = activeTab === "orders" ? isLoadingOrders : isLoadingGiveaways;
  const regularOrders = ordersData?.orders || ordersData?.data || [];
  const giveawayOrders = giveawayOrdersData?.orders || giveawayOrdersData?.data || [];

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'order' | 'transaction' }) => {
      return apiRequest("PUT", `/api/admin/refund/${id}`, { type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-giveaway-orders'] });
      toast({
        title: "Success",
        description: "Refund processed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process refund",
        variant: "destructive",
      });
    },
  });

  // Generate scan form mutation
  const generateScanFormMutation = useMutation({
    mutationFn: async () => {
      const adminToken = localStorage.getItem('admin_access_token');
      const userToken = localStorage.getItem('tokshop_user_token');
      const userData = localStorage.getItem('user');
      const ownerId = userData ? JSON.parse(userData).id : undefined;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (adminToken) {
        headers['x-admin-token'] = adminToken;
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      if (userToken) {
        headers['x-access-token'] = userToken;
      }
      const response = await fetch('/api/shipping/generate/manifest', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ type: 'giveaway', ownerId, platform_order: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate scan form');
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-giveaway-orders'] });
      toast({
        title: "Scan form generation started",
        description: data.message || "SCAN Form generation has been initiated",
      });
      setScanFormDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenShippingDrawer = (order: any) => {
    setShippingDrawerOrder(order);
    setShippingDrawerOpen(true);
  };

  const handleViewScanForms = async () => {
    try {
      setIsLoadingScanForms(true);
      setScanFormViewerOpen(true);

      const adminToken = localStorage.getItem('admin_access_token');
      const userToken = localStorage.getItem('tokshop_user_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (adminToken) {
        headers['x-admin-token'] = adminToken;
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      if (userToken) {
        headers['x-access-token'] = userToken;
      }
      const response = await fetch('/api/shipping/generate/manifest/view', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ type: 'giveaway' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch scan forms');
      }

      setScanForms(data.forms || []);
    } catch (error: any) {
      toast({
        title: "Failed to fetch scan forms",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingScanForms(false);
    }
  };

  const canShipOrder = (order: any) => {
    const status = order.status?.toLowerCase();
    return !order.tracking_number && 
           status !== 'shipped' && 
           status !== 'delivered' && 
           status !== 'cancelled';
  };

  // Get base orders based on active tab
  const baseOrders = activeTab === "giveaways" ? giveawayOrders : regularOrders;

  // Filter orders (status is filtered server-side, only apply search filter here)
  const filteredOrders = baseOrders.filter((order: any) => {
    // Search filter
    if (searchTerm) {
      const invoice = String(order.invoice || order._id || '').toLowerCase();
      const customerName = typeof order.customer === 'object'
        ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || order.customer.userName || order.customer.email || ''
        : '';
      const searchLower = searchTerm.toLowerCase();
      
      if (!invoice.includes(searchLower) && !customerName.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    return true;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'default';
      case 'pending':
      case 'processing':
        return 'secondary';
      case 'shipped':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all";
  const activeFilterCount = [searchTerm, statusFilter !== "all"].filter(Boolean).length;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-foreground">Orders Management</h2>
            <p className="text-muted-foreground">Track and manage all platform orders</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading orders...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground">Orders Management</h2>
          <p className="text-muted-foreground">Track and manage all platform orders</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders ({regularOrders.length})
            </TabsTrigger>
            <TabsTrigger value="giveaways" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Giveaways ({giveawayOrders.length})
            </TabsTrigger>
          </TabsList>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  {activeTab === "giveaways" ? (
                    <Gift className="h-5 w-5 text-primary" />
                  ) : (
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <CardTitle>{activeTab === "giveaways" ? "Giveaway Orders" : "All Orders"}</CardTitle>
                    <CardDescription>
                      {filteredOrders.length} of {baseOrders.length} {activeTab === "giveaways" ? "giveaway orders" : "orders"}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Shipping Actions for Giveaways tab - Generate Scan Form only for unfulfilled */}
                  {activeTab === "giveaways" && (
                    <>
                      {statusFilter === "unfulfilled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setScanFormDialogOpen(true)}
                          data-testid="button-generate-scan-form"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Scan Form
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewScanForms}
                        data-testid="button-view-scan-forms"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Scan Forms
                      </Button>
                    </>
                  )}
                  
                  {/* Filter Toggle Button */}
                  <Button
                    variant={showFilters ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    data-testid="button-toggle-filters"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>

              {/* Filters Section */}
              {showFilters && (
                <div className="mt-4 space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Search</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Invoice or customer..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                          data-testid="input-search-orders"
                        />
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger data-testid="select-status-filter">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      data-testid="button-clear-filters"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {hasActiveFilters ? "No orders match your filters" : "No orders found"}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order: any) => {
                      const orderId = order._id || order.id;
                      const invoiceNumber = order.invoice || orderId;
                      const customerName = typeof order.customer === 'object' && order.customer !== null
                        ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || order.customer.userName || order.customer.email
                        : 'Unknown';
                      const itemsCount = order.items?.length || 0;
                      
                      // Calculate total from items
                      const calculateTotal = () => {
                        if (!order.items || order.items.length === 0) return 0;
                        const subtotal = order.items.reduce((sum: number, item: any) => {
                          const price = item.price || 0;
                          const quantity = item.quantity || 1;
                          return sum + (price * quantity);
                        }, 0);
                        const shippingFee = order.shipping_fee || order.shippingFee || order.shipping || 0;
                        const tax = order.tax || 0;
                        console.log(`[Order ${order._id}] subtotal: ${subtotal}, shipping: ${shippingFee}, tax: ${tax}, total: ${subtotal + shippingFee + tax}`);
                        return subtotal + shippingFee + tax;
                      };
                      
                      const total = calculateTotal();

                      return (
                        <TableRow key={orderId}>
                          <TableCell className="font-mono text-xs" data-testid={`text-order-id-${orderId}`}>
                            {invoiceNumber}
                          </TableCell>
                          <TableCell data-testid={`text-customer-${orderId}`}>
                            {customerName}
                          </TableCell>
                          <TableCell data-testid={`text-date-${orderId}`}>
                            {formatDate(order.createdAt || order.orderDate)}
                          </TableCell>
                          <TableCell data-testid={`text-items-${orderId}`}>
                            {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                          </TableCell>
                          <TableCell data-testid={`text-total-${orderId}`}>
                            ${total.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(order.status)} data-testid={`badge-status-${orderId}`}>
                              {order.status || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`button-actions-${orderId}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setLocation(`/admin/orders/${orderId}`)}
                                  data-testid={`menu-view-order-${orderId}`}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {activeTab === "giveaways" && canShipOrder(order) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleOpenShippingDrawer(order)}
                                      data-testid={`menu-ship-order-${orderId}`}
                                    >
                                      <Truck className="h-4 w-4 mr-2" />
                                      Ship Order
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {activeTab !== "giveaways" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        refundMutation.mutate({ id: orderId, type: 'order' });
                                      }}
                                      disabled={refundMutation.isPending}
                                      data-testid={`menu-refund-order-${orderId}`}
                                      className="text-orange-600 focus:text-orange-600"
                                    >
                                      <DollarSign className="h-4 w-4 mr-2" />
                                      Refund Order
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>
      </div>

      {/* Shipping Drawer */}
      <AdminShippingDrawer
        order={shippingDrawerOrder}
        open={shippingDrawerOpen}
        onOpenChange={setShippingDrawerOpen}
      />

      {/* Scan Form Viewer Dialog */}
      <ScanFormViewerDialog
        open={scanFormViewerOpen}
        onOpenChange={setScanFormViewerOpen}
        scanForms={scanForms}
        isLoading={isLoadingScanForms}
      />

      {/* Generate Scan Form Confirmation Dialog */}
      <Dialog open={scanFormDialogOpen} onOpenChange={setScanFormDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate SCAN Form</DialogTitle>
            <DialogDescription>
              This will create a USPS SCAN form for all shipped giveaway orders that don't already have one. 
              The carrier will scan this single barcode to accept all packages at once.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScanFormDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => generateScanFormMutation.mutate()}
              disabled={generateScanFormMutation.isPending}
            >
              {generateScanFormMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
