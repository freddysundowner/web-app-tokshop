import { X, MoreVertical, Plus, Clock, Gift, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ProductsSidebar(props: any) {
  const {
    showMobileProducts, setShowMobileProducts, showTitle, productTab, setProductTab,
    auctionProducts, pinnedProduct, activeAuction, currentUserId, isShowOwner,
    handleProductAction, setBuyNowProduct, setShowBuyNowDialog, setPrebidAuction,
    setShowPrebidDialog, handleAddProduct, buyNowProducts, giveawayProducts,
    soldProducts, activeGiveaway, setSelectedProduct, giveaways, giveawayTimeLeft,
    soldOrders, setSelectedOrder, setShowOrderDetailDialog, shippingEstimate, id
  } = props;

  // Check if auction is actually running based on time
  const isAuctionRunning = activeAuction && activeAuction.endTime && Date.now() < activeAuction.endTime;

  return (
        <div className={`
          ${showMobileProducts ? 'fixed inset-0 z-50 bg-black' : 'hidden'}
          lg:flex lg:flex-col lg:relative lg:w-96 lg:z-auto
          bg-black border-r border-zinc-800 flex flex-col
        `} style={{ height: '90vh' }}>
          {/* Mobile Close Button */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h2 className="text-white font-semibold">Products</h2>
            <button onClick={() => setShowMobileProducts(false)} data-testid="button-close-products">
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Show Title - Desktop Only */}
          <div className="hidden lg:block px-4 py-3 border-b border-zinc-800">
            <h2 className="text-white font-semibold text-base" data-testid="text-show-title-left">
              {showTitle}
            </h2>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-zinc-800 text-xs">
            <button 
              className={`flex-1 px-2 py-2.5 ${productTab === 'Auction' ? 'border-b-2 border-primary text-white' : 'text-zinc-400'}`}
              onClick={() => setProductTab('Auction')}
              data-testid="tab-auction"
            >
              Auction
            </button>
            <button 
              className={`flex-1 px-2 py-2.5 ${productTab === 'Buy Now' ? 'border-b-2 border-primary text-white' : 'text-zinc-400'}`}
              onClick={() => setProductTab('Buy Now')}
              data-testid="tab-buy-now"
            >
              Buy Now
            </button>
            <button 
              className={`flex-1 px-2 py-2.5 ${productTab === 'Giveaways' ? 'border-b-2 border-primary text-white' : 'text-zinc-400'}`}
              onClick={() => setProductTab('Giveaways')}
              data-testid="tab-giveaways"
            >
              Giveaways
            </button>
            <button 
              className={`flex-1 px-2 py-2.5 ${productTab === 'Sold' ? 'border-b-2 border-primary text-white' : 'text-zinc-400'}`}
              onClick={() => setProductTab('Sold')}
              data-testid="tab-sold"
            >
              Sold
            </button>
          </div>

          {/* Tab Content - Fixed Height */}
          <div className="flex-1 relative min-h-0 overflow-hidden">
            {productTab === 'Auction' && (
              <>
                <div className="h-full overflow-y-auto pb-20">
                {/* Show pinned product first if it's an auction */}
                {pinnedProduct && pinnedProduct.listing_type === 'auction' && (
                  <div className="px-4 py-4 border-b border-zinc-700 bg-zinc-900/50 relative" data-testid="product-pinned-auction">
                    <div className="flex justify-between gap-4">
                      <div className="flex-1">
                        <Badge className="mb-2 bg-primary text-primary-foreground text-xs">Pinned</Badge>
                        <h3 className="text-lg font-bold text-white mb-2 leading-tight">{pinnedProduct.name}</h3>
                        <p className="text-sm text-zinc-400 mb-1">{pinnedProduct.auction?.bids?.length || 0} bids</p>
                        <p className="text-sm text-zinc-400 mb-2">{pinnedProduct.quantity || 1} Available</p>
                        {!isShowOwner && (
                          <Button
                            size="sm"
                            className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                            onClick={async () => {
                              console.log('📦 Fetching prebid shipping for:', pinnedProduct.name);
                              
                              // Open dialog immediately with loading state
                              setPrebidAuction({
                                ...pinnedProduct,
                                prebidShippingCost: undefined // undefined means loading
                              });
                              setShowPrebidDialog(true);
                              
                              const payload = {
                                weight: pinnedProduct.shipping_profile?.weight,
                                unit: pinnedProduct.shipping_profile?.scale,
                                product: pinnedProduct._id || pinnedProduct.id,
                                update: false,
                                owner: pinnedProduct.ownerId?._id || pinnedProduct.ownerId || pinnedProduct.owner?._id || pinnedProduct.owner,
                                customer: currentUserId,
                                tokshow: id,
                                buying_label: false
                              };
                              
                              fetch('/api/shipping/estimate', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload),
                                credentials: 'include'
                              })
                                .then(res => res.json())
                                .then(data => {
                                  console.log('✅ Shipping estimate received:', data);
                                  if (data.amount) {
                                    setPrebidAuction({
                                      ...pinnedProduct,
                                      prebidShippingCost: parseFloat(data.amount)
                                    });
                                  } else {
                                    setPrebidAuction({
                                      ...pinnedProduct,
                                      prebidShippingCost: null // null means no shipping cost available
                                    });
                                  }
                                })
                                .catch(error => {
                                  console.error('❌ Shipping estimate error:', error);
                                  setPrebidAuction({
                                    ...pinnedProduct,
                                    prebidShippingCost: null
                                  });
                                });
                            }}
                            data-testid="button-prebid-pinned"
                          >
                            Prebid
                          </Button>
                        )}
                      </div>
                      <div className="w-20 h-20 flex-shrink-0 relative">
                        <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden">
                          {pinnedProduct.images?.[0] && (
                            <img src={pinnedProduct.images[0]} alt={pinnedProduct.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        {isShowOwner && (
                          <Button 
                            size="icon"
                            className="absolute top-1 right-1 h-7 w-7 bg-black/70 hover:bg-black/90 text-white rounded-full" 
                            onClick={() => handleProductAction(pinnedProduct)}
                            data-testid="button-product-action-pinned-auction"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {auctionProducts
                  .filter((product: any) => product._id !== pinnedProduct?._id)
                  .map((product: any, index: number) => {
                  const isActiveAuction = activeAuction?.product?._id === product._id;
                  // Check if user already has a bid on this auction and get their bid
                  const userBid = product.auction?.bids?.find((bid: any) => 
                    bid.user?._id === currentUserId || 
                    bid.user?.id === currentUserId ||
                    bid.bidder?._id === currentUserId || 
                    bid.bidder?.id === currentUserId
                  );
                  const userHasBid = !!userBid;
                  const userBidAmount = userBid?.autobidamount || userBid?.amount;
                  
                  return (
                    <div key={product._id || product.id || index} className="px-4 py-4 border-b border-zinc-700 relative" data-testid={`product-auction-${product._id || index}`}>
                      <div className="flex justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-2 leading-tight">{product.name}</h3>
                          <p className="text-sm text-zinc-400 mb-1">{product.auction?.bids?.length || 0} bids</p>
                          <p className="text-sm text-zinc-400 mb-2">{product.quantity || 1} Available</p>
                          {!isShowOwner && !isActiveAuction && userHasBid && (
                            <p className="text-sm text-primary font-semibold mt-2" data-testid={`text-my-bid-${product._id || index}`}>
                              Your Bid: ${userBidAmount?.toFixed(2) || '0.00'}
                            </p>
                          )}
                          {!isShowOwner && !isActiveAuction && !userHasBid && (
                            <Button
                              size="sm"
                              className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                              onClick={() => {
                                console.log('📦 Fetching prebid shipping for:', product.name);
                                
                                // Open dialog immediately with loading state
                                setPrebidAuction({
                                  ...product,
                                  prebidShippingCost: undefined // undefined means loading
                                });
                                setShowPrebidDialog(true);
                                
                                const payload = {
                                  weight: product.shipping_profile?.weight,
                                  unit: product.shipping_profile?.scale,
                                  product: product._id || product.id,
                                  update: false,
                                  owner: product.ownerId?._id || product.ownerId || product.owner?._id || product.owner,
                                  customer: currentUserId,
                                  tokshow: id,
                                  buying_label: false
                                };
                                
                                fetch('/api/shipping/estimate', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(payload),
                                  credentials: 'include'
                                })
                                  .then(res => res.json())
                                  .then(data => {
                                    console.log('✅ Shipping estimate received:', data);
                                    if (data.amount) {
                                      setPrebidAuction({
                                        ...product,
                                        prebidShippingCost: parseFloat(data.amount)
                                      });
                                    } else {
                                      setPrebidAuction({
                                        ...product,
                                        prebidShippingCost: null // null means no shipping cost available
                                      });
                                    }
                                  })
                                  .catch(error => {
                                    console.error('❌ Shipping estimate error:', error);
                                    setPrebidAuction({
                                      ...product,
                                      prebidShippingCost: null
                                    });
                                  });
                              }}
                              data-testid={`button-prebid-${product._id || index}`}
                            >
                              Prebid
                            </Button>
                          )}
                        </div>
                        <div className="w-20 h-20 flex-shrink-0 relative">
                          <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden">
                            {product.images?.[0] && (
                              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          {isShowOwner && !isAuctionRunning && (
                            <Button 
                              size="icon"
                              className="absolute top-1 right-1 h-7 w-7 bg-black/70 hover:bg-black/90 text-white rounded-full" 
                              onClick={() => handleProductAction(product)}
                              data-testid={`button-product-action-${product._id || index}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!activeAuction && auctionProducts.length === 0 && (
                  <div className="p-4 text-center text-zinc-500 text-sm">
                    No auction items
                  </div>
                )}
                </div>
                {isShowOwner && (
                  <Button
                    size="icon"
                    className="absolute bottom-4 right-4 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg z-50"
                    onClick={() => handleAddProduct('auction')}
                    data-testid="button-add-auction"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                )}
              </>
            )}
            
            {productTab === 'Buy Now' && (
              <>
                <div className="h-full overflow-y-auto pb-20">
                {/* Only show pinned product if it's NOT an auction */}
                {pinnedProduct && pinnedProduct.listing_type !== 'auction' && (
                  <div className="px-4 py-4 border-b border-zinc-700 bg-zinc-900/50 relative" data-testid="product-pinned">
                    <div className="flex justify-between gap-4">
                      <div className="flex-1">
                        <Badge className="mb-2 bg-primary text-primary-foreground text-xs">Pinned</Badge>
                        <h3 className="text-lg font-bold text-white mb-2 leading-tight">{pinnedProduct.name}</h3>
                        <p className="text-sm text-zinc-400 mb-1">{pinnedProduct.quantity || 0} Available</p>
                        <p className="text-sm text-zinc-400 mb-2">Price: ${(pinnedProduct.price || 0).toFixed(2)}</p>
                        {!isShowOwner && !shippingEstimate?.error && (
                          <Button
                            size="sm"
                            className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                            onClick={() => {
                              setBuyNowProduct(pinnedProduct);
                              setShowBuyNowDialog(true);
                            }}
                            data-testid="button-buy-now-pinned"
                          >
                            Buy Now
                          </Button>
                        )}
                      </div>
                      <div className="w-20 h-20 flex-shrink-0 relative">
                        <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden">
                          {pinnedProduct.images?.[0] && (
                            <img src={pinnedProduct.images[0]} alt={pinnedProduct.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        {isShowOwner && (
                          <Button 
                            size="icon"
                            className="absolute top-1 right-1 h-7 w-7 bg-black/70 hover:bg-black/90 text-white rounded-full" 
                            onClick={() => handleProductAction(pinnedProduct)}
                            data-testid="button-product-action-pinned"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {buyNowProducts
                  .filter((product: any) => product._id !== pinnedProduct?._id)
                  .map((product: any, index: number) => (
                  <div key={product._id || product.id || index} className="px-4 py-4 border-b border-zinc-700 relative" data-testid={`product-buynow-${product._id || index}`}>
                    <div className="flex justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2 leading-tight">{product.name}</h3>
                        <p className="text-sm text-zinc-400 mb-1">{product.quantity || 1} Available</p>
                        <p className="text-base font-semibold text-white mb-2">Price: ${(product.price || 0).toFixed(2)}</p>
                        {!isShowOwner && !shippingEstimate?.error && (
                          <Button
                            size="sm"
                            className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                            onClick={() => {
                              setBuyNowProduct(product);
                              setShowBuyNowDialog(true);
                            }}
                            data-testid={`button-buy-now-${product._id || index}`}
                          >
                            Buy Now
                          </Button>
                        )}
                      </div>
                      <div className="w-20 h-20 flex-shrink-0 relative">
                        <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden">
                          {product.images?.[0] && (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        {isShowOwner && (
                          <Button 
                            size="icon"
                            className="absolute top-1 right-1 h-7 w-7 bg-black/70 hover:bg-black/90 text-white rounded-full" 
                            onClick={() => handleProductAction(product)}
                            data-testid={`button-product-action-${product._id || index}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {!pinnedProduct && buyNowProducts.length === 0 && (
                  <div className="p-4 text-center text-zinc-500 text-sm">
                    No buy now items
                  </div>
                )}
                </div>
                {isShowOwner && (
                  <Button
                    size="icon"
                    className="absolute bottom-4 right-4 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg z-50"
                    onClick={() => handleAddProduct('buy_now')}
                    data-testid="button-add-buy-now"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                )}
              </>
            )}
            
            {productTab === 'Giveaways' && (
              <>
                <div className="h-full overflow-y-auto pb-20">
                {activeGiveaway && (
                  <div className="px-4 py-4 border-b border-zinc-700 bg-zinc-900/50" data-testid="giveaway-active">
                    <div className="flex justify-between gap-4">
                      <div className="flex-1">
                        <Badge className="mb-2 bg-primary text-primary-foreground text-xs">Active Giveaway</Badge>
                        <h3 className="text-lg font-bold text-white mb-2 leading-tight">{activeGiveaway.name || 'Giveaway'}</h3>
                        <p className="text-sm text-zinc-400 mb-1">{activeGiveaway.participants?.length || 0} participants</p>
                        {!activeGiveaway.ended && giveawayTimeLeft > 0 && (
                          <p className="text-sm text-zinc-400">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {Math.floor(giveawayTimeLeft / 60)}:{(giveawayTimeLeft % 60).toString().padStart(2, '0')}
                          </p>
                        )}
                      </div>
                      <div className="w-20 h-20 flex-shrink-0">
                        <div className="w-full h-full bg-zinc-900 rounded-lg flex items-center justify-center">
                          <Gift className="h-12 w-12 text-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {giveaways.filter((g: any) => g._id !== activeGiveaway?._id).map((giveaway: any, index: number) => (
                  <div key={giveaway._id || giveaway.id || index} className="px-4 py-4 border-b border-zinc-700 relative" data-testid={`giveaway-${giveaway._id || index}`}>
                    <div className="flex justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2 leading-tight">{giveaway.name || 'Giveaway'}</h3>
                        <p className="text-sm text-zinc-400 mb-1">{giveaway.participants?.length || 0} participants</p>
                        {giveaway.winner && (
                          <p className="text-sm text-green-400">Winner: {giveaway.winner.userName || 'Someone'}</p>
                        )}
                      </div>
                      <div className="w-20 h-20 flex-shrink-0 relative">
                        <div className="w-full h-full bg-zinc-900 rounded-lg flex items-center justify-center">
                          <Gift className="h-10 w-10 text-zinc-600" />
                        </div>
                        {isShowOwner && (
                          <Button 
                            size="icon"
                            className="absolute top-1 right-1 h-7 w-7 bg-black/70 hover:bg-black/90 text-white rounded-full" 
                            onClick={() => handleProductAction(giveaway)}
                            data-testid={`button-product-action-${giveaway._id || index}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {!activeGiveaway && giveaways.length === 0 && (
                  <div className="p-4 text-center text-zinc-500 text-sm">
                    No giveaways
                  </div>
                )}
                </div>
                {isShowOwner && (
                  <Button
                    size="icon"
                    className="absolute bottom-4 right-4 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg z-50"
                    onClick={() => handleAddProduct('giveaway')}
                    data-testid="button-add-giveaway"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                )}
              </>
            )}
            
            {productTab === 'Sold' && (
              <div className="h-full overflow-y-auto pb-20">
                {soldOrders.map((order: any, index: number) => {
                  const isGiveaway = !!order.giveaway;
                  
                  // For giveaway orders, use order.giveaway
                  // For regular orders, use order.items array
                  let product, productName, productImage, orderPrice, quantity;
                  
                  if (isGiveaway) {
                    product = order.giveaway;
                    productName = product?.name || product?.title || 'Giveaway Item';
                    productImage = product?.images?.[0] || product?.image;
                    orderPrice = 0; // Giveaways are free
                    quantity = order.quantity || product?.quantity || 1;
                  } else {
                    // Regular order with items array
                    const firstItem = order.items?.[0];
                    product = firstItem?.productId || firstItem;
                    const baseName = product?.name || product?.title || 'Item';
                    const orderReference = firstItem?.order_reference || '';
                    productName = baseName + (orderReference ? ` ${orderReference}` : '');
                    productImage = product?.images?.[0] || product?.image;
                    orderPrice = order.total || order.price || (firstItem?.price * (firstItem?.quantity || 1)) || 0;
                    quantity = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 1;
                  }
                  
                  const customerName = `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() || order.customer?.userName || order.customer?.email || 'Customer';
                  
                  return (
                    <div key={order._id || order.id || index} className="px-4 py-4 border-b border-zinc-700" data-testid={`order-sold-${order._id || index}`}>
                      <div className="flex gap-3 items-center">
                        <div className="w-16 h-16 flex-shrink-0">
                          <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden">
                            {productImage ? (
                              <img src={productImage} alt={productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-zinc-600" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white mb-0.5 leading-tight truncate">{productName}</h3>
                          <p className="text-xs text-zinc-400 mb-1 truncate">{customerName}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {isGiveaway ? (
                              <Badge className="bg-purple-600 text-white text-xs px-2 py-0.5">
                                Giveaway
                              </Badge>
                            ) : (
                              <p className="text-sm font-bold text-white">${(orderPrice || 0).toFixed(2)}</p>
                            )}
                            <span className="text-xs text-zinc-500">•</span>
                            <p className="text-xs text-zinc-400">Qty: {quantity}</p>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary hover:bg-zinc-800 h-8 px-3"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetailDialog(true);
                          }}
                          data-testid={`button-view-order-${order._id || index}`}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {soldOrders.length === 0 && (
                  <div className="p-4 text-center text-zinc-500 text-sm">
                    No sold items yet
                  </div>
                )}
                </div>
            )}
          </div>
        </div>

  );
}
