import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { Search, User, ChevronDown, ChevronUp, Package, ShoppingBag, Loader2 } from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSettings } from '@/lib/settings-context';
import { usePageTitle } from '@/hooks/use-page-title';
import { useAuth } from '@/lib/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShowCard } from '@/components/show-card';
import { cn } from '@/lib/utils';
import { getImageUrl, useApiConfig } from '@/lib/use-api-config';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

interface Product {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  description?: string;
  category?: { name: string } | string;
  ownerId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    userName?: string;
    profilePhoto?: string;
  };
  quantity?: number;
  saletype?: string;
}

interface Show {
  _id: string;
  title: string;
  thumbnail?: string;
  coverImage?: string;
  description?: string;
  status?: string;
  category?: string | { name: string };
  owner?: {
    _id: string;
    userName?: string;
    firstName?: string;
    lastName?: string;
    profilePhoto?: string;
  };
  viewers?: any[];
  viewersCount?: number;
  invitedhostIds?: string[];
  shippingCoverage?: string;
  freeShipping?: boolean;
  started?: boolean;
  date?: string | Date;
  shipping_settings?: {
    seller_pays?: boolean;
    buyer_pays?: boolean;
    shippingCostMode?: string;
    priorityMailEnabled?: boolean;
    groundAdvantageEnabled?: boolean;
    reducedShippingCapAmount?: number;
    freePickupEnabled?: boolean;
  };
}

interface UserResult {
  _id: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  profilePhoto?: string;
  bio?: string;
  seller?: boolean;
}

interface SearchResponse {
  query: string;
  pagination: {
    page: number;
    limit: number;
  };
  results: {
    products: {
      total: number;
      pages: number;
      data: Product[];
    };
    rooms: {
      total: number;
      pages: number;
      data: Show[];
    };
    users: {
      total: number;
      pages: number;
      data: UserResult[];
    };
  };
}

type FilterType = 'all' | 'products' | 'shows' | 'users';
type SortType = 'relevant' | 'recent' | 'price_low' | 'price_high';

