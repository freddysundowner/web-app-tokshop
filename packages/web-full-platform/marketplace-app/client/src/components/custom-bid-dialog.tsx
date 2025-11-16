import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Loader2 } from 'lucide-react';

interface CustomBidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  currentBid: number;
  minimumBid: number;
  onPlaceBid: (amount: number, isMaxBid: boolean) => void;
  isPending?: boolean;
  timeLeft?: number;
}

export function CustomBidDialog({
  open,
  onOpenChange,
  productName,
  currentBid,
  minimumBid,
  onPlaceBid,
  isPending = false,
  timeLeft = 0
}: CustomBidDialogProps) {
  const [bidAmount, setBidAmount] = useState(minimumBid);
  const [isMaxBid, setIsMaxBid] = useState(false);

  // Reset bid amount when minimumBid changes (new auction)
  useEffect(() => {
    setBidAmount(minimumBid);
  }, [minimumBid]);

  // Reset bid amount when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setBidAmount(minimumBid);
      setIsMaxBid(false);
    }
    onOpenChange(newOpen);
  };

  const handleIncrement = () => {
    setBidAmount(prev => prev + 1);
  };

  const handleDecrement = () => {
    setBidAmount(prev => Math.max(minimumBid, prev - 1));
  };

  const handlePlaceBidClick = () => {
    onPlaceBid(bidAmount, isMaxBid);
    onOpenChange(false);
  };

  // Format time left
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-custom-bid">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{productName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Timer and Current Bid */}
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">${currentBid.toFixed(0)}</div>
            {timeLeft > 0 && (
              <div className="text-red-500 font-bold text-lg">
                {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {/* Bid Amount Controls */}
          <div className="flex items-center justify-between gap-4">
            <Button
              onClick={handleDecrement}
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full"
              data-testid="button-decrement-bid"
            >
              <Minus className="h-6 w-6" />
            </Button>

            <div className="text-4xl font-bold" data-testid="text-custom-bid-amount">
              ${bidAmount.toFixed(0)}
            </div>

            <Button
              onClick={handleIncrement}
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full"
              data-testid="button-increment-bid"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>

          {/* Max Bid Toggle */}
          <div className="space-y-2">
            <Label htmlFor="max-bid" className="text-base font-semibold">
              Max Bid
            </Label>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground flex-1">
                Turn this on if you would like us to do the bidding for you
              </p>
              <Switch
                id="max-bid"
                checked={isMaxBid}
                onCheckedChange={setIsMaxBid}
                data-testid="switch-max-bid"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1 h-11"
              data-testid="button-cancel-custom-bid"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePlaceBidClick}
              disabled={isPending || bidAmount < minimumBid}
              className="flex-1 h-11"
              data-testid="button-place-custom-bid"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                `Place Bid: $${bidAmount.toFixed(0)}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
