import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ShowHeaderProps {
  show?: any;
}

// Independent component - can be commented out without affecting the page
export function ShowHeader({ show }: ShowHeaderProps) {
  if (!show) return null;

  const shippingOptions = show?.shippingoptions || {};
  const hasFreePickup = shippingOptions.free_in_person_pickup || shippingOptions.freeInPersonPickup;
  const hasBuyerCap = shippingOptions.reduced_shipping_rate || shippingOptions.reducedShippingRate;
  const hasExplicitContent = show?.explicit_content || false;

  return (
    <>
      {/* Show Ended Alert */}
      {show?.ended && (
        <Alert className="rounded-none border-x-0 border-t-0 border-b border-zinc-800 bg-red-900/20 border-red-800/30 flex-shrink-0">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-sm text-red-200">
            This show has already ended
          </AlertDescription>
        </Alert>
      )}

      {/* Shipping/Explicit Content Warnings */}
      {(hasFreePickup || hasBuyerCap || hasExplicitContent) && (
        <Alert className="rounded-none border-x-0 border-t-0 border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-4 text-xs flex-wrap">
            {hasFreePickup && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Free Local Pickup Available
              </span>
            )}
            {hasBuyerCap && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Shipping capped at ${shippingOptions.reducedShippingCapAmount || shippingOptions.reduced_shipping_cap_amount}
              </span>
            )}
            {hasExplicitContent && (
              <span className="flex items-center gap-1 text-orange-400">
                <AlertTriangle className="h-3 w-3" />
                May contain explicit content
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
