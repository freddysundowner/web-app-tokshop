import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Printer,
  Search,
  ChevronDown,
  ChevronRight,
  Package2,
  Unlink2,
  X,
  Eye,
  MoreHorizontal,
  Ship,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type {
  TokshopOrder,
  TokshopOrdersResponse,
} from "@shared/schema";

// Temporary type for shipment bundles (not exported from schema)
type ShipmentBundle = any;
import { format } from "date-fns";
import { ShippingDrawer } from "@/components/shipping/shipping-drawer";
import { SelectiveUnbundleDialog } from "@/components/shipping/selective-unbundle-dialog";
import { BulkLabelDialog } from "@/components/shipping/bulk-label-dialog";
import { ShipmentDetailsDrawer } from "@/components/shipping/shipment-details-drawer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CompletePagination } from "@/components/ui/pagination";

const statusColors = {
  unfulfilled:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  ready_to_ship:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipping: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  delivered:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  pickup:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

interface ShipmentMetrics {
  totalSold: string;
  totalEarned: string;
  totalShippingSpend: string;
  totalCouponSpend: string;
  itemsSold: number;
  totalDelivered: number;
  pendingDelivery: number;
}

type SortColumn = 'customer' | 'orderDate' | 'items' | 'total' | 'status';
type SortDirection = 'asc' | 'desc' | null;

export default function Shipping() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedShowId, setSelectedShowId] = useState<string>("all");
  const [bundleName, setBundleName] = useState("");
  const [showBundleDialog, setShowBundleDialog] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [relistOption, setRelistOption] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [unbundleDialogOpen, setUnbundleDialogOpen] = useState(false);
  const [unbundleBundleId, setUnbundleBundleId] = useState<string | null>(null);
  const [unbundleOrderDialogOpen, setUnbundleOrderDialogOpen] = useState(false);
  const [unbundleOrderId, setUnbundleOrderId] = useState<string | null>(null);
  const [bulkLabelDialogOpen, setBulkLabelDialogOpen] = useState(false);
  const [shipmentDetailsOpen, setShipmentDetailsOpen] = useState(false);
  const [shipmentDetailsOrder, setShipmentDetailsOrder] = useState<TokshopOrder | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [scanFormDialogOpen, setScanFormDialogOpen] = useState(false);
  const [scanFormError, setScanFormError] = useState<string | null>(null);
  const [generatedManifestId, setGeneratedManifestId] = useState<string | null>(null);
  const { user } = useAuth();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async ({
      orderId,
      relist,
    }: {
      orderId: string;
      relist: boolean;
    }) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled", relist }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel order");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      toast({ title: "Order cancelled successfully" });
      setCancelOrderId(null);
      setRelistOption(false);
    },
    onError: () => {
      toast({ title: "Failed to cancel order", variant: "destructive" });
    },
  });

  const handleCancelOrder = () => {
    if (cancelOrderId) {
      cancelOrderMutation.mutate({
        orderId: cancelOrderId,
        relist: relistOption,
      });
    }
  };

  // Mark as shipped mutation
  const markAsShippedMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "shipped" }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark order as shipped");
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

  const handleMarkAsShipped = (orderId: string) => {
    markAsShippedMutation.mutate(orderId);
  };

  const canCancelOrder = (order: TokshopOrder) => {
    // Can't cancel if already cancelled, shipped, delivered, or ended
    if (
      order.status === "cancelled" ||
      order.status === "shipped" ||
      order.status === "delivered" ||
      order.status === "ended"
    ) {
      return false;
    }
    
    // Can't cancel if a shipping label has been printed (has tracking number)
    if (order.tracking_number || (order as any).tracking_url) {
      return false;
    }
    
    return true;
  };

  // Unbundle items mutation
  const unbundleItemsMutation = useMutation({
    mutationFn: async ({ orderId, itemIds }: { orderId: string; itemIds: string[] }) => {
      const response = await fetch('/api/orders/unbundle/orders', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, itemIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to unbundle items");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bundles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/metrics"] });
      toast({ 
        title: "Items unbundled successfully",
        description: "Selected items have been created as separate orders"
      });
      setUnbundleOrderId(null);
      setUnbundleOrderDialogOpen(false);
    },
    onError: () => {
      toast({ 
        title: "Failed to unbundle items", 
        variant: "destructive" 
      });
    },
  });

  const handleUnbundleItems = (itemIds: string[]) => {
    if (unbundleOrderId && itemIds.length > 0) {
      unbundleItemsMutation.mutate({ orderId: unbundleOrderId, itemIds });
    }
  };

  // Generate scan form mutation
  const generateScanFormMutation = useMutation({
    mutationFn: async ({ tokshow, carrierAccount, ownerId }: { tokshow: string; carrierAccount?: string; ownerId?: string }) => {
      const response = await fetch('/api/shipping/generate/manifest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokshow, carrierAccount, ownerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error);
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh data (targets exact key tuples used by shipping/show queries)
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", "ended", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["show-orders-all", user?.id, selectedShowId] });
      
      // Clear any previous errors
      setScanFormError(null);
      
      // Store manifest_id if provided in response
      if (data.manifest_id) {
        setGeneratedManifestId(data.manifest_id);
        toast({
          title: "Scan form generation started",
          description: data.message || "SCAN Form generation has been initiated",
        });
      } else if (data.manifest?.object_state !== "VALID") {
        // Scan form is being generated, show info message
        toast({
          title: "Scan form generation in progress",
          description: data.message || "SCAN Form is being generated, retry later",
        });
      } else {
        // Scan form successfully generated
        toast({
          title: "Success",
          description: data.message || "SCAN Form generated successfully",
        });
      }
      
      setScanFormDialogOpen(false);
    },
    onError: (error: Error) => {
      // Set error state for dialog display
      setScanFormError(error.message);
      
      // Also show toast for immediate feedback
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch scan form by manifest ID mutation
  const fetchScanFormMutation = useMutation({
    mutationFn: async ({ manifestId, tokshow }: { manifestId: string; tokshow: string }) => {
      const params = new URLSearchParams();
      params.set('tokshow', tokshow);
      
      const response = await fetch(`/api/shipping/generate/manifest/${manifestId}?${params.toString()}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to fetch scan form");
      }

      return data;
    },
    onSuccess: (data) => {
      // If we got a scan form URL, open it
      if (data.scan_form_url) {
        window.open(data.scan_form_url, '_blank');
      } else {
        toast({
          title: "Scan form not ready",
          description: data.message || "The scan form is still being generated. Please try again in a moment.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateScanForm = () => {
    if (selectedShowId && selectedShowId !== 'all' && selectedShowId !== 'marketplace') {
      const carrierAccount = selectedShow?.carrierAccount;
      const ownerId = selectedShow?.owner?._id || selectedShow?.owner;
      generateScanFormMutation.mutate({ tokshow: selectedShowId, carrierAccount, ownerId });
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
    resetPaginationOnFilterChange();
  };

  // Fetch ended shows for filter dropdown
  const { data: endedShowsResponse } = useQuery({
    queryKey: ["/api/rooms", "ended", user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("status", "ended");
      if (user?.id) {
        params.set("userid", user.id);
      }
      const response = await fetch(`/api/rooms?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch ended shows");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const endedShows = endedShowsResponse?.rooms || [];

  // Get selected show data to check for existing scan form
  const selectedShow = endedShows.find((show: any) => show._id === selectedShowId);
  const hasScanForm = selectedShow?.scan_form_url && selectedShow.scan_form_url.trim() !== '';
  const hasManifestId = selectedShow?.manifest_id && selectedShow.manifest_id.trim() !== '';

  const handleScanFormAction = () => {
    // Only allow action if a specific show is selected (not all or marketplace)
    if (!selectedShowId || selectedShowId === 'all' || selectedShowId === 'marketplace') {
      toast({
        title: "Cannot generate scan form",
        description: "Please select a specific show to generate a scan form",
        variant: "destructive",
      });
      return;
    }

    // Priority 1: Use existing scan_form_url from show data
    if (hasScanForm && selectedShow?.scan_form_url) {
      window.open(selectedShow.scan_form_url, '_blank');
    } 
    // Priority 2: Use manifest_id from show data
    else if (hasManifestId && selectedShow?.manifest_id) {
      fetchScanFormMutation.mutate({ manifestId: selectedShow.manifest_id, tokshow: selectedShowId });
    }
    // Priority 3: Use generated manifest_id from local state
    else if (generatedManifestId) {
      fetchScanFormMutation.mutate({ manifestId: generatedManifestId, tokshow: selectedShowId });
    } 
    // Priority 4: Open dialog to generate new scan form
    else {
      setScanFormError(null);
      setScanFormDialogOpen(true);
    }
  };

  // Reset generated manifest ID when show changes
  useEffect(() => {
    setGeneratedManifestId(null);
  }, [selectedShowId]);

  // Fetch all orders for the selected show (for scan form validation)
  const { 
    data: showOrdersResponse, 
    isLoading: isLoadingShowOrders, 
    isError: isErrorShowOrders,
    error: showOrdersError,
    refetch: refetchShowOrders
  } = useQuery<TokshopOrdersResponse>({
    queryKey: ["show-orders-all", user?.id, selectedShowId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) {
        params.set("userId", user.id);
      }
      if (selectedShowId && selectedShowId !== "all" && selectedShowId !== "marketplace") {
        params.set("tokshow", selectedShowId);
      }

      const response = await fetch(`/api/orders?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`External API error: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user?.id && !!selectedShowId && selectedShowId !== "all" && selectedShowId !== "marketplace",
    staleTime: 0,
  });

  // Check if all orders in the selected show have shipment_id (use complete show orders, not filtered/paged)
  const allShowOrders = showOrdersResponse?.orders || [];
  const showTotalOrders = showOrdersResponse?.total || 0;
  const ordersWithoutShipmentId = allShowOrders.filter((order: any) => !(order as any).shipment_id);
  const allOrdersHaveShipmentId = showOrdersResponse && !isLoadingShowOrders && !isErrorShowOrders 
    ? ordersWithoutShipmentId.length === 0 
    : false;

  const { data: metrics, isLoading: metricsLoading, error: metricsError, isError: metricsIsError, refetch: refetchMetrics } =
    useQuery<ShipmentMetrics>({
      queryKey: ["/api/shipping/metrics", user?.id],
      enabled: !!user?.id,
      staleTime: 0, // Always fetch fresh data
      refetchOnMount: true, // Refetch when component mounts
    });

  const { data: orderResponse, isLoading: ordersLoading, error: ordersError, isError: ordersIsError, refetch: refetchOrders } =
    useQuery<TokshopOrdersResponse>({
      queryKey: ["external-orders", user?.id, statusFilter, selectedShowId, currentPage, itemsPerPage],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (user?.id) {
          params.set("userId", user.id);
        }
        if (statusFilter && statusFilter !== "all") {
          params.set("status", statusFilter);
        }
        if (selectedShowId && selectedShowId !== "all") {
          if (selectedShowId === "marketplace") {
            params.set("marketplace", "true");
          } else {
            params.set("tokshow", selectedShowId);
          }
        }
        // Add pagination parameters
        params.set("page", currentPage.toString());
        params.set("limit", itemsPerPage.toString());

        const response = await fetch(
          `/api/orders?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`External API error: ${response.status}`);
        }
        return response.json();
      },
      enabled: !!user?.id, // Only run query when user ID is available
      staleTime: 0, // Always fetch fresh data
      refetchOnMount: true, // Refetch when component mounts
    });

  // Extract orders array from the response
  const orders = orderResponse?.orders || [];
  
  // Extract pagination data from response
  const totalOrders = orderResponse?.total || 0;
  const totalPages = orderResponse?.pages || 0;

  // Separate unfiltered query for bundle status calculation
  const { data: allOrdersResponse, refetch: refetchAllOrders } = useQuery<TokshopOrdersResponse>({
    queryKey: ["external-orders", user?.id, "all", "all"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) {
        params.set("userId", user.id);
      }

      const response = await fetch(
        `/api/orders?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`External API error: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
  });

  // Extract unfiltered orders for bundle status calculation
  const allOrders = allOrdersResponse?.orders || [];

  const { data: bundles, isLoading: bundlesLoading, error: bundlesError, isError: bundlesIsError, refetch: refetchBundles } = useQuery<
    ShipmentBundle[]
  >({
    queryKey: ["/api/bundles", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User ID required");
      const response = await fetch(`/api/bundles?userId=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch bundles");
      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
  });

  // Check if we should open shipment details drawer from navigation
  useEffect(() => {
    const orderToOpen = sessionStorage.getItem('openShipmentDrawer');
    if (orderToOpen) {
      try {
        const order = JSON.parse(orderToOpen);
        setShipmentDetailsOrder(order);
        setShipmentDetailsOpen(true);
        sessionStorage.removeItem('openShipmentDrawer');
      } catch (error) {
        console.error('Failed to parse order from sessionStorage:', error);
        sessionStorage.removeItem('openShipmentDrawer');
      }
    }
  }, []);

  // Use orders directly - the API returns what it should return
  const displayItems: TokshopOrder[] = (orders || []).sort((a, b) => {
    // Apply custom sorting if a sort column is selected
    if (sortColumn && sortDirection) {
      let compareValue = 0;
      
      if (sortColumn === 'customer') {
        const nameA = `${a.customer?.firstName || ''} ${a.customer?.lastName || ''}`;
        const nameB = `${b.customer?.firstName || ''} ${b.customer?.lastName || ''}`;
        compareValue = nameA.localeCompare(nameB);
      } else if (sortColumn === 'orderDate') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        compareValue = dateA - dateB;
      } else if (sortColumn === 'items') {
        const itemsA = a.giveaway ? 1 : (a.items?.length || 0);
        const itemsB = b.giveaway ? 1 : (b.items?.length || 0);
        compareValue = itemsA - itemsB;
      } else if (sortColumn === 'total') {
        const totalA = (a.total || 0) + (a.tax || 0) + (a.shipping_fee || 0);
        const totalB = (b.total || 0) + (b.tax || 0) + (b.shipping_fee || 0);
        compareValue = totalA - totalB;
      } else if (sortColumn === 'status') {
        const statusA = a.status || '';
        const statusB = b.status || '';
        compareValue = statusA.localeCompare(statusB);
      }
      
      return sortDirection === 'asc' ? compareValue : -compareValue;
    }
    
    // Default sorting by date (newest first)
    const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return bDate.getTime() - aDate.getTime();
  });

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    // Only allow selection of orders with 'processing' status
    const order = orders?.find((o) => o._id === orderId);
    if (checked && order?.status !== "processing") {
      toast({
        title: "Only processing orders can be bundled",
        variant: "destructive",
      });
      return;
    }

    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all processing orders from the entire orders array (includes both unbundled and multi-item orders)
      const processingOrderIds = orders
        .filter((order) => order.status === "processing")
        .map((order) => order._id);
      setSelectedOrders(processingOrderIds);
    } else {
      setSelectedOrders([]);
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    if (expandedOrders.includes(orderId)) {
      setExpandedOrders(expandedOrders.filter((id) => id !== orderId));
    } else {
      setExpandedOrders([...expandedOrders, orderId]);
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const createBundleMutation = useMutation({
    mutationFn: async (data: { orderIds: string[] }) => {
      if (!user?.id) throw new Error("User ID required");

      const response = await fetch("/api/orders/bundle/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId: user.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create bundle" }));
        throw new Error(errorData.message || "Failed to create bundle");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bundles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/metrics"] });
      setSelectedOrders([]);
      setBundleName("");
      setShowBundleDialog(false);
      toast({ title: "Bundle created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create bundle", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const unbundleMutation = useMutation({
    mutationFn: async ({ bundleId, orderIds }: { bundleId: string; orderIds?: string[] }) => {
      if (!user?.id) throw new Error("User ID required");
      const response = await fetch(
        `/api/bundles/${bundleId}?userId=${user.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: orderIds ? JSON.stringify({ orderIds }) : undefined,
        },
      );
      if (!response.ok) throw new Error("Failed to unbundle orders");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bundles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/metrics"] });
      toast({ title: "Orders unbundled successfully" });
    },
    onError: () => {
      toast({ title: "Failed to unbundle orders", variant: "destructive" });
    },
  });

  const cancelBundleMutation = useMutation({
    mutationFn: async ({
      bundleId,
      relist,
    }: {
      bundleId: string;
      relist: boolean;
    }) => {
      if (!user?.id) throw new Error("User ID required");

      // Get all orders in the bundle (use unfiltered orders)
      const bundleOrders =
        allOrders?.filter((order) => order.bundleId === bundleId) || [];

      // Cancel each order in the bundle with relist option
      const cancelPromises = bundleOrders.map((order) =>
        fetch(`/api/orders/${order._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "cancelled",
            relist,
          }),
        }),
      );

      const results = await Promise.all(cancelPromises);
      const failedCancellations = results.filter((response) => !response.ok);

      if (failedCancellations.length > 0) {
        throw new Error(
          `Failed to cancel ${failedCancellations.length} orders in bundle`,
        );
      }

      return { cancelledOrders: bundleOrders.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bundles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/metrics"] });
      toast({
        title: `Bundle cancelled - ${data.cancelledOrders} orders cancelled`,
      });
      setCancelOrderId(null);
      setRelistOption(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to cancel bundle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
        const errorData = await response.json().catch(() => ({ message: "Failed to mark order as shipped" }));
        throw new Error(errorData.message || "Failed to mark order as shipped");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/metrics"] });
      toast({ title: "Order marked as shipped" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark order as shipped",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const shipBundleMutation = useMutation({
    mutationFn: async (bundleId: string) => {
      if (!user?.id) throw new Error("User ID required");

      // Call backend endpoint to mark all orders in bundle as shipped
      const response = await fetch(`/api/orders/bundle/${bundleId}/ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: "Failed to mark bundle as shipped" 
        }));
        throw new Error(errorData.error || "Failed to mark bundle as shipped");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bundles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/metrics"] });
      toast({
        title: `Bundle shipped - ${data.shippedOrders} orders marked as shipped`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to ship bundle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateBundle = () => {
    if (selectedOrders.length < 2) {
      toast({
        title: "Select at least 2 orders to bundle",
        variant: "destructive",
      });
      return;
    }
    setShowBundleDialog(true);
  };

  const confirmCreateBundle = () => {
    createBundleMutation.mutate({ orderIds: selectedOrders });
  };

  const handleUnbundle = (orderId: string) => {
    // Since we're using item count, orderId is the bundle identifier
    setUnbundleBundleId(orderId);
    setUnbundleDialogOpen(true);
  };

  const confirmUnbundle = async (itemsByOrder: Record<string, string[]>) => {
    if (!unbundleBundleId) return;
    
    // Call unbundle endpoint for each order with its items
    const orderIds = Object.keys(itemsByOrder);
    
    try {
      for (const orderId of orderIds) {
        const itemIds = itemsByOrder[orderId];
        
        const response = await fetch('/api/orders/unbundle/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId, itemIds }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Failed to unbundle items from order ${orderId}` }));
          throw new Error(errorData.message || `Failed to unbundle items from order ${orderId}`);
        }
      }
      
      // Invalidate queries after successful unbundling
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bundles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/metrics"] });
      
      toast({ 
        title: "Items unbundled successfully",
        description: `${Object.values(itemsByOrder).flat().length} items unbundled from ${orderIds.length} order(s)`
      });
      
      setUnbundleDialogOpen(false);
      setUnbundleBundleId(null);
    } catch (error) {
      toast({ 
        title: "Failed to unbundle items", 
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive" 
      });
    }
  };

  const handleCancelBundle = (bundleId: string) => {
    cancelBundleMutation.mutate({ bundleId, relist: relistOption });
  };

  // Bulk label purchase mutation
  const bulkLabelMutation = useMutation({
    mutationFn: async ({ orderIds, labelFileType }: { orderIds: string[]; labelFileType: string }) => {
      if (!user?.id) throw new Error("User ID required");

      const response = await fetch("/api/shipping/bulk-labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds, labelFileType, userId: user.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to purchase labels" }));
        throw new Error(errorData.message || "Failed to purchase labels");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["external-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipping/metrics"] });
      setSelectedOrders([]);
      setBulkLabelDialogOpen(false);
      toast({ 
        title: `${data.successCount || selectedOrders.length} label(s) purchased successfully`,
        description: data.failureCount ? `${data.failureCount} label(s) failed` : undefined
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to purchase labels", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleBulkLabelPurchase = () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "No orders selected",
        description: "Please select at least one order to purchase labels",
        variant: "destructive",
      });
      return;
    }
    setBulkLabelDialogOpen(true);
  };

  const confirmBulkLabelPurchase = (labelFileType: string) => {
    bulkLabelMutation.mutate({ orderIds: selectedOrders, labelFileType });
  };

  if (metricsLoading || ordersLoading || bundlesLoading) {
    return (
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-8"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry functionality
  if (metricsIsError || ordersIsError || bundlesIsError) {
    const errors = [];
    if (metricsIsError) errors.push("metrics");
    if (ordersIsError) errors.push("orders");
    if (bundlesIsError) errors.push("bundles");
    
    return (
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <Card className="max-w-md mx-auto mt-8">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-destructive text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Failed to Load Shipping Data
                </h2>
                <p className="text-muted-foreground mb-4">
                  {ordersError?.message || metricsError?.message || bundlesError?.message || 
                   `Something went wrong while loading your ${errors.join(", ")}. Please try again.`}
                </p>
                <div className="flex gap-2 justify-center">
                  {metricsIsError && (
                    <Button 
                      onClick={() => refetchMetrics()}
                      variant="outline"
                      size="sm"
                      data-testid="button-retry-metrics"
                    >
                      Retry Metrics
                    </Button>
                  )}
                  {ordersIsError && (
                    <Button 
                      onClick={() => refetchOrders()}
                      variant="outline"
                      size="sm"
                      data-testid="button-retry-orders"
                    >
                      Retry Orders
                    </Button>
                  )}
                  {bundlesIsError && (
                    <Button 
                      onClick={() => refetchBundles()}
                      variant="outline"
                      size="sm"
                      data-testid="button-retry-bundles"
                    >
                      Retry Bundles
                    </Button>
                  )}
                  <Button 
                    onClick={() => {
                      refetchMetrics();
                      refetchOrders();
                      refetchBundles();
                    }}
                    data-testid="button-retry-all"
                  >
                    Retry All
                  </Button>
                </div>
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
          <h1
            className="text-xl sm:text-2xl font-bold text-foreground"
            data-testid="text-shipments-title"
          >
            Shipments
          </h1>
          <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
            <p className="text-sm text-muted-foreground">
              View shipments by live show or marketplace
            </p>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {format(new Date(), "MM/dd/yyyy 'at' h:mm a")} • Shipping Complete
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="mb-6 sm:mb-8">
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <Card className="border-2 border-accent bg-accent/10">
              <CardContent className="p-3 sm:p-4 text-center">
                <div
                  className="text-lg font-bold text-foreground"
                  data-testid="metric-total-sold"
                >
                  ${metrics?.totalSold || "0"}
                </div>
                <div className="text-xs text-muted-foreground">Total Sold</div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="p-3 sm:p-4 text-center">
                <div
                  className="text-lg font-bold text-foreground"
                  data-testid="metric-total-earned"
                >
                  ${metrics?.totalEarned || "0"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Earned (Paid Out)
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="p-3 sm:p-4 text-center">
                <div
                  className="text-lg font-bold text-foreground"
                  data-testid="metric-shipping-spend"
                >
                  ${metrics?.totalShippingSpend || "0"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Shipping Spend
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="p-3 sm:p-4 text-center">
                <div
                  className="text-lg font-bold text-foreground"
                  data-testid="metric-items-sold"
                >
                  {metrics?.itemsSold || 0}
                </div>
                <div className="text-xs text-muted-foreground">Items sold</div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="p-3 sm:p-4 text-center">
                <div
                  className="text-lg font-bold text-foreground"
                  data-testid="metric-total-delivered"
                >
                  {metrics?.totalDelivered || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Delivered
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="p-3 sm:p-4 text-center">
                <div
                  className="text-lg font-bold text-foreground"
                  data-testid="metric-pending-delivery"
                >
                  {metrics?.pendingDelivery || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Pending Delivery
                </div>
              </CardContent>
            </Card>
          </div>
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
                  <SelectItem value="processing">Need Label</SelectItem>
                  <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
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

            {/* Scan Form Button - Only show for "Ready to Ship" status */}
            {statusFilter === 'ready_to_ship' && (
              <div className="w-full sm:w-auto sm:ml-auto">
                <Button
                  variant="default"
                  disabled={!selectedShowId || selectedShowId === 'all' || selectedShowId === 'marketplace'}
                  onClick={handleScanFormAction}
                  data-testid="button-generate-scan-form"
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  <Printer size={16} className="mr-1" />
                  {(hasScanForm || hasManifestId || generatedManifestId) ? 'View Scan Form' : 'Generate Scan Form'}
                </Button>

                {/* Scan Form Dialog */}
                <AlertDialog open={scanFormDialogOpen} onOpenChange={setScanFormDialogOpen}>
                <AlertDialogContent data-testid="dialog-scan-form">
                  <AlertDialogHeader>
                    <AlertDialogTitle data-testid="text-scan-form-title">Generate USPS Scan Form</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-4">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3" data-testid="text-scan-form-warning">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                            ⚠️ Important: This scan form can only be generated once and cannot be regenerated.
                          </p>
                        </div>

                        {isLoadingShowOrders && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3" data-testid="text-scan-form-loading">
                            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                              Loading order information...
                            </p>
                          </div>
                        )}

                        {isErrorShowOrders && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3" data-testid="text-scan-form-fetch-error">
                            <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                              ⚠️ Failed to load order information
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                              {showOrdersError?.message || 'Unable to fetch orders for this show'}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => refetchShowOrders()}
                              className="mt-2"
                              data-testid="button-retry-orders"
                            >
                              Retry
                            </Button>
                          </div>
                        )}

                        {!isLoadingShowOrders && !isErrorShowOrders && !allOrdersHaveShipmentId && showOrdersResponse && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3" data-testid="text-scan-form-error">
                            <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                              ⚠️ Cannot generate scan form: {ordersWithoutShipmentId.length} order{ordersWithoutShipmentId.length !== 1 ? 's' : ''} {ordersWithoutShipmentId.length !== 1 ? 'do' : 'does'} not have shipping labels purchased yet.
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                              Please purchase shipping labels for all orders before generating a scan form.
                            </p>
                          </div>
                        )}

                        {scanFormError && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3" data-testid="text-scan-form-generation-error">
                            <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                              ⚠️ Failed to generate scan form
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                              {scanFormError}
                            </p>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-3">
                            <span className="text-sm font-medium text-foreground">Show:</span>
                            <span className="text-sm text-muted-foreground text-right" data-testid="text-scan-form-show-name">
                              {selectedShowId && selectedShowId !== 'all' && selectedShowId !== 'marketplace' 
                                ? (() => {
                                    const show = endedShows.find((s: any) => s._id === selectedShowId);
                                    const showDate = show?.date || show?.startDate || show?.createdAt;
                                    const formattedDate = showDate 
                                      ? format(new Date(showDate), "d MMM yyyy • HH:mm") 
                                      : "";
                                    const showTitle = show?.title || `Show #${selectedShowId.slice(-8)}`;
                                    return (
                                      <>
                                        <div className="font-medium">{showTitle}</div>
                                        {formattedDate && <div className="text-xs">{formattedDate}</div>}
                                      </>
                                    );
                                  })()
                                : '-'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center gap-3">
                            <span className="text-sm font-medium text-foreground">Total Orders:</span>
                            <span className="text-sm text-muted-foreground" data-testid="text-scan-form-total-orders">{showTotalOrders}</span>
                          </div>

                          {!allOrdersHaveShipmentId && (
                            <div className="flex justify-between items-center gap-3">
                              <span className="text-sm font-medium text-foreground">Orders without labels:</span>
                              <span className="text-sm text-red-600 dark:text-red-400 font-medium" data-testid="text-scan-form-orders-without-labels">{ordersWithoutShipmentId.length}</span>
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground" data-testid="text-scan-form-description">
                          This will generate a USPS scan form for all orders in this show. 
                          Make sure all shipping labels have been purchased before proceeding.
                        </p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-scan-form">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleGenerateScanForm}
                      disabled={isLoadingShowOrders || isErrorShowOrders || !showOrdersResponse || !allOrdersHaveShipmentId || generateScanFormMutation.isPending || !!scanFormError}
                      data-testid="button-confirm-scan-form"
                    >
                      {generateScanFormMutation.isPending ? "Generating..." : "Generate Scan Form"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <div className="w-full flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                1-{displayItems.length} of {displayItems.length}
              </div>
              {selectedOrders.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {selectedOrders.length} selected
                  </span>
                  <Dialog
                    open={showBundleDialog}
                    onOpenChange={setShowBundleDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCreateBundle}
                        disabled={selectedOrders.length < 2}
                        data-testid="button-create-bundle"
                      >
                        <Package2 size={14} className="mr-1" />
                        Bundle ({selectedOrders.length})
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Shipment Bundle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label
                          htmlFor="bundleName"
                          className="text-sm font-medium"
                        >
                          Bundle Name
                        </label>
                        <Input
                          id="bundleName"
                          value={bundleName}
                          onChange={(e) => setBundleName(e.target.value)}
                          placeholder="Enter bundle name"
                          className="mt-1"
                          data-testid="input-bundle-name"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowBundleDialog(false)}
                          data-testid="button-cancel-bundle"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={confirmCreateBundle}
                          disabled={createBundleMutation.isPending}
                          data-testid="button-confirm-bundle"
                        >
                          Create Bundle
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleBulkLabelPurchase}
                    disabled={selectedOrders.length === 0}
                    data-testid="button-buy-labels"
                  >
                    <Printer size={14} className="mr-1" />
                    Buy Labels ({selectedOrders.length})
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Shipments Table */}
          <Card className="shadow border border-border w-full">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse divide-y divide-border text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-3 text-left w-10">
                      <Checkbox
                        checked={
                          selectedOrders.length ===
                            orders.filter(
                              (order) => order.status === "processing",
                            ).length &&
                          orders.filter(
                            (order) => order.status === "processing",
                          ).length > 0
                        }
                        onCheckedChange={handleSelectAll}
                        data-testid="checkbox-select-all-shipments"
                      />
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap cursor-pointer select-none hover:bg-muted/80"
                      onClick={() => handleSort('customer')}
                    >
                      <div className="flex items-center gap-1">
                        Customer
                        {sortColumn === 'customer' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-50" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap cursor-pointer select-none hover:bg-muted/80"
                      onClick={() => handleSort('orderDate')}
                    >
                      <div className="flex items-center gap-1">
                        Order Date
                        {sortColumn === 'orderDate' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-50" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase whitespace-nowrap cursor-pointer select-none hover:bg-muted/80"
                      onClick={() => handleSort('items')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Items
                        {sortColumn === 'items' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-50" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase whitespace-nowrap cursor-pointer select-none hover:bg-muted/80"
                      onClick={() => handleSort('total')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Total
                        {sortColumn === 'total' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-50" />
                        )}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                      Dimensions
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap cursor-pointer select-none hover:bg-muted/80"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {sortColumn === 'status' ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-50" />
                        )}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {displayItems.map((order) => {
                    return (
                      <React.Fragment key={order._id}>
                        <tr data-testid={`row-shipment-${order._id}`}>
                          <td className="px-3 py-3">
                            <Checkbox
                              checked={selectedOrders.includes(order._id)}
                              onCheckedChange={(checked) =>
                                handleSelectOrder(
                                  order._id,
                                  checked as boolean,
                                )
                              }
                              data-testid={`checkbox-shipment-${order._id}`}
                              disabled={order.status !== "processing"}
                              className={
                                order.status !== "processing"
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  toggleOrderExpansion(order._id)
                                }
                                className="p-1 h-5 w-5 mr-1"
                                data-testid={`button-expand-${order._id}`}
                              >
                                {expandedOrders.includes(order._id) ? (
                                  <ChevronDown size={12} />
                                ) : (
                                  <ChevronRight size={12} />
                                )}
                              </Button>
                              <div>
                                <div className="flex items-center">
                                  {order.status === "delivered" && (
                                    <div className="text-xs bg-accent text-accent-foreground px-1 rounded mr-1">
                                      NEW
                                    </div>
                                  )}
                                  <span className="text-sm font-medium text-foreground">
                                    {order.customer?.firstName || "Unknown"}{" "}
                                    {order.customer?.lastName || ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm text-muted-foreground">
                              {order.createdAt
                                ? format(
                                    new Date(order.createdAt),
                                    "MMM dd, yyyy",
                                  )
                                : format(
                                    new Date(order.date || 0),
                                    "MMM dd, yyyy",
                                  )}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-center">
                              <div className="text-sm text-foreground font-medium">
                                {order.giveaway ? 1 : (order.items?.length || 0)}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground">
                                $
                                {(() => {
                                  if (order.giveaway) {
                                    return ((order.total || 0) + (order.tax || 0) + (order.shipping_fee || 0)).toFixed(2);
                                  }
                                  if (order.items && order.items.length > 0) {
                                    const itemsSubtotal = order.items.reduce((sum, item) => {
                                      const quantity = item.quantity || 0;
                                      const price = item.price || 0;
                                      return sum + (quantity * price);
                                    }, 0);
                                    return (itemsSubtotal + (order.tax || 0) + (order.shipping_fee || 0)).toFixed(2);
                                  }
                                  return "0.00";
                                })()}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-center text-sm text-muted-foreground">
                              <div className="text-xs">
                                {order.weight
                                  ? `${order.weight}${order.scale || "oz"}`
                                  : order.giveaway?.shipping_profile?.weight
                                    ? `${order.giveaway.shipping_profile.weight}${order.giveaway.shipping_profile.scale || "oz"}`
                                    : order.items &&
                                        order.items.length > 0 &&
                                        order.items[0].weight
                                      ? `${order.items[0].weight}${order.items[0].scale || "oz"}`
                                      : "-"}
                              </div>
                              <div className="text-xs">
                                {order.length && order.width && order.height
                                  ? `${order.height}×${order.width}×${order.length}"`
                                  : order.giveaway
                                    ? "Giveaway"
                                    : order.items &&
                                        order.items.length > 0 &&
                                        order.items[0].height &&
                                        order.items[0].width &&
                                        order.items[0].length
                                      ? `${order.items[0].height}×${order.items[0].width}×${order.items[0].length}"`
                                      : "-"}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div>
                              <Badge
                                className={`${statusColors[order.status as keyof typeof statusColors]} text-xs`}
                                data-testid={`shipment-status-${order.status}`}
                              >
                                {order.status === "delivered"
                                  ? "Delivered"
                                  : order.status
                                    ? order.status
                                        .replaceAll("_", " ")
                                        .charAt(0)
                                        .toUpperCase() +
                                      order.status
                                        .replaceAll("_", " ")
                                        .slice(1)
                                    : "Unknown"}
                              </Badge>
                              {order.tracking_number && (
                                <div
                                  className="text-xs text-primary font-mono mt-1 cursor-pointer hover:bg-primary/10 px-1 py-0.5 rounded transition-colors"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      order.tracking_number!,
                                    );
                                    toast({
                                      title: "Copied!",
                                      description:
                                        "Tracking number copied to clipboard",
                                    });
                                  }}
                                  title="Click to copy tracking number"
                                  data-testid={`tracking-number-${order._id}`}
                                >
                                  {order.tracking_number}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    data-testid={`button-order-menu-${order._id}`}
                                  >
                                    <MoreHorizontal size={16} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {/* View & Unbundle option for multi-item orders */}
                                  {!order.giveaway && order.items && order.items.length > 1 && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setUnbundleOrderId(order._id);
                                        setUnbundleOrderDialogOpen(true);
                                      }}
                                      data-testid={`menu-unbundle-${order._id}`}
                                    >
                                      <Unlink2 size={14} className="mr-2" />
                                      View & Unbundle
                                    </DropdownMenuItem>
                                  )}

                                  {/* Edit/Ship Label option for processing orders */}
                                  {order.status === "processing" && (
                                    <ShippingDrawer
                                      order={order}
                                      currentTab={statusFilter}
                                    >
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <Eye size={14} className="mr-2" />
                                        Edit/Ship Label
                                      </DropdownMenuItem>
                                    </ShippingDrawer>
                                  )}

                                  {/* Options for ready_to_ship orders */}
                                  {order.status === "ready_to_ship" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          if (order.label) {
                                            window.open(order.label, '_blank');
                                          } else {
                                            toast({
                                              title: "No label available",
                                              description: "This order doesn't have a shipping label",
                                              variant: "destructive"
                                            });
                                          }
                                        }}
                                        data-testid={`menu-view-label-${order._id}`}
                                      >
                                        <Eye size={14} className="mr-2" />
                                        View Label
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setShipmentDetailsOrder(order);
                                          setShipmentDetailsOpen(true);
                                        }}
                                        data-testid={`menu-view-details-${order._id}`}
                                      >
                                        <Package2 size={14} className="mr-2" />
                                        View Shipment Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleMarkAsShipped(order._id)}
                                        data-testid={`menu-mark-shipped-${order._id}`}
                                      >
                                        <Ship size={14} className="mr-2" />
                                        Mark as Shipped
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {/* Reprint option for shipped orders */}
                                  {(order.status === "shipped" ||
                                    order.status === "delivered") && (
                                    <ShippingDrawer
                                      order={order}
                                      currentTab={statusFilter}
                                    >
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <Printer size={14} className="mr-2" />
                                        Reprint Label
                                      </DropdownMenuItem>
                                    </ShippingDrawer>
                                  )}

                                  {/* Cancel order option for non-cancelled/shipped orders */}
                                  {order.status !== "cancelled" &&
                                    order.status !== "shipped" &&
                                    !order.tracking_number &&
                                    !(order as any).tracking_url && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <AlertDialog
                                          onOpenChange={(open) => {
                                            if (!open) {
                                              setCancelOrderId(null);
                                              setRelistOption(false);
                                            }
                                          }}
                                        >
                                          <AlertDialogTrigger asChild>
                                            <DropdownMenuItem
                                              onSelect={(e) =>
                                                e.preventDefault()
                                              }
                                              className="text-red-600"
                                              data-testid={`menu-cancel-${order._id}`}
                                              onClick={() =>
                                                setCancelOrderId(order._id)
                                              }
                                            >
                                              <X size={14} className="mr-2" />
                                              Cancel Order
                                            </DropdownMenuItem>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>
                                                Cancel Order
                                              </AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Are you sure you want to
                                                cancel order #
                                                {order.invoice ||
                                                  order._id.slice(-8)}
                                                ? This action cannot be
                                                undone.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>

                                            <div className="flex items-center space-x-2 my-4">
                                              <Checkbox
                                                id={`relist-${order._id}`}
                                                checked={relistOption}
                                                onCheckedChange={(checked) =>
                                                  setRelistOption(
                                                    Boolean(checked === true),
                                                  )
                                                }
                                                data-testid={`checkbox-relist-${order._id}`}
                                              />
                                              <label
                                                htmlFor={`relist-${order._id}`}
                                                className="text-sm"
                                              >
                                                Relist this order for future
                                                processing
                                              </label>
                                            </div>

                                            <AlertDialogFooter>
                                              <AlertDialogCancel
                                                onClick={() => {
                                                  setCancelOrderId(null);
                                                  setRelistOption(false);
                                                }}
                                                data-testid={`button-keep-order-${order._id}`}
                                              >
                                                Keep Order
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={handleCancelOrder}
                                                disabled={
                                                  cancelOrderMutation.isPending
                                                }
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                                                data-testid={`button-confirm-cancel-${order._id}`}
                                              >
                                                {cancelOrderMutation.isPending
                                                  ? "Cancelling..."
                                                  : "Cancel Order"}
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </>
                                    )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded row showing item details */}
                        {expandedOrders.includes(order._id) && (
                          <tr
                            className="bg-muted/50"
                            data-testid={`expanded-row-${order._id}`}
                          >
                            <td colSpan={8} className="px-3 py-3">
                              <div className="bg-card rounded-lg p-4 border">
                                <h4 className="font-medium text-sm mb-3 text-muted-foreground">
                                  Items in this order:
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b">
                                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Listing</th>
                                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Description</th>
                                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Qty</th>
                                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Weight</th>
                                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Sale Price</th>
                                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Shipping</th>
                                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Order Type</th>
                                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Date</th>
                                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {order.giveaway ? (
                                        <tr className="border-b">
                                          <td className="py-2 px-2">
                                            <div className="flex items-center gap-2">
                                              {order.giveaway.images && order.giveaway.images[0] ? (
                                                <img 
                                                  src={order.giveaway.images[0]} 
                                                  alt={order.giveaway.name}
                                                  className="w-10 h-10 object-cover rounded"
                                                />
                                              ) : (
                                                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                                  <Package2 size={16} className="text-muted-foreground" />
                                                </div>
                                              )}
                                              <div>
                                                <p className="font-medium">{order.giveaway.name}</p>
                                                <p className="text-xs text-muted-foreground">#{order.invoice || order._id.slice(-8)}</p>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="py-2 px-2 text-muted-foreground">{order.giveaway.description || '-'}</td>
                                          <td className="py-2 px-2">{order.giveaway.quantity || 1}</td>
                                          <td className="py-2 px-2">{order.giveaway.shipping_profile?.weight ? `${order.giveaway.shipping_profile.weight} ${order.giveaway.shipping_profile.scale || ''}` : '-'}</td>
                                          <td className="py-2 px-2">$0.00</td>
                                          <td className="py-2 px-2">${(order.shipping_fee || 0).toFixed(2)}</td>
                                          <td className="py-2 px-2">Giveaway</td>
                                          <td className="py-2 px-2 text-xs text-muted-foreground">
                                            {order.date ? new Date(order.date).toLocaleDateString() : '-'}
                                          </td>
                                          <td className="py-2 px-2">
                                            <span className={`px-2 py-1 rounded-md text-xs ${statusColors[order.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}>
                                              {order.status || 'unfulfilled'}
                                            </span>
                                          </td>
                                        </tr>
                                      ) : order.items && order.items.length > 0 ? (
                                        order.items.map((item, idx) => (
                                          <tr key={`${order._id}-${idx}`} className="border-b">
                                            <td className="py-2 px-2">
                                              <div className="flex items-center gap-2">
                                                {item.productId?.images && item.productId.images[0] ? (
                                                  <img 
                                                    src={item.productId.images[0]} 
                                                    alt={item.productId.name}
                                                    className="w-10 h-10 object-cover rounded"
                                                  />
                                                ) : (
                                                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                                    <Package2 size={16} className="text-muted-foreground" />
                                                  </div>
                                                )}
                                                <div>
                                                  <p className="font-medium">{item.productId?.name || 'Item'}{(item as any).order_reference ? ` ${(item as any).order_reference}` : ''}</p>
                                                  <p className="text-xs text-muted-foreground">#{order.invoice || order._id.slice(-8)}</p>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="py-2 px-2 text-muted-foreground">{item.productId?.category?.name || '-'}</td>
                                            <td className="py-2 px-2">{item.quantity || 1}</td>
                                            <td className="py-2 px-2">{item.weight ? `${item.weight} ${item.scale || ''}` : '-'}</td>
                                            <td className="py-2 px-2">${(item.price || 0).toFixed(2)}</td>
                                            <td className="py-2 px-2">${(item.shipping_fee || 0).toFixed(2)}</td>
                                            <td className="py-2 px-2">{order.tokshow ? 'Show' : 'Marketplace'}</td>
                                            <td className="py-2 px-2 text-xs text-muted-foreground">
                                              {order.date ? new Date(order.date).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="py-2 px-2">
                                              <span className={`px-2 py-1 rounded-md text-xs ${statusColors[order.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}>
                                                {order.status || 'unfulfilled'}
                                              </span>
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr className="border-b">
                                          <td colSpan={9} className="py-4 px-2 text-center text-muted-foreground">
                                            No items available
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="mt-3 pt-3 border-t border-border flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">
                                    Total items:{" "}
                                    {order.items?.reduce(
                                      (sum, item) =>
                                        sum + (item.quantity || 0),
                                      0,
                                    ) || 1}
                                  </span>
                                  <span className="font-medium text-foreground">
                                    Total value: $
                                    {(
                                      (order.total || 0) +
                                      (order.tax || 0) +
                                      (order.shipping_fee || 0)
                                    ).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </CardContent>
          </Card>
        </div>

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
            showingText="shipping items"
            className="bg-white dark:bg-gray-950 rounded-lg border p-4"
          />
        </div>

        {/* Unbundle Dialog */}
        <SelectiveUnbundleDialog
          open={unbundleOrderDialogOpen}
          onOpenChange={setUnbundleOrderDialogOpen}
          bundleOrders={
            unbundleOrderId
              ? [orders.find(o => o._id === unbundleOrderId)].filter(Boolean) as TokshopOrder[]
              : []
          }
          onUnbundle={async (itemsByOrder: Record<string, string[]>) => {
            const orderIds = Object.keys(itemsByOrder);
            for (const orderId of orderIds) {
              handleUnbundleItems(itemsByOrder[orderId]);
            }
          }}
          isPending={unbundleItemsMutation.isPending}
        />

        {/* Bulk Label Purchase Dialog */}
        <BulkLabelDialog
          open={bulkLabelDialogOpen}
          onOpenChange={setBulkLabelDialogOpen}
          orderCount={selectedOrders.length}
          onConfirm={confirmBulkLabelPurchase}
          isPending={bulkLabelMutation.isPending}
        />

        {/* Shipment Details Drawer */}
        <ShipmentDetailsDrawer
          open={shipmentDetailsOpen}
          onOpenChange={setShipmentDetailsOpen}
          order={shipmentDetailsOrder}
        />
      </div>
    </div>
  );
}
