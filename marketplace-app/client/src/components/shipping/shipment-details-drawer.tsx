import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, MapPin, Download, Loader2 } from "lucide-react";
import type { TokshopOrder } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface ShipmentDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: TokshopOrder | null;
}

export function ShipmentDetailsDrawer({ open, onOpenChange, order }: ShipmentDetailsDrawerProps) {
  // Fetch full order details when drawer opens
  const { data: fullOrderData, isLoading: orderLoading } = useQuery({
    queryKey: ['/api/orders', order?._id],
    queryFn: async () => {
      if (!order?._id) return null;
      const response = await fetch(`/api/orders/${order._id}`);
      if (!response.ok) throw new Error('Failed to fetch order details');
      const data = await response.json();
      return data.data || data;
    },
    enabled: open && !!order?._id,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Merge full order data with passed order (full data takes precedence)
  const orderData = fullOrderData || order;
  
  if (!order) return null;

  const trackingNumber = orderData?.tracking_number || (orderData as any)?.tracking_url?.split('=')[1];
  const labelUrl = orderData?.label || (orderData as any)?.shipping_label_url;
  const carrier = (orderData as any)?.carrier || 'USPS';
  const service = orderData?.servicelevel || (orderData as any)?.service || '-';
  const shippingCost = orderData?.shipping_fee || (orderData as any)?.total_shipping_cost || 0;
  const sellerCost = (orderData as any)?.seller_shipping_fee_pay || 0;

  // Get package details from full order data
  const weight = (orderData as any)?.weight?.toString() || '0';
  const scale = (orderData as any)?.scale || 'oz';
  const length = (orderData as any)?.length;
  const width = (orderData as any)?.width;
  const height = (orderData as any)?.height;

  // Get shipping address
  const address = orderData?.customer?.address;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipment Details
          </SheetTitle>
        </SheetHeader>

        {orderLoading ? (
          <div className="mt-6 flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
        <div className="mt-6 space-y-6">
          {/* Order Information - At the top */}
          <div className="space-y-3">
            <h3 className="font-medium">Order Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Order ID</p>
                <p className="font-mono">#{orderData?.invoice || orderData?._id?.slice(-8)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant="outline">{orderData?.status?.replace(/_/g, ' ')}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Order Items</h3>
            <div className="space-y-1">
              {orderData?.giveaway && orderData.giveaway._id && (
                <div className="flex items-center gap-2 py-2 px-2 bg-muted/50 rounded text-xs">
                  {orderData.giveaway.images && orderData.giveaway.images[0] ? (
                    <img 
                      src={orderData.giveaway.images[0]} 
                      alt={orderData.giveaway.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{orderData.giveaway.name} #{orderData.invoice || orderData._id.slice(-8)}</p>
                    <p className="text-muted-foreground">Giveaway · Qty: {orderData.giveaway.quantity || 1}</p>
                  </div>
                  <p className="font-medium">$0.00</p>
                </div>
              )}
              {orderData?.items && orderData.items.length > 0 && orderData.items.map((item: any, idx) => (
                <div key={item._id || idx} className="flex items-center gap-2 py-2 px-2 bg-muted/50 rounded text-xs">
                  {item.images && item.images[0] ? (
                    <img 
                      src={item.images[0]} 
                      alt={item.productId?.name || item.name || 'Item'}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {item.productId?.name || item.name || 'Unknown Item'}
                      {item.order_reference && ` ${item.order_reference}`}
                    </p>
                    <p className="text-muted-foreground">Qty: {item.quantity || 1}</p>
                  </div>
                  <p className="font-medium">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                </div>
              ))}
              {!orderData?.giveaway?._id && (!orderData?.items || orderData.items.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-1">No items</p>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Order date</span>
              <span className="font-medium">{orderData?.date ? new Date(orderData.date).toLocaleDateString() : orderData?.createdAt ? new Date(orderData.createdAt).toLocaleDateString() : '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Buyer</span>
              <span className="font-medium">{orderData?.customer?.userName || `${orderData?.customer?.firstName || ''} ${orderData?.customer?.lastName || ''}`.trim() || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Seller paid shipping</span>
              <span className="font-medium">${(sellerCost || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Service level</span>
              <span className="font-medium">{service || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Package weight</span>
              <span className="font-medium">{weight} {scale}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Package dimensions</span>
              <span className="font-medium">{length && width && height ? `${length} x ${width} x ${height} in` : '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Carrier</span>
              <Badge variant="secondary">{carrier}</Badge>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Buyer Paid</span>
              <span className="font-medium">${shippingCost.toFixed(2)}</span>
            </div>
          </div>

          {/* Shipping Actions */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Shipping Actions</h3>
            
            {/* Ship to */}
            {address && (
              <div className="flex gap-4">
                <span className="text-muted-foreground w-20 shrink-0">Ship to</span>
                <div className="text-sm">
                  <p className="font-medium">{(address as any).firstName || (address as any).name?.split(' ')[0] || ''} {(address as any).lastName || (address as any).name?.split(' ').slice(1).join(' ') || ''}</p>
                  <p>{(address as any).addrress1}</p>
                  {(address as any).addrress2 && <p>{(address as any).addrress2}</p>}
                  <p>{address.city} {address.state} {address.zipcode}</p>
                  <p>{(address as any).country || 'US'}</p>
                </div>
              </div>
            )}
            
            {/* Tracking */}
            {trackingNumber && (
              <div className="flex gap-4">
                <span className="text-muted-foreground w-20 shrink-0">Tracking #</span>
                <div className="text-sm">
                  {(orderData as any)?.tracking_url ? (
                    <a 
                      href={(orderData as any).tracking_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {trackingNumber}
                    </a>
                  ) : (
                    <span className="font-mono">{trackingNumber}</span>
                  )}
                  <p className="text-muted-foreground">{carrier} {service}</p>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {labelUrl && (
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => window.open(labelUrl, '_blank')}
                  data-testid="button-print-label"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Print Shipping Label
                </Button>
              )}
              <Button
                variant="default"
                className="w-full"
                onClick={() => {
                  // Open packing slip - could be a separate URL or generate one
                  const packingSlipUrl = (orderData as any)?.packing_slip_url || labelUrl;
                  if (packingSlipUrl) window.open(packingSlipUrl, '_blank');
                }}
                data-testid="button-print-packing-slip"
              >
                Print Packing Slip
              </Button>
              {orderData?.status === "ready_to_ship" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // This would trigger mark as shipped action
                    onOpenChange(false);
                  }}
                  data-testid="button-mark-shipped"
                >
                  Mark Package as Shipped
                </Button>
              )}
            </div>
          </div>


        </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
