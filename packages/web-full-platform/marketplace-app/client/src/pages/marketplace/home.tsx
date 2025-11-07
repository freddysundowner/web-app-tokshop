import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useSettings } from '@/lib/settings-context';
import { useAuth } from '@/lib/auth-context';
import { usePageTitle } from '@/hooks/use-page-title';
import { MarketplaceSidebar } from '@/components/layout/marketplace-sidebar';
import { ShowCard } from '@/components/show-card';
import { ProductCard } from '@/components/product-card';
import { AuctionCard } from '@/components/auction-card';
import { ChevronRight } from 'lucide-react';

export default function MarketplaceHome() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('For You');
  usePageTitle('Live Shows');

  // Fetch categories from API
  const { data: categoriesData } = useQuery<{
    categories: Array<{
      _id: string;
      name: string;
      image?: string;
    }>;
  }>({
    queryKey: ['/api/categories'],
    queryFn: () => fetch('/api/categories').then(res => res.json()),
  });

  const apiCategories = categoriesData?.categories || [];

  const tabs = [
    { id: 'for-you', label: 'For You', categoryId: null },
    ...apiCategories.map(cat => ({ 
      id: cat._id, 
      label: cat.name,
      categoryId: cat._id
    }))
  ];

  // Add current user ID if available
  const currentUserId = (user as any)?._id || user?.id;

  // Find the selected tab to get its categoryId
  const selectedTab = tabs.find(tab => tab.label === selectedCategory);

  // Fetch trending products (buy-now products)
  const { data: trendingProductsData } = useQuery({
    queryKey: ['/api/products', 'trending', 'buy_now'],
    queryFn: async () => {
      const params = new URLSearchParams({
        saletype: 'buy_now',
        status: 'active',
        limit: '10',
        sortBy: 'views' // Sort by views for trending
      });
      const response = await fetch(`/api/products?${params.toString()}`);
      return response.json();
    }
  });

  // Fetch trending auctions (standalone auction products)
  const { data: trendingAuctionsData } = useQuery({
    queryKey: ['/api/products', 'trending', 'auction'],
    queryFn: async () => {
      const params = new URLSearchParams({
        saletype: 'auction',
        status: 'active',
        limit: '10',
        sortBy: 'views' // Sort by views for trending
      });
      const response = await fetch(`/api/products?${params.toString()}`);
      return response.json();
    }
  });

  const trendingProducts = trendingProductsData?.products || [];
  const trendingAuctions = trendingAuctionsData?.products || [];

  // Fetch rooms with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['/api/rooms', selectedCategory],
    queryFn: async ({ pageParam = 1 }) => {
      // Build query string manually to preserve empty parameters
      const params = [
        `page=${pageParam}`,
        `limit=15`,
        `category=${selectedTab?.categoryId || 'all'}`,
        `userid=`,
        `currentUserId=${currentUserId || ''}`,
        `title=`,
        `status=active`
      ];
      
      const queryString = params.join('&');
      const response = await fetch(`/api/rooms?${queryString}`);
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalItems = lastPage.totalDoc || 0;
      const itemsPerPage = Math.max(lastPage.limits || 20, 1);
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Auto-refresh when page gains focus (e.g., coming back from another tab/window)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page is now visible - silently refresh shows
        console.log('📱 Page visible - refreshing shows...');
        refetch();
      }
    };

    const handleFocus = () => {
      // Window gained focus - silently refresh shows
      console.log('📱 Window focused - refreshing shows...');
      refetch();
    };

    // Listen for visibility changes (tab switching)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for window focus (coming back to app)
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetch]);

  // Refresh shows when navigating back to homepage from within the app
  useEffect(() => {
    console.log('📱 Homepage mounted - refreshing shows...');
    refetch();
  }, []); // Run on mount only

  const rooms = data?.pages?.flatMap(page => page.rooms || []) || [];

  // Infinite scroll observer
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `-${minutes}m ${secs}s`;
    }
    return `-${secs}s`;
  };

  return (
    <div className="flex flex-col h-screen bg-background" data-testid="page-marketplace">

      {/* Mobile Horizontal Tabs */}
      <div className="lg:hidden bg-white dark:bg-background sticky top-0 z-10 border-b border-border/50">
        <div className="flex overflow-x-auto scrollbar-hide" data-testid="tabs-container-mobile">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.label)}
              className={cn(
                "px-3 py-3.5 text-sm whitespace-nowrap flex-shrink-0 relative transition-colors",
                selectedCategory === tab.label
                  ? "text-primary font-semibold"
                  : "text-foreground font-normal"
              )}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
              {selectedCategory === tab.label && (
                <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-foreground dark:bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden h-full justify-center">
        <div className="flex w-full lg:w-[90%] h-full">
          {/* Desktop Sidebar - Hidden on mobile */}
          <MarketplaceSidebar 
            selectedCategory={selectedCategory} 
            onCategoryChange={setSelectedCategory}
            categories={apiCategories}
          />
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto scrollbar-hide bg-white dark:bg-background w-full h-full">
            <div className="w-full px-2 py-3 lg:p-6 space-y-6">
              
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Loading shows...</p>
                </div>
              ) : (
                <>
                  {/* First Section: Live Shows (4 rows ≈ 12 shows) */}
                  <div>
                    <h2 className="text-lg font-bold mb-3">Live Shows</h2>
                    {rooms.length === 0 ? (
                      <div className="flex items-center justify-center h-32">
                        <p className="text-muted-foreground">No live shows at the moment</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 lg:gap-4" data-testid="grid-giveaways">
                        {rooms.slice(0, 12).map((room) => (
                          <ShowCard
                            key={room._id || room.id}
                            show={room as any}
                            currentUserId={currentUserId || ''}
                            variant="grid"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Trending Products Section */}
                  {trendingProducts.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold">Trending Products</h2>
                        <Link href="/trending/products">
                          <Button variant="ghost" size="sm" className="text-primary">
                            See all <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                        {trendingProducts.map((product: any) => (
                          <ProductCard key={product._id || product.id} product={product} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Second Section: More Live Shows (4 rows ≈ 12 shows) */}
                  {rooms.slice(12, 24).length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 lg:gap-4">
                      {rooms.slice(12, 24).map((room) => (
                        <ShowCard
                          key={room._id || room.id}
                          show={room as any}
                          currentUserId={currentUserId || ''}
                          variant="grid"
                        />
                      ))}
                    </div>
                  )}

                  {/* Trending Auctions Section */}
                  {trendingAuctions.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold">Trending Auctions</h2>
                        <Link href="/trending/auctions">
                          <Button variant="ghost" size="sm" className="text-primary">
                            See all <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                        {trendingAuctions.map((auction: any) => (
                          <AuctionCard key={auction._id || auction.id} auction={auction} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Remaining Live Shows */}
                  {rooms.slice(24).length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 lg:gap-4">
                      {rooms.slice(24).map((room) => (
                        <ShowCard
                          key={room._id || room.id}
                          show={room as any}
                          currentUserId={currentUserId || ''}
                          variant="grid"
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Infinite scroll trigger */}
                  <div ref={observerTarget} className="h-20 flex items-center justify-center">
                    {isFetchingNextPage && (
                      <p className="text-sm text-muted-foreground">Loading more shows...</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
