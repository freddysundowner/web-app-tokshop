import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Search, Filter, MoreHorizontal, Package, Printer, Truck, Ship, X, MessageSquare, Info } from "lucide-react";
import type { TokshopOrder, TokshopOrdersResponse } from "@shared/schema";
import { calculateOrderTotal, formatCurrency, calculateOrderSubtotal } from "@shared/pricing";
import { useSettings } from "@/lib/settings-context";
import { format } from "date-fns";
import { CompletePagination } from "@/components/ui/pagination";
import { OrderDetailsDrawer } from "@/components/orders/order-details-drawer";
import { getOrCreateChat } from "@/lib/firebase-chat";

const statusColors = {
  processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  ended: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const statusPriority = {
  processing: 1,
  shipped: 2,
  delivered: 3,
  ended: 4,
  cancelled: 5,
};

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedShowId, setSelectedShowId] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedOrder, setSelectedOrder] = useState<TokshopOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();
  const [, setLocation] = useLocation();
  const [messagingOrderId, setMessagingOrderId] = useState<string | null>(null);

  // Build query key with parameters for proper caching
  const ordersQueryKey = ['/api/orders', user?.id, statusFilter, currentPage, itemsPerPage];
  
  const { data: orderResponse, isLoading, error: ordersError, isError, refetch } = useQuery<TokshopOrdersResponse>({
    queryKey: ordersQueryKey,
    enabled: !!user?.id, // Only run query when user ID is available
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
  });

  // Fetch ended shows for filter dropdown
  const { data: endedShowsResponse } = useQuery({
    queryKey: ["/api/rooms", "ended", user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("status", "ended");
      if (user?.id) {
        params.set("hostId", user.id);
      }
      const response = await fetch(`/api/rooms?${params}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  const endedShows = endedShowsResponse?.rooms || [];

  // Ship order mutation
  const shipOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "shipped",
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark order as shipped');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      toast({ title: "Order marked as shipped" });
    },
    onError: () => {
      toast({ title: "Failed to mark order as shipped", variant: "destructive" });
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "cancelled",
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      toast({ title: "Order cancelled" });
      setDrawerOpen(false); // Close drawer after successful cancellation
    },
    onError: () => {
      toast({ title: "Failed to cancel order", variant: "destructive" });
    },
  });


  const handlePrintLabel = (order: TokshopOrder) => {
    if (order.label) {
      window.open(order.label, '_blank');
    } else {
      toast({ title: "No shipping label available", variant: "destructive" });
    }
  };

  const handleTrackPackage = (order: TokshopOrder) => {
    if (order.tracking_number) {
      // TODO: Open tracking modal or navigate to tracking page
      toast({ title: `Tracking: ${order.tracking_number}` });
    } else {
      toast({ title: "No tracking number available", variant: "destructive" });
    }
  };

  const handleShipOrder = (orderId: string) => {
    shipOrderMutation.mutate(orderId);
  };

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  // Handle message buyer from table
  const handleMessageBuyer = async (order: TokshopOrder) => {
    const buyerId = order.customer?._id;
    const currentUserId = (user as any)?._id || (user as any)?.id;
    
    if (!buyerId || !currentUserId) {
      toast({
        title: "Error",
        description: "Unable to start chat. User information is missing.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setMessagingOrderId(order._id);
      
      const currentUserData = {
        firstName: (user as any)?.firstName || '',
        lastName: (user as any)?.lastName || '',
        userName: (user as any)?.userName || '',
        profilePhoto: (user as any)?.profilePhoto || ''
      };
      
      const buyerData = {
        firstName: order.customer?.firstName || '',
        lastName: order.customer?.lastName || '',
        userName: order.customer?.userName || '',
        profilePhoto: order.customer?.profilePhoto || ''
      };
      
      const chatId = await getOrCreateChat(
        currentUserId,
        buyerId,
        currentUserData,
        buyerData
      );
      
      setLocation('/inbox/' + chatId);
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive"
      });
    } finally {
      setMessagingOrderId(null);
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Reset pagination when filters change
  const resetPaginationOnFilterChange = () => {
    setCurrentPage(1);
  };

  // Update filters to reset pagination
  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    resetPaginationOnFilterChange();
  };

  const handleShowFilterChange = (newShowId: string) => {
    setSelectedShowId(newShowId);
    resetPaginationOnFilterChange();
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setSelectedShowId("all");
    setCurrentPage(1);
  };

  // Extract orders array from the response
  const orders = orderResponse?.orders || [];

  // Use centralized calculation function
  const calculateTotal = calculateOrderTotal;

  // Calculate net earnings for an order
  const calculateNetEarnings = (order: TokshopOrder) => {
    // If it's a giveaway, earnings are 0
    if (order.giveaway || order.ordertype === 'giveaway') {
      return 0;
    }
    
    const price = calculateOrderSubtotal(order);
    const commissionRate = settings.commission_rate || 0;
    const serviceFee = (price * commissionRate) / 100;
    const processingFeeRate = 2.9;
    const processingFeeFixed = 0.30;
    const orderTotal = price + (order.tax || 0) + (order.shipping_fee || 0);
    const processingFee = (orderTotal * (processingFeeRate / 100)) + processingFeeFixed;
    const sellerShippingCost = order.seller_shipping_fee_pay || 0;
    return price - serviceFee - processingFee - sellerShippingCost;
  };

  // Apply client-side filtering by show/marketplace
  const filteredOrders = orders?.filter((order: TokshopOrder) => {
    // Filter by show
    if (selectedShowId !== "all") {
      if (selectedShowId === "marketplace") {
        // Show only marketplace orders (ordertype === 'marketplace' or no tokshow)
        if (order.ordertype !== 'marketplace' && order.tokshow) {
          return false;
        }
      } else {
        // Show only orders from specific show
        if (order.tokshow !== selectedShowId) {
          return false;
        }
      }
    }
    
    return true;
  }).sort((a: TokshopOrder, b: TokshopOrder) => {
    // Sort by newest first (default)
    const aDate = a.date ? new Date(a.date) : new Date(a.createdAt || 0);
    const bDate = b.date ? new Date(b.date) : new Date(b.createdAt || 0);
    return bDate.getTime() - aDate.getTime();
  }) || [];

  // Calculate pagination data
  const totalOrders = orderResponse?.total || 0;
  const totalPages = orderResponse?.pages || 0;

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-8"></div>
            <div className="grid grid-cols-5 gap-4 mb-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry functionality
  if (isError) {
    return (
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <Card className="max-w-md mx-auto mt-8">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-destructive text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Failed to Load Orders
                </h2>
                <p className="text-muted-foreground mb-4">
                  {ordersError?.message || "Something went wrong while loading your orders. Please try again."}
                </p>
                <Button 
                  onClick={() => refetch()}
                  data-testid="button-retry-orders"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="px-4 sm:px-6 md:px-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-orders-title">
            Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Manage and track all your customer orders
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Show Filter */}
            <div className="w-full sm:w-auto sm:min-w-64 sm:max-w-md">
              <Select
                value={selectedShowId}
                onValueChange={handleShowFilterChange}
              >
                <SelectTrigger data-testid="select-show">
                  <SelectValue placeholder="Filter by show..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shows & Marketplace</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                  {endedShows.map((show: any) => {
                    const showDate = show.date || show.startDate || show.createdAt;
                    const formattedDate = showDate 
                      ? ` • ${format(new Date(showDate), "d MMM • HH:mm")}` 
                      : "";
                    
                    const showTitle = show.title || `Show #${show._id.slice(-8)}`;
                    
                    return (
                      <SelectItem key={show._id} value={show._id}>
                        <span className="block">
                          <span className="font-medium">{showTitle}</span>
                          {formattedDate && (
                            <>
                              <br />
                              <span className="text-xs text-muted-foreground">{formattedDate}</span>
                            </>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-64">
              <Select
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Filter by status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters Button */}
            <Button
              variant="outline"
              onClick={handleResetFilters}
              data-testid="button-reset-filters"
              className="w-full sm:w-auto"
            >
              <X size={16} className="mr-1" />
              Reset Filters
            </Button>
          </div>

          <div className="text-sm text-muted-foreground mt-4">
            Showing {filteredOrders.length} of {totalOrders} orders
          </div>
        </div>


        {/* Orders Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Sales Channel
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  {user?.seller !== false && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Earnings
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No orders found</h3>
                      <p className="text-muted-foreground">
                        {statusFilter !== "all" || selectedShowId !== "all"
                          ? "Try adjusting your filters" 
                          : "Orders will appear here when customers make purchases"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const productName = order.giveaway?.name || order.items?.[0]?.productId?.name || 'N/A';
                    const orderReference = order.items?.[0]?.order_reference || '';
                    const orderId = order.invoice || order._id.slice(-8);
                    const customerUsername = order.customer?.userName || 'Unknown';
                    const itemQuantity = order.giveaway ? 1 : (order.items?.length || 0);
                    const orderDate = order.date ? new Date(order.date) : new Date(order.createdAt || Date.now());
                    const price = calculateOrderSubtotal(order);
                    const earnings = calculateNetEarnings(order);
                    const orderStatus = order.status || 'processing';

                    return (
                      <tr 
                        key={order._id}
                        className="hover:bg-muted/50 cursor-pointer transition-colors"
                        data-testid={`row-order-${order._id}`}
                        onClick={() => {
                          setSelectedOrder(order);
                          setDrawerOpen(true);
                        }}
                      >
                        {/* Order column - product name + order reference + order ID */}
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-foreground">
                            {productName}{orderReference ? ` ${orderReference}` : ''}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Order #{orderId}
                          </div>
                        </td>

                        {/* Date column */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {format(orderDate, "dd MMM yyyy")}
                        </td>

                        {/* Customer column - username as link */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div 
                            className="text-sm text-primary cursor-pointer hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (order.customer?._id) {
                                setLocation('/profile/' + order.customer._id);
                              }
                            }}
                          >
                            {customerUsername}
                          </div>
                        </td>

                        {/* Items column */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                          {itemQuantity}
                        </td>

                        {/* Sales Channel column */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                          {order.tokshow ? 'Show' : 'Marketplace'}
                        </td>

                        {/* Price column - US$ format */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                          US${price.toFixed(2)}
                        </td>

                        {/* Order Status column */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge 
                            className={statusColors[orderStatus as keyof typeof statusColors]}
                            data-testid={`order-status-${orderStatus}`}
                          >
                            {formatStatus(orderStatus)}
                          </Badge>
                        </td>

                        {/* Earnings column - seller only */}
                        {user?.seller !== false && (
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-foreground">
                              ${earnings.toFixed(2)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span>{formatStatus(orderStatus)}</span>
                            </div>
                          </td>
                        )}

                        {/* Actions column - message icon */}
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            data-testid={`button-message-customer-${order._id}`}
                            disabled={messagingOrderId === order._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMessageBuyer(order);
                            }}
                          >
                            <MessageSquare size={16} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination Controls */}
        <div className="mt-6">
          <CompletePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalOrders}
            itemsPerPage={itemsPerPage}
            itemsPerPageOptions={[10, 20, 50, 100]}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            showingText="orders"
            className="bg-white dark:bg-gray-950 rounded-lg border p-4"
          />
        </div>
      </div>

      {/* Order Details Drawer */}
      <OrderDetailsDrawer
        order={selectedOrder}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onCancelOrder={handleCancelOrder}
        cancelLoading={cancelOrderMutation.isPending}
        onViewShipment={(order) => {
          // Store order data for shipments page to open the drawer
          sessionStorage.setItem('openShipmentDrawer', JSON.stringify(order));
          setDrawerOpen(false);
          setLocation('/shipping');
        }}
        onMessageBuyer={(order) => {
          // TODO: Implement messaging functionality
          toast({ title: "Messaging feature coming soon!" });
        }}
      />
    </div>
  );
}
