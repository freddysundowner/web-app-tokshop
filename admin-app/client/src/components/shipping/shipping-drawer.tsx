import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Package, 
  Printer, 
  RefreshCw,
  Truck,
  DollarSign,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ShippingDrawerProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShippingEstimate {
  objectId: string;
  carrier: string;
  service: string;
  price: string;
  deliveryTime: string;
  estimatedDays?: number;
}

export function AdminShippingDrawer({ order, open, onOpenChange }: ShippingDrawerProps) {
  const [dimensions, setDimensions] = useState({
    length: "10",
    width: "8",
    height: "3",
  });
  const [weight, setWeight] = useState("16");
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<ShippingEstimate | null>(null);
  const [labelFileType, setLabelFileType] = useState("PDF");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (order && open) {
      if (order.giveaway) {
        setDimensions({
          length: order.giveaway.length?.toString() || "10",
          width: order.giveaway.width?.toString() || "8",
          height: order.giveaway.height?.toString() || "3",
        });
        setWeight(order.giveaway.shipping_profile?.weight?.toString() || order.weight?.toString() || "16");
      } else {
        setDimensions({
          length: order.length?.toString() || "10",
          width: order.width?.toString() || "8",
          height: order.height?.toString() || "3",
        });
        setWeight(order.weight?.toString() || "16");
      }
    }
  }, [order, open]);

  const hasValidDimensions = Boolean(
    dimensions.length && dimensions.width && dimensions.height && weight
  );

  const getOwnerId = () => {
    // For giveaway orders, owner comes from giveaway.user (the giveaway creator)
    if (order?.giveaway?.user?._id) return order.giveaway.user._id;
    if (order?.giveaway?.user && typeof order.giveaway.user === 'string') return order.giveaway.user;
    // Fallback to seller for regular orders
    if (order?.seller?._id) return order.seller._id;
    if (order?.seller && typeof order.seller === 'string') return order.seller;
    return 'admin';
  };

  const getCustomerId = () => {
    if (order?.customer?._id) return order.customer._id;
    if (order?.customer && typeof order.customer === 'string') return order.customer;
    return '';
  };

  const shippingEstimatesQuery = useQuery({
    queryKey: ['/api/shipping/profiles/estimate/rates', {
      weight,
      length: dimensions.length,
      width: dimensions.width,
      height: dimensions.height,
      orderId: order?._id,
    }],
    queryFn: async () => {
      const ownerId = getOwnerId();
      const customerId = getCustomerId();
      
      const requestData = {
        weight: weight,
        unit: order?.giveaway?.shipping_profile?.scale || "oz",
        product: order?.giveaway?._id || order?.items?.[0]?.productId?._id || order?._id,
        update: true,
        owner: ownerId,
        customer: customerId,
        length: parseFloat(dimensions.length),
        width: parseFloat(dimensions.width),
        height: parseFloat(dimensions.height),
        isGiveaway: true,
      };

      const response = await fetch(`/api/shipping/profiles/estimate/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch shipping estimates: ${response.status}`);
      }
      
      return await response.json() as ShippingEstimate[];
    },
    enabled: hasValidDimensions && open && !!order && !!getCustomerId(),
    retry: 1,
  });

  const estimates = shippingEstimatesQuery.data || [];

  const handleRefreshEstimates = () => {
    queryClient.invalidateQueries({ 
      queryKey: ['/api/shipping/profiles/estimate/rates'] 
    });
    toast({ title: "Refreshing shipping estimates..." });
  };

  const purchaseLabelMutation = useMutation({
    mutationFn: async (estimate: ShippingEstimate & { labelFileType?: string }) => {
      const requestData = {
        rate_id: estimate.objectId,
        order: order._id,
        isBundle: false,
        shipping_fee: parseFloat(estimate.price),
        servicelevel: `${estimate.carrier} ${estimate.service}`,
        carrier: estimate.carrier,
        deliveryTime: estimate.deliveryTime,
        label_file_type: estimate.labelFileType,
        weight: parseFloat(weight),
        weight_unit: order?.giveaway?.shipping_profile?.scale || "oz",
        length: parseFloat(dimensions.length),
        width: parseFloat(dimensions.width),
        height: parseFloat(dimensions.height),
        estimate_data: {
          price: estimate.price,
          carrier: estimate.carrier,
          service: estimate.service,
          deliveryTime: estimate.deliveryTime,
          estimatedDays: estimate.estimatedDays,
          weight: parseFloat(weight),
          weight_unit: order?.giveaway?.shipping_profile?.scale || "oz",
          length: parseFloat(dimensions.length),
          width: parseFloat(dimensions.width),
          height: parseFloat(dimensions.height),
        }
      };

      const response = await apiRequest('POST', '/api/shipping/profiles/buy/label', requestData);
      return await response.json();
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        if (response.data.label_url) {
          window.open(response.data.label_url, '_blank');
        }

        queryClient.invalidateQueries({ queryKey: ['admin-giveaway-orders'] });
        queryClient.invalidateQueries({ predicate: (query) => 
          Array.isArray(query.queryKey) && query.queryKey[0] === 'admin-shipments'
        });

        toast({
          title: "Shipping label purchased!",
          description: `${response.data.carrier} ${response.data.service} - $${response.data.cost}\nTracking: ${response.data.tracking_number}`,
        });

        onOpenChange(false);
      } else {
        toast({
          title: "Label purchase failed",
          description: response.message || "Unable to purchase shipping label",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to purchase shipping label",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const handlePrintLabel = (estimate: ShippingEstimate) => {
    if (!estimate.objectId || estimate.objectId.trim() === '') {
      toast({
        title: "Cannot purchase label",
        description: "Invalid shipping rate. Please refresh estimates and try again.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedEstimate(estimate);
    setLabelDialogOpen(true);
  };

  const confirmLabelPurchase = () => {
    if (!selectedEstimate) return;
    purchaseLabelMutation.mutate({ ...selectedEstimate, labelFileType });
    setLabelDialogOpen(false);
  };

  if (!order) return null;

  const customerName = typeof order.customer === 'object'
    ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || order.customer.userName
    : 'Unknown';

  const giveawayTitle = order.giveaway?.title || order.giveaway?.name || 'Giveaway Item';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Package size={20} />
              Ship Order {order.invoice || order._id?.slice(-8)}
            </SheetTitle>
            <SheetDescription>
              Purchase a shipping label for this giveaway order
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6 pb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{customerName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Giveaway:</span>
                  <span className="font-medium truncate max-w-[200px]">{giveawayTitle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="secondary">{order.status}</Badge>
                </div>
                {order.tracking_number && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tracking:</span>
                    <span className="font-mono text-xs">{order.tracking_number}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Package Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Length (in)</Label>
                    <Input
                      type="number"
                      value={dimensions.length}
                      onChange={(e) => setDimensions(prev => ({ ...prev, length: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Width (in)</Label>
                    <Input
                      type="number"
                      value={dimensions.width}
                      onChange={(e) => setDimensions(prev => ({ ...prev, width: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Height (in)</Label>
                    <Input
                      type="number"
                      value={dimensions.height}
                      onChange={(e) => setDimensions(prev => ({ ...prev, height: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Weight (oz)</Label>
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck size={16} />
                    Shipping Options
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshEstimates}
                    disabled={shippingEstimatesQuery.isFetching}
                  >
                    <RefreshCw className={`h-4 w-4 ${shippingEstimatesQuery.isFetching ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {shippingEstimatesQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading rates...</span>
                  </div>
                ) : shippingEstimatesQuery.isError ? (
                  <div className="flex items-center gap-2 text-destructive py-4">
                    <AlertCircle className="h-5 w-5" />
                    <span>Failed to load shipping rates</span>
                  </div>
                ) : estimates.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No shipping options available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {estimates.map((estimate, index) => (
                      <div
                        key={estimate.objectId || index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-sm">
                            {estimate.carrier} {estimate.service}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {estimate.deliveryTime}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-green-600">
                            ${parseFloat(estimate.price).toFixed(2)}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handlePrintLabel(estimate)}
                            disabled={purchaseLabelMutation.isPending}
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            Buy
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Label Format</DialogTitle>
            <DialogDescription>
              Choose the file format for your shipping label
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={labelFileType} onValueChange={setLabelFileType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PDF" id="pdf" />
                <Label htmlFor="pdf">PDF (Recommended)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PNG" id="png" />
                <Label htmlFor="png">PNG Image</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ZPLII" id="zpl" />
                <Label htmlFor="zpl">ZPL (Thermal Printer)</Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLabelDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmLabelPurchase}
              disabled={purchaseLabelMutation.isPending}
            >
              {purchaseLabelMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Purchasing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-1" />
                  Purchase Label
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
