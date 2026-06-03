import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { TokshopOrder } from "@shared/schema";
import { fetchWithAuth } from '@/lib/queryClient';
import { useCurrency } from "@/lib/use-currency";

export default function ThankYou() {
  const [, params] = useRoute("/thank-you/:orderId");
  const [, setLocation] = useLocation();
  const { format } = useCurrency();
  const orderId = params?.orderId;

  // Fetch order details
  const { data: order, isLoading } = useQuery<TokshopOrder>({
    queryKey: ['/api/orders', orderId],
    queryFn: async () => {
      const response = await fetchWithAuth(`/api/orders/${orderId}`);
      if (!response.ok) throw new Error('Failed to fetch order');
      const json = await response.json();
      // API returns { success: true, data: order }
      return json.data || json;
    },
    enabled: !!orderId,
  });

  const handleViewOrder = () => {
    if (order) {
      // Store order to open in purchases page
      sessionStorage.setItem('openPurchaseOrder', JSON.stringify(order));
      setLocation('/purchases');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-pulse text-center">
          <div className="h-8 w-48 bg-muted rounded mx-auto mb-4"></div>
          <div className="h-4 w-64 bg-muted rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center py-3 sm:p-4">
      <Card className="max-w-2xl w-full border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader className="text-center pb-4 sm:pb-6 px-3 sm:px-6 pt-6 sm:pt-6">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 sm:p-4">
              <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">Thank You for Your Order!</CardTitle>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Your order has been successfully placed
          </p>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
          {order && (
            <>
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-3">
                <div className="flex justify-between items-center gap-3">
                  <span className="text-sm text-muted-foreground">Order Number</span>
                  <span className="font-mono font-semibold text-sm sm:text-base break-all text-right" data-testid="text-order-id">
                    #{order.invoice || order._id?.slice(-8).toUpperCase() || 'N/A'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center gap-3">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="font-semibold text-base sm:text-lg" data-testid="text-order-total">
                    {format((() => {
                      // Calculate total from items since order.total doesn't exist in API response
                      const itemsTotal = order.items?.reduce((sum: number, item: any) => {
                        return sum + ((item.price || 0) * (item.quantity || 1));
                      }, 0) || 0;
                      const shipping = order.shipping_fee || 0;
                      const tax = order.tax || 0;
                      const discount = order.discount || 0;
                      return itemsTotal + shipping + tax - discount;
                    })())}
                  </span>
                </div>
                {(order as any).wallet_used > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-sm text-muted-foreground">Wallet Credit Used</span>
                      <span className="text-sm font-medium" style={{ color: 'hsl(var(--primary))' }} data-testid="text-wallet-used">
                        -{format(Number((order as any).wallet_used))}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">What's Next?</p>
                    <p className="text-sm text-muted-foreground">
                      You'll receive an email confirmation shortly. The seller will process your order and update you with shipping details.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4 pb-2 sm:pb-0">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={() => setLocation('/')}
              data-testid="button-continue-shopping"
            >
              Continue Shopping
            </Button>
            <Button
              className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              onClick={handleViewOrder}
              data-testid="button-view-order"
            >
              View Order Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
