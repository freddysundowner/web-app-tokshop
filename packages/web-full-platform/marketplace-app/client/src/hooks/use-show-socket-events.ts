import { useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { sendRoomMessage } from '@/lib/firebase-chat';

interface UseShowSocketEventsProps {
  socket: any;
  roomId: string | undefined;
  isConnected: boolean;
  proceedWithJoin: boolean;
  isAuthenticated: boolean;
  user: any;
  currentUserId: string;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  setViewers: React.Dispatch<React.SetStateAction<any[]>>;
  setPinnedProduct: React.Dispatch<React.SetStateAction<any>>;
  setActiveAuction: React.Dispatch<React.SetStateAction<any>>;
  setActiveGiveaway: React.Dispatch<React.SetStateAction<any>>;
  setShippingEstimate: React.Dispatch<React.SetStateAction<any>>;
  setWinnerData: React.Dispatch<React.SetStateAction<any>>;
  setShowWinnerDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setGiveawayWinnerData: React.Dispatch<React.SetStateAction<any>>;
  setShowGiveawayWinnerDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setTimeAddedBlink: React.Dispatch<React.SetStateAction<boolean>>;
  findWinner: (bids: any[]) => any;
  startTimerWithEndTime: (auction: any) => void;
  getShippingEstimate: (auction: any) => void;
  refetchAuction: () => void;
  refetchGiveaways: () => void;
  shownWinnerAlertsRef: React.MutableRefObject<Set<string>>;
}

export function useShowSocketEvents({
  socket,
  roomId,
  isConnected,
  proceedWithJoin,
  isAuthenticated,
  user,
  currentUserId,
  joinRoom,
  leaveRoom,
  setViewers,
  setPinnedProduct,
  setActiveAuction,
  setActiveGiveaway,
  setShippingEstimate,
  setWinnerData,
  setShowWinnerDialog,
  setGiveawayWinnerData,
  setShowGiveawayWinnerDialog,
  setTimeAddedBlink,
  findWinner,
  startTimerWithEndTime,
  getShippingEstimate,
  refetchAuction,
  refetchGiveaways,
  shownWinnerAlertsRef,
}: UseShowSocketEventsProps) {
  const { toast } = useToast();
  const hasJoinedRef = useRef(false);
  const lastAuctionRefetchRef = useRef<number>(0);
  const lastGiveawayRefetchRef = useRef<number>(0);

  // Debounced refetch functions to prevent duplicate calls
  const debouncedRefetchAuction = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefetch = now - lastAuctionRefetchRef.current;
    
    // Only refetch if it's been more than 500ms since the last refetch
    if (timeSinceLastRefetch > 500) {
      lastAuctionRefetchRef.current = now;
      refetchAuction();
    }
  }, [refetchAuction]);

  const debouncedRefetchGiveaways = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefetch = now - lastGiveawayRefetchRef.current;
    
    // Only refetch if it's been more than 500ms since the last refetch
    if (timeSinceLastRefetch > 500) {
      lastGiveawayRefetchRef.current = now;
      refetchGiveaways();
    }
  }, [refetchGiveaways]);

  // Memoized handler: User connected
  const handleUserConnected = useCallback((data: any) => {
    console.log('👤 User connected:', data);
    setViewers(prev => {
      const filtered = prev.filter(v => (v._id || v.userId) !== data.userId);
      const updated = [...filtered, { _id: data.userId, userId: data.userId, userName: data.userName }];
      console.log('👥 Viewers updated:', { previous: prev.length, new: updated.length, viewers: updated });
      return updated;
    });
  }, [setViewers]);

  // Memoized handler: User disconnected
  const handleUserDisconnected = useCallback((data: any) => {
    console.log('User left:', data);
    setViewers(prev => prev.filter(v => (v._id || v.userId) !== data.userId));
  }, [setViewers]);

  // Memoized handler: Room started
  const handleRoomStarted = useCallback((roomData: any) => {
    console.log('Room started - full room data:', roomData);
    queryClient.invalidateQueries({ queryKey: ['/api/rooms', roomId, currentUserId] });
    toast({
      title: "Show Started!",
      description: "The live show has begun.",
      duration: 3000
    });
  }, [roomId, currentUserId, toast]);

  // Memoized handler: Room ended
  const handleRoomEnded = useCallback(() => {
    console.log('Room ended');
    queryClient.invalidateQueries({ queryKey: ['/api/rooms', roomId, currentUserId] });
    toast({
      title: "Show Ended",
      description: "Thanks for watching!",
      variant: "destructive"
    });
  }, [roomId, currentUserId, toast]);

  // Memoized handler: Product pinned
  const handleProductPinned = useCallback((roomData: any) => {
    console.log('Product pinned - full room data:', roomData);
    queryClient.invalidateQueries({ queryKey: ['/api/rooms', roomId, currentUserId] });
    
    if (roomData.pinned || roomData.pinnedProduct) {
      const pinnedProd = roomData.pinned || roomData.pinnedProduct;
      setPinnedProduct(pinnedProd);
      
      if (pinnedProd.shipping_profile) {
        const pinnedPayload = {
          weight: pinnedProd.shipping_profile.weight,
          unit: pinnedProd.shipping_profile.scale,
          product: pinnedProd._id || pinnedProd.id,
          update: true,
          owner: roomData?.owner?._id || roomData?.owner?.id,
          customer: currentUserId,
          tokshow: roomId,
          buying_label: false
        };
        
        console.log('📦 Fetching shipping estimate for pinned product:', pinnedPayload);
        
        fetch('/api/shipping/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pinnedPayload)
        })
          .then(res => res.json())
          .then(data => {
            console.log('✅ Pinned product shipping estimate received:', data);
            setShippingEstimate({
              amount: data.amount,
              currency: data.currency,
              rate_id: data.objectId,
              bundleId: data.bundleId,
            });
          })
          .catch(err => console.error('❌ Error fetching pinned product shipping:', err));
      }
    } else {
      setPinnedProduct(null);
    }
  }, [roomId, currentUserId, setPinnedProduct, setShippingEstimate]);

  // Memoized handler: Pinned product updated
  const handlePinnedProductUpdated = useCallback((data: any) => {
    console.log('Pinned product updated:', data);
    if (data !== null && data !== undefined) {
      if (data.quantity !== null && data.quantity !== undefined) {
        setPinnedProduct((prev: any) => prev ? { ...prev, quantity: data.quantity } : null);
      } else {
        setPinnedProduct(null);
      }
    } else {
      setPinnedProduct(null);
    }
  }, [setPinnedProduct]);

  // Memoized handler: Auction started
  const handleAuctionStarted = useCallback((auctionData: any) => {
    console.log('🎉 AUCTION-STARTED EVENT RECEIVED:', auctionData);
    
    if (auctionData.serverTime) {
      auctionData.serverOffset = auctionData.serverTime - Date.now();
      console.log('🔄 Calculated serverOffset:', auctionData.serverOffset, 'from serverTime:', auctionData.serverTime);
    }
    
    console.log('⏰ Auction timing:', {
      endTime: auctionData.endTime,
      serverTime: auctionData.serverTime,
      serverOffset: auctionData.serverOffset,
      currentTime: Date.now(),
      timeLeft: auctionData.endTime ? Math.floor((auctionData.endTime - Date.now()) / 1000) : 0
    });
    
    setActiveAuction(auctionData);
    setPinnedProduct(null);
    
    findWinner(auctionData.bids || []);
    startTimerWithEndTime(auctionData);
    getShippingEstimate(auctionData);
  }, [setActiveAuction, setPinnedProduct, findWinner, startTimerWithEndTime, getShippingEstimate]);

  // Memoized handler: Auction pinned
  const handleAuctionPinned = useCallback((auction: any) => {
    console.log('Auction pinned:', auction);
    setActiveAuction(auction);
    setPinnedProduct(null);
  }, [setActiveAuction, setPinnedProduct]);

  // Memoized handler: Bid updated
  const handleBidUpdated = useCallback((auction: any) => {
    console.log('🔍 BID-UPDATED RECEIVED:');
    console.log('  Full auction object:', auction);
    console.log('  Has endTime?:', auction.endTime);
    console.log('  Bids count:', auction.bids?.length);
    console.log('  newbaseprice:', auction.newbaseprice);
    
    setActiveAuction((prev: any) => {
      if (!prev) {
        console.log('  ⚠️ No previous auction, keeping prev');
        return prev;
      }
      
      console.log('  Previous endTime:', prev.endTime);
      console.log('  Previous serverOffset:', prev.serverOffset);
      
      const updated = {
        ...prev,
        bids: auction.bids || prev.bids,
        higestbid: auction.higestbid !== undefined ? auction.higestbid : prev.higestbid,
        newbaseprice: auction.newbaseprice !== undefined ? auction.newbaseprice : prev.newbaseprice,
      };
      
      console.log('  Updated auction endTime:', updated.endTime);
      console.log('  Updated auction serverOffset:', updated.serverOffset);
      
      return updated;
    });
    
    findWinner(auction.bids || []);
  }, [setActiveAuction, findWinner]);

  // Memoized handler: Auction time extended
  const handleAuctionTimeExtended = useCallback((data: any) => {
    console.log('Auction time extended:', data);
    
    const newEndTimeMs = data.newEndTime;
    const serverTime = data.serverTime;
    
    setActiveAuction((prev: any) => {
      if (!prev) return prev;
      
      const updated = {
        ...prev,
        endTime: newEndTimeMs,
      };
      
      if (serverTime) {
        updated.serverTime = serverTime;
        updated.serverOffset = serverTime - Date.now();
      }
      
      startTimerWithEndTime(updated);
      
      return updated;
    });
    
    setTimeAddedBlink(true);
    setTimeout(() => {
      setTimeAddedBlink(false);
    }, 1000);
  }, [setActiveAuction, setTimeAddedBlink, startTimerWithEndTime]);

  // Memoized handler: Auction ended
  const handleAuctionEnded = useCallback((auction: any) => {
    if (!auction) {
      return;
    }
    
    // Mark the auction as ended and preserve ALL bid data
    const endedAuction = {
      ...auction,
      ended: true
    };
    
    setActiveAuction(endedAuction);
    
    const winner = findWinner(auction.bids || []);
    
    // Only show winner alert if we haven't already shown it (prevents duplicate from timer expiration)
    const auctionId = auction._id;
    if (winner && auctionId && !shownWinnerAlertsRef.current.has(auctionId)) {
      shownWinnerAlertsRef.current.add(auctionId);
      
      const winnerName = winner.user?.userName || winner.bidder?.userName || 'Someone';
      const winAmount = winner.amount || auction.higestbid || auction.newbaseprice;
      
      setWinnerData({
        name: winnerName,
        amount: winAmount,
        profileImage: winner.user?.profileUrl || winner.user?.profilePicture || winner.user?.photoURL,
        user: winner.user
      });
      setShowWinnerDialog(true);
      
      setTimeout(() => {
        setShowWinnerDialog(false);
      }, 5000);
    }
    
    // Refetch the auction products list to update the tab
    // This won't affect activeAuction state because we have validation in the initialization effect
    debouncedRefetchAuction();
  }, [setActiveAuction, findWinner, setWinnerData, setShowWinnerDialog, debouncedRefetchAuction, shownWinnerAlertsRef]);

  // Memoized handler: Giveaway started
  const handleGiveawayStarted = useCallback((giveaway: any) => {
    console.log('Giveaway started:', giveaway);
    setActiveGiveaway(giveaway);
    toast({
      title: "Giveaway Started!",
      description: giveaway.name || "New giveaway"
    });
  }, [setActiveGiveaway, toast]);

  // Memoized handler: Giveaway joined
  const handleGiveawayJoined = useCallback((giveaway: any) => {
    console.log('Giveaway joined:', giveaway);
    setActiveGiveaway(giveaway);
  }, [setActiveGiveaway]);

  // Memoized handler: Giveaway ended
  const handleGiveawayEnded = useCallback((giveaway: any) => {
    console.log('Giveaway ended:', giveaway);
    
    if (giveaway.winner) {
      const winnerName = giveaway.winner.userName || giveaway.winner.firstName || 'Someone';
      const winnerProfile = giveaway.winner.profilePhoto || giveaway.winner.profileUrl || giveaway.winner.profilePicture;
      
      console.log('🎁 Showing giveaway winner overlay:', { winnerName, winnerProfile, winner: giveaway.winner });
      
      setGiveawayWinnerData({
        name: winnerName,
        profileImage: winnerProfile,
        giveawayName: giveaway.name || 'Giveaway'
      });
      setShowGiveawayWinnerDialog(true);
      
      setTimeout(() => {
        setShowGiveawayWinnerDialog(false);
        setActiveGiveaway(null);
      }, 10000);
    } else {
      setActiveGiveaway(null);
    }
    
    debouncedRefetchGiveaways();
  }, [setActiveGiveaway, setGiveawayWinnerData, setShowGiveawayWinnerDialog, debouncedRefetchGiveaways]);

  // Main effect: Register all socket event listeners
  useEffect(() => {
    if (!socket || !roomId || !isConnected || !proceedWithJoin) return;

    // Join room
    joinRoom(roomId);
    
    console.log('✅ Socket event listeners registered for room:', roomId);

    // Send join message (only for authenticated users and only once)
    if (isAuthenticated && user && !hasJoinedRef.current && currentUserId) {
      hasJoinedRef.current = true;
      const userName = (user as any).userName || user.firstName || 'Guest';
      const userPhoto = (user as any).profilePhoto || '';
      
      sendRoomMessage(
        roomId,
        'joined 👋',
        currentUserId,
        userName,
        userPhoto
      );
    }

    // Register all event listeners
    socket.on('user-connected', handleUserConnected);
    socket.on('left-room', handleUserDisconnected);
    socket.on('room-started', handleRoomStarted);
    socket.on('room-ended', handleRoomEnded);
    socket.on('product-pinned', handleProductPinned);
    socket.on('updated-pinned-product', handlePinnedProductUpdated);
    socket.on('auction-started', handleAuctionStarted);
    socket.on('auction-pinned', handleAuctionPinned);
    socket.on('bid-updated', handleBidUpdated);
    socket.on('auction-time-extended', handleAuctionTimeExtended);
    socket.on('auction-ended', handleAuctionEnded);
    socket.on('started-giveaway', handleGiveawayStarted);
    socket.on('joined-giveaway', handleGiveawayJoined);
    socket.on('ended-giveaway', handleGiveawayEnded);

    // Cleanup function
    return () => {
      socket.off('user-connected', handleUserConnected);
      socket.off('left-room', handleUserDisconnected);
      socket.off('room-started', handleRoomStarted);
      socket.off('room-ended', handleRoomEnded);
      socket.off('product-pinned', handleProductPinned);
      socket.off('updated-pinned-product', handlePinnedProductUpdated);
      socket.off('auction-started', handleAuctionStarted);
      socket.off('auction-pinned', handleAuctionPinned);
      socket.off('bid-updated', handleBidUpdated);
      socket.off('auction-time-extended', handleAuctionTimeExtended);
      socket.off('auction-ended', handleAuctionEnded);
      socket.off('started-giveaway', handleGiveawayStarted);
      socket.off('joined-giveaway', handleGiveawayJoined);
      socket.off('ended-giveaway', handleGiveawayEnded);
      socket.off('createMessage');
      
      // Leave room on unmount
      leaveRoom(roomId);
    };
  }, [
    socket,
    roomId,
    isConnected,
    proceedWithJoin,
    isAuthenticated,
    user,
    currentUserId,
    joinRoom,
    leaveRoom,
    handleUserConnected,
    handleUserDisconnected,
    handleRoomStarted,
    handleRoomEnded,
    handleProductPinned,
    handlePinnedProductUpdated,
    handleAuctionStarted,
    handleAuctionPinned,
    handleBidUpdated,
    handleAuctionTimeExtended,
    handleAuctionEnded,
    handleGiveawayStarted,
    handleGiveawayJoined,
    handleGiveawayEnded,
  ]);
}
