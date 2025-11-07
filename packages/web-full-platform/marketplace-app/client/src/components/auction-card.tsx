import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Clock, Hammer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AuctionCardProps {
  auction: any;
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  
  const productId = auction._id || auction.id;
  const images = auction.images || auction.productImages || [];
  const firstImage = images[0] || '/placeholder-product.png';
  const name = auction.name || 'Untitled Auction';
  const condition = auction.condition || 'New';
  const bidsCount = auction.bids?.length || 0;
  const duration = auction.duration || 0; // Duration in seconds
  const startedTime = auction.startedTime || auction.started_time;
  const ended = auction.ended || false;
  
  // Calculate current bid (highest bid or starting price)
  const highestBid = auction.bids?.reduce((max: number, bid: any) => 
    Math.max(max, Number(bid.amount) || 0), 0
  ) || 0;
  const currentBid = Number(highestBid || auction.newbaseprice || auction.baseprice || auction.startingPrice || 0);

  // Calculate time left
  useEffect(() => {
    if (!duration || ended || !startedTime) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      // Parse startedTime to milliseconds (handles both string and number)
      const startMs = typeof startedTime === 'string' 
        ? new Date(startedTime).getTime() 
        : startedTime;
      
      // Guard against invalid dates
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
  }, [duration, startedTime, ended]);

  // Format time left
  const formatTime = (seconds: number) => {
    if (seconds === 0) return 'Ended';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const isEnding = timeLeft > 0 && timeLeft <= 60;
  const hasEnded = timeLeft === 0 || ended;

  return (
    <Link href={`/auction/${productId}`} data-testid={`link-auction-${productId}`}>
      <Card 
        className="hover-elevate active-elevate-2 cursor-pointer overflow-hidden flex-shrink-0 w-52 sm:w-60"
      >
        <div className="relative aspect-square bg-muted">
          <img
            src={firstImage}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          {hasEnded && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="destructive">Ended</Badge>
            </div>
          )}
          {!hasEnded && (
            <div className="absolute top-2 right-2">
              <Badge 
                variant={isEnding ? "destructive" : "default"} 
                className={cn("flex items-center gap-1", isEnding && "animate-pulse")}
              >
                <Clock className="h-3 w-3" />
                {formatTime(timeLeft)}
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold line-clamp-2 flex-1">{name}</h3>
          </div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-lg font-bold text-primary">${currentBid.toFixed(0)}</p>
            <Badge variant="secondary" className="text-xs">{condition}</Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Hammer className="h-3 w-3" />
            <span>{bidsCount} {bidsCount === 1 ? 'bid' : 'bids'}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
