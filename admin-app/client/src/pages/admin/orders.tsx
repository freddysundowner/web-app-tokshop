import { useState, useEffect } from "react";
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
import { queryClient, apiRequest, fetchWithAuth } from "@/lib/queryClient";
import { AdminShippingDrawer } from "@/components/shipping/shipping-drawer";
import { ScanFormViewerDialog } from "@/components/shipping/scan-form-viewer-dialog";

export default function AdminOrders() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [searchBy, setSearchBy] = useState("customer");
  const [appliedSearchBy, setAppliedSearchBy] = useState("customer");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [shippingDrawerOpen, setShippingDrawerOpen] = useState(false);
  const [shippingDrawerOrder, setShippingDrawerOrder] = useState<any>(null);
  const [scanFormDialogOpen, setScanFormDialogOpen] = useState(false);
  const [scanFormViewerOpen, setScanFormViewerOpen] = useState(false);
  const [scanForms, setScanForms] = useState<any[]>([]);
  const [isLoadingScanForms, setIsLoadingScanForms] = useState(false);

  // Fetch regular orders
  const { data: ordersData, isLoading: isLoadingOrders } = useQuery<any>({
    queryKey: ['admin-orders', activeTab === "orders" ? statusFilter : null, activeTab === "orders" ? appliedSearch : null, activeTab === "orders" ? appliedSearchBy : null, activeTab === "orders" ? page : 1],
    queryFn: async () => {
      console.log('Fetching regular orders...');
      const params = new URLSearchParams();
      params.set("page", String(activeTab === "orders" ? page : 1));
      params.set("limit", String(PAGE_SIZE));
      if (activeTab === "orders" && statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (activeTab === "orders" && appliedSearch.trim()) {
        if (appliedSearchBy === "order") {
          // Send digits; a non-numeric term is sent as-is so the API matches nothing (instead of everything)
          params.set("invoice", appliedSearch.trim().replace(/\D/g, "") || appliedSearch.trim());
        } else {
          params.set("search", appliedSearch.trim());
          params.set("searchBy", appliedSearchBy);
        }
      }
      const queryString = params.toString();
      const url = queryString ? `/api/orders?${queryString}` : `/api/orders`;
      const response = await fetchWithAuth(url, { cache: 'no-store' });
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
    queryKey: ['admin-giveaway-orders', activeTab === "giveaways" ? statusFilter : null, activeTab === "giveaways" ? appliedSearch : null, activeTab === "giveaways" ? appliedSearchBy : null, activeTab === "giveaways" ? page : 1],
    queryFn: async () => {
      console.log('Fetching giveaway orders with platform_order=true...');
      const params = new URLSearchParams();
      params.set("platform_order", "true");
      params.set("page", String(activeTab === "giveaways" ? page : 1));
      params.set("limit", String(PAGE_SIZE));
      if (activeTab === "giveaways" && statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (activeTab === "giveaways" && appliedSearch.trim()) {
        if (appliedSearchBy === "order") {
          params.set("invoice", appliedSearch.trim().replace(/\D/g, "") || appliedSearch.trim());
        } else {
          params.set("search", appliedSearch.trim());
          params.set("searchBy", appliedSearchBy);
        }
      }
      const response = await fetchWithAuth(`/api/orders?${params.toString()}`, { cache: 'no-store' });
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
      return apiRequest("PUT", `/api/admin/refund/${id}`, { type, orderId: id });
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

  // Filter orders (status & search are filtered server-side; mirror the SUBMITTED
  // search here so the visible rows stay consistent with the paginated totals)
  const filteredOrders = baseOrders.filter((order: any) => {
    // Search filter
    if (appliedSearch) {
      const invoice = String(order.invoice || order._id || '').toLowerCase();
      if (appliedSearchBy === "order") {
        // Server filters by exact invoice; mirror with exact match on digits
        const digits = appliedSearch.replace(/\D/g, "");
        return digits !== "" && invoice === digits;
      }
      const customerName = typeof order.customer === 'object'
        ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || order.customer.email || ''
        : '';
      const customerUsername = typeof order.customer === 'object'
        ? order.customer.userName || ''
        : '';
      const searchLower = appliedSearch.toLowerCase();
      
      if (!invoice.includes(searchLower) && 
          !customerName.toLowerCase().includes(searchLower) &&
          !customerUsername.toLowerCase().includes(searchLower)) {
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

  const handleSearch = () => {
    setPage(1);
    setAppliedSearch(searchTerm);
    setAppliedSearchBy(searchBy);
  };

  const clearFilters = () => {
    setPage(1);
    setSearchTerm("");
    setAppliedSearch("");
    setSearchBy("customer");
    setAppliedSearchBy("customer");
    setStatusFilter("all");
  };

  const hasActiveFilters = appliedSearch || statusFilter !== "all";

  // Pagination derived from the active tab's response
  const activeData = activeTab === "giveaways" ? giveawayOrdersData : ordersData;
  const totalCount = activeData?.total ?? baseOrders.length;
  const totalPages = Math.max(1, activeData?.pages ?? 1);
  const regularTotal = ordersData?.total ?? regularOrders.length;
  const giveawayTotal = giveawayOrdersData?.total ?? giveawayOrders.length;

  // Clamp the current page if the dataset shrank (e.g. after a refund/filter change)
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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

        <Tabs value={activeTab} onValueChange={(v) => { setPage(1); setActiveTab(v); }} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders ({regularTotal})
            </TabsTrigger>
            <TabsTrigger value="giveaways" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Giveaways ({giveawayTotal})
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
                      {totalCount} {activeTab === "giveaways" ? "giveaway orders" : "orders"} total
                      {totalPages > 1 ? ` — page ${page} of ${totalPages}` : ""}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Search By Dropdown */}
                  <Select value={searchBy} onValueChange={setSearchBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="order">Order #</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-9 w-40"
                      data-testid="input-search-orders"
                    />
                  </div>
                  
                  <Button size="sm" onClick={handleSearch}>
                    Search
                  </Button>
                  
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={(v) => { setPage(1); setStatusFilter(v); }}>
                    <SelectTrigger data-testid="select-status-filter" className="w-40">
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
                  
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                    >
                      Clear
                    </Button>
                  )}
                  
                  {/* Shipping Actions for Giveaways tab */}
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
                </div>
              </div>
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
                        ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || order.customer.email
                        : 'Unknown';
                      const customerUsername = typeof order.customer === 'object' && order.customer !== null
                        ? order.customer.userName || ''
                        : '';
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
                        const discount = order.discount || 0;
                        return subtotal + shippingFee + tax - discount;
                      };
                      
                      const total = calculateTotal();

                      return (
                        <TableRow key={orderId}>
                          <TableCell className="font-mono text-xs" data-testid={`text-order-id-${orderId}`}>
                            {invoiceNumber}
                          </TableCell>
                          <TableCell data-testid={`text-customer-${orderId}`}>
                            <div>
                              {customerName}
                              {customerUsername && (
                                <div className="text-xs text-muted-foreground">@{customerUsername}</div>
                              )}
                            </div>
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
                                {activeTab !== "giveaways" && order.status?.toLowerCase() !== 'refunded' && (
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 pt-4">
                <p className="text-sm text-muted-foreground" data-testid="text-page-info">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || isLoading}
                    data-testid="button-prev-page"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || isLoading}
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                </div>
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