// Product Card Component
function ProductCard({ product }: { product: Product }) {
  const { externalApiUrl } = useApiConfig();
  const productImage = product.images?.[0] ? getImageUrl(product.images[0], externalApiUrl) : '';
  const sellerName = product.ownerId?.userName || product.ownerId?.firstName || 'Seller';
  const sellerAvatar = product.ownerId?.profilePhoto ? getImageUrl(product.ownerId.profilePhoto, externalApiUrl) : '';
  
  return (
    <Link href={`/product/${product._id}`}>
      <Card className="group hover-elevate active-elevate-2 cursor-pointer overflow-hidden border-border" data-testid={`card-product-${product._id}`}>
        {/* Product Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {productImage ? (
            <img
              src={productImage}
              alt={product.name}
              className="w-full h-full object-cover"
              data-testid={`img-product-${product._id}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                <Package className="h-16 w-16" strokeWidth={1.5} />
                <ShoppingBag className="h-8 w-8 -mt-4" strokeWidth={1.5} />
              </div>
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="p-3 space-y-2">
          <h3 className="font-medium text-sm text-foreground line-clamp-2 min-h-[2.5rem]" data-testid={`text-product-name-${product._id}`}>
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <p className="font-bold text-foreground" data-testid={`text-price-${product._id}`}>
              {formatCurrency(product.price)}
            </p>
            {product.quantity && (
              <p className="text-xs text-muted-foreground">
                Qty: {product.quantity}
              </p>
            )}
          </div>
          
          {/* Seller Info */}
          <div className="flex items-center gap-2 pt-1 border-t border-border">
            <Avatar className="h-5 w-5">
              <AvatarImage src={sellerAvatar} alt={sellerName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {sellerName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs text-muted-foreground truncate" data-testid={`text-seller-${product._id}`}>
              {sellerName}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// User Card Component
function UserCard({ user }: { user: UserResult }) {
  const { externalApiUrl } = useApiConfig();
  const userAvatar = user.profilePhoto ? getImageUrl(user.profilePhoto, externalApiUrl) : '';
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.userName || 'User';
  
  return (
    <Link href={`/profile/${user._id}`}>
      <Card className="group hover-elevate active-elevate-2 cursor-pointer p-4" data-testid={`card-user-${user._id}`}>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={userAvatar} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate" data-testid={`text-username-${user._id}`}>
              {displayName}
            </p>
            {user.bio && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {user.bio}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function SearchResults() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const searchParams = useSearch();
  const [, setLocation] = useLocation();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Parse query params
  const params = new URLSearchParams(searchParams);
  const searchQuery = params.get('q') || '';
  const activeFilter = (params.get('filter') || 'all') as FilterType;
  const [sortBy, setSortBy] = useState<SortType>('relevant');
  
  const currentUserId = (user as any)?._id || (user as any)?.id || '';

  // Set page title
  usePageTitle(searchQuery ? `Search: ${searchQuery} - ${settings.app_name}` : `Search - ${settings.app_name}`);

  // Fetch search results with infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery<SearchResponse>({
    queryKey: ['/api/products/search', searchQuery, activeFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        q: searchQuery,
        page: String(pageParam),
        limit: '20',
        filter: activeFilter,
      });
      const response = await fetch(`/api/products/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.pagination.page;
      let totalPages = 0;
      
      // Determine total pages based on active filter
      if (activeFilter === 'products') {
        totalPages = lastPage.results.products.pages;
      } else if (activeFilter === 'shows') {
        totalPages = lastPage.results.rooms.pages;
      } else if (activeFilter === 'users') {
        totalPages = lastPage.results.users.pages;
      } else {
        // For 'all', use the max pages from any category
        totalPages = Math.max(
          lastPage.results.products.pages,
          lastPage.results.rooms.pages,
          lastPage.results.users.pages
        );
      }
      
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!searchQuery,
  });

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all pages of data
  const allProducts = data?.pages.flatMap(page => page.results.products?.data || []) || [];
  const allShows = data?.pages.flatMap(page => page.results.rooms?.data || []) || [];
  const allUsers = data?.pages.flatMap(page => page.results.users?.data || []) || [];

  // Get totals from first page
  const totals = data?.pages[0]?.results || {
    products: { total: 0 },
    rooms: { total: 0 },
    users: { total: 0 },
  };

  // Handle filter change
  const handleFilterChange = (filter: FilterType) => {
    params.set('filter', filter);
    setLocation(`/search?${params.toString()}`);
  };

  // Determine which results to show
  const showProducts = activeFilter === 'all' || activeFilter === 'products';
  const showShows = activeFilter === 'all' || activeFilter === 'shows';
  const showUsers = activeFilter === 'all' || activeFilter === 'users';
  
  // Calculate results count based on active filter
  const getResultsCount = () => {
    if (activeFilter === 'products') return totals.products.total;
    if (activeFilter === 'shows') return totals.rooms.total;
    if (activeFilter === 'users') return totals.users.total;
    return totals.products.total + totals.rooms.total + totals.users.total;
  };
  
  const resultsCount = getResultsCount();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex justify-center w-full">
        <div className="w-full lg:w-[90%]">
          <div className="flex gap-6 px-4 md:px-6 lg:px-8 py-6">
            {/* Left Sidebar - Filters */}
            <div className="hidden md:block flex-shrink-0 w-64 space-y-6">
              {/* Filter by Section */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Filter by</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleFilterChange('all')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      activeFilter === 'all'
                        ? "bg-foreground text-background font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                    data-testid="filter-all"
                  >
                    Top
                  </button>
                  <button
                    onClick={() => handleFilterChange('products')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      activeFilter === 'products'
                        ? "bg-foreground text-background font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                    data-testid="filter-products"
                  >
                    Products
                  </button>
                  <button
                    onClick={() => handleFilterChange('shows')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      activeFilter === 'shows'
                        ? "bg-foreground text-background font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                    data-testid="filter-shows"
                  >
                    Shows
                  </button>
                  <button
                    onClick={() => handleFilterChange('users')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      activeFilter === 'users'
                        ? "bg-foreground text-background font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                    data-testid="filter-users"
                  >
                    Users
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-search-query">
                  Search results for "{searchQuery}"
                </h1>
                <p className="text-muted-foreground">
                  {isLoading ? 'Searching...' : `Found ${resultsCount} results`}
                </p>
              </div>

              {/* Mobile Filter Tabs */}
              <div className="flex md:hidden items-center gap-2 mb-6 border-b border-border overflow-x-auto">
                <button
                  onClick={() => handleFilterChange('all')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                    activeFilter === 'all'
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  data-testid="button-filter-all"
                >
                  Top
                </button>
                <button
                  onClick={() => handleFilterChange('products')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                    activeFilter === 'products'
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  data-testid="button-filter-products"
                >
                  Products
                </button>
                <button
                  onClick={() => handleFilterChange('shows')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                    activeFilter === 'shows'
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  data-testid="button-filter-shows"
                >
                  Shows
                </button>
                <button
                  onClick={() => handleFilterChange('users')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                    activeFilter === 'users'
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  data-testid="button-filter-users"
                >
                  Users
                </button>
              </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load search results</p>
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && allProducts.length === 0 && allShows.length === 0 && allUsers.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground mb-2">No results found</p>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && !error && (
          <div className="space-y-8">
            {/* Products */}
            {showProducts && allProducts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {allProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}

            {/* Shows */}
            {showShows && allShows.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allShows.map((show) => (
                  <ShowCard key={show._id} show={show} currentUserId={currentUserId} />
                ))}
              </div>
            )}

            {/* Users */}
            {showUsers && allUsers.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {allUsers.map((user) => (
                  <UserCard key={user._id} user={user} />
                ))}
              </div>
            )}

            {/* Infinite Scroll Trigger */}
            {hasNextPage && (
              <div ref={loadMoreRef} className="flex items-center justify-center py-8">
                {isFetchingNextPage && (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                )}
              </div>
            )}
          </div>
        )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
