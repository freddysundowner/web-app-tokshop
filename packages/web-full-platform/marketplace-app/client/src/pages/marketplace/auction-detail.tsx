import { useState, useEffect, Suspense, lazy } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, Hammer, ChevronLeft, ChevronRight, User, Truck, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Lazy load custom bid dialog
const CustomBidDialog = lazy(() => import('@/components/custom-bid-dialog').then(m => ({ default: m.CustomBidDialog })));

export default function AuctionDetail() {
  const [, params] = useRoute("/auction/:auctionId");
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showCustomBidDialog, setShowCustomBidDialog] = useState(false);

  const auctionId = params?.auctionId;

  // Fetch auction details
  const { data: auction, isLoading, refetch } = useQuery<any>({
    queryKey: ['/api/products', auctionId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${auctionId}`);
      if (!response.ok) throw new Error('Failed to fetch auction');
      return response.json();
    },
    enabled: !!auctionId,
    refetchInterval: 5000, // Refetch every 5 seconds to get latest bids
  });

  // Calculate time remaining
  useEffect(() => {
    if (!auction || auction.ended) {
      setTimeLeft(0);
      return;
    }

    const duration = auction.duration || 0;
    const startedTime = auction.startedTime || auction.started_time;

    if (!duration || !startedTime) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const startMs = typeof startedTime === 'string' 
        ? new Date(startedTime).getTime() 
        : startedTime;
      
      if (isNaN(startMs)) {
        setTimeLeft(0);
        return;
      }
      
      const endTime = startMs + (duration * 1000);
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [auction]);

  // Format time
  const formatTime = (seconds: number) => {
    if (seconds === 0) return 'Auction Ended';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Calculate current bid
  const bids = auction?.bids || [];
  const highestBid = bids.reduce((max: number, bid: any) => 
    Math.max(max, Number(bid.amount) || 0), 0
  );
  const currentBid = Number(highestBid || auction?.newbaseprice || auction?.baseprice || 0);
  const minimumBid = auction?.newbaseprice || auction?.baseprice || 0;
  const bidIncrement = auction?.increaseBidBy || 5;
  const nextMinimumBid = currentBid + bidIncrement;

  // Check if current user is winning
  const isUserWinning = bids.length > 0 && bids[bids.length - 1]?.userId === currentUser?.id;
  const hasEnded = timeLeft === 0 || auction?.ended;

  // Place bid mutation
  const placeBidMutation = useMutation({
    mutationFn: async (bidAmount: number) => {
      if (!currentUser) {
        throw new Error('Please sign in to place a bid');
      }
      
      // This should use Socket.IO in a real implementation
      // For now, we'll use a REST API call
      const response = await apiRequest('POST', '/api/bids/place', {
        auctionId: auction._id,
        amount: bidAmount,
        userId: currentUser.id,
      });
      
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Bid placed!",
        description: "Your bid has been placed successfully.",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Bid failed",
        description: error.message || "Failed to place bid. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleQuickBid = () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to place a bid.",
        variant: "destructive",
      });
      return;
    }
    
    if (hasEnded) {
      toast({
        title: "Auction ended",
        description: "This auction has already ended.",
        variant: "destructive",
      });
      return;
    }

    placeBidMutation.mutate(nextMinimumBid);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto text-center py-12">
          <p className="text-muted-foreground">Auction not found</p>
          <Button onClick={() => setLocation('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const images = auction.images || auction.productImages || [];
  const ownerData = typeof auction.ownerId === 'object' ? auction.ownerId : null;
  const sellerId = auction.ownerId?._id || auction.ownerId;
  const sellerName = ownerData?.userName || ownerData?.firstName || 'Seller';
  const sellerAvatar = ownerData?.profilePhoto;
  const isEnding = timeLeft > 0 && timeLeft <= 300; // Last 5 minutes

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold truncate flex-1">{auction.name || 'Auction'}</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Images and Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Image Carousel */}
            <Card>
              <CardContent className="p-4">
                <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                  {images.length > 0 ? (
                    <>
                      <img
                        src={images[selectedImageIndex]}
                        alt={auction.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {images.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                            onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                            data-testid="button-prev-image"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                            onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                            data-testid="button-next-image"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Hammer className="h-24 w-24 text-muted-foreground/20" />
                    </div>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto">
                    {images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={cn(
                          "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors",
                          selectedImageIndex === idx ? "border-primary" : "border-border hover:border-primary/50"
                        )}
                        data-testid={`thumbnail-${idx}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>Item Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {auction.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{auction.description}</p>
                  </div>
                )}

                {auction.category && (
                  <div>
                    <h3 className="font-semibold mb-2">Category</h3>
                    <Badge variant="outline">{auction.category.name || auction.category}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bid History */}
            {bids.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Bid History ({bids.length} {bids.length === 1 ? 'bid' : 'bids'})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[...bids].reverse().slice(0, 10).map((bid: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={bid.user?.profilePhoto} />
                            <AvatarFallback>{(bid.user?.userName || bid.user?.firstName || 'U')[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{bid.user?.userName || bid.user?.firstName || 'Anonymous'}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${Number(bid.amount || 0).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(bid.createdAt || bid.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Bidding Panel */}
          <div className="space-y-6">
            {/* Auction Status Card */}
            <Card>
              <CardContent className="p-6 space-y-4">
                {/* Timer */}
                <div className={cn(
                  "p-4 rounded-lg border-2",
                  hasEnded ? "border-muted bg-muted/50" : isEnding ? "border-destructive bg-destructive/10 animate-pulse" : "border-primary bg-primary/10"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5" />
                    <span className="font-semibold">Time Remaining</span>
                  </div>
                  <p className={cn("text-2xl font-bold", hasEnded ? "text-muted-foreground" : isEnding ? "text-destructive" : "text-primary")}>
                    {formatTime(timeLeft)}
                  </p>
                </div>

                <Separator />

                {/* Current Bid */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Bid</p>
                  <p className="text-3xl font-bold text-primary" data-testid="current-bid">
                    ${currentBid.toFixed(2)}
                  </p>
                  {bids.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {bids.length} {bids.length === 1 ? 'bid' : 'bids'}
                    </p>
                  )}
                </div>

                {/* Winning Status */}
                {isUserWinning && !hasEnded && (
                  <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-primary">You're winning!</span>
                  </div>
                )}

                {/* Bidding Buttons */}
                {!hasEnded ? (
                  <div className="space-y-3">
                    <Button
                      onClick={handleQuickBid}
                      className="w-full"
                      size="lg"
                      disabled={placeBidMutation.isPending}
                      data-testid="button-quick-bid"
                    >
                      {placeBidMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Hammer className="h-5 w-5 mr-2" />
                          Place Bid - ${nextMinimumBid.toFixed(2)}
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setShowCustomBidDialog(true)}
                      className="w-full"
                      data-testid="button-custom-bid"
                    >
                      Enter Custom Bid
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Minimum next bid: ${nextMinimumBid.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="font-semibold mb-2">Auction Ended</p>
                    {bids.length > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Winning bid: ${currentBid.toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No bids placed</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seller Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Seller Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={sellerAvatar} />
                    <AvatarFallback>{sellerName[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{sellerName}</p>
                    <p className="text-sm text-muted-foreground">Seller</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation(`/profile/${sellerId}`)}
                  data-testid="button-view-seller"
                >
                  <User className="h-4 w-4 mr-2" />
                  View Seller Profile
                </Button>
              </CardContent>
            </Card>

            {/* Shipping Info */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <Truck className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm">
                      {auction.shippingInfo || 'Shipping costs calculated at checkout'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ships from: {ownerData?.state || 'United States'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Important Notice */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>By bidding, you agree to buy this item if you win.</p>
                    <p>All bids are binding and cannot be retracted.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Custom Bid Dialog */}
      {showCustomBidDialog && (
        <Suspense fallback={<div />}>
          <CustomBidDialog
            open={showCustomBidDialog}
            onOpenChange={setShowCustomBidDialog}
            productName={auction.name || 'Auction Item'}
            currentBid={currentBid}
            minimumBid={nextMinimumBid}
            onPlaceBid={(amount: number) => {
              placeBidMutation.mutate(amount);
              setShowCustomBidDialog(false);
            }}
            isPending={placeBidMutation.isPending}
            timeLeft={timeLeft}
          />
        </Suspense>
      )}
    </div>
  );
}
