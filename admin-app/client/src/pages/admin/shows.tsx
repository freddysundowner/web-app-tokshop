import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AdminLayout } from "@/components/admin-layout";
import {
  Video, Search, ChevronLeft, ChevronRight, Eye, Calendar,
  Star, CalendarIcon, Trash2, MoreHorizontal, DollarSign,
  ShoppingCart, Clock, TrendingUp, Radio,
  Users, Filter, X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/queryClient";
import { format } from "date-fns";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function AdminShows() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [searchTitle, setSearchTitle] = useState("");
  const [searchHost, setSearchHost] = useState("");
  const [searchType, setSearchType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRoomType, setSelectedRoomType] = useState("");
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<any>(null);
  const [featuredUntilDate, setFeaturedUntilDate] = useState<Date | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showToDelete, setShowToDelete] = useState<any>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const debouncedTitle = useDebounce(searchTitle, 350);
  const debouncedHost = useDebounce(searchHost, 350);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: showsData, isLoading } = useQuery<any>({
    queryKey: ['/api/admin/shows', page, limit, debouncedTitle, debouncedHost, searchType, selectedCategory, selectedRoomType],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (debouncedTitle) params.append("title", debouncedTitle);
      if (debouncedHost) params.append("ownerUsername", debouncedHost);
      if (searchType) params.append("type", searchType);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedRoomType) params.append("roomType", selectedRoomType);
      const res = await fetchWithAuth(`/api/admin/shows?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch shows");
      return res.json();
    },
  });

  const { data: roomStatsData } = useQuery<any>({
    queryKey: ['/api/admin/rooms/stats/all'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/admin/rooms/stats/all');
      if (!response.ok) return { success: false, data: {} };
      return response.json();
    },
  });

  const { data: categoriesData } = useQuery<any>({
    queryKey: ['/api/admin/categories'],
    queryFn: async () => {
      const res = await fetchWithAuth('/api/admin/categories?limit=100');
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const categories: any[] = categoriesData?.data || categoriesData?.categories || [];

  const roomStatsRaw: any = roomStatsData?.data || {};
  const roomStats = Object.fromEntries(
    Object.entries(roomStatsRaw).filter(([, value]) =>
      typeof value === 'number' || typeof value === 'string'
    )
  );

  const getStatConfig = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes('live')) return { icon: Radio, bg: 'bg-red-50', iconColor: 'text-red-500', valueColor: 'text-red-600', pulse: true };
    if (k.includes('upcoming') || k.includes('scheduled')) return { icon: Clock, bg: 'bg-blue-50', iconColor: 'text-blue-500', valueColor: 'text-blue-700', pulse: false };
    if (k.includes('ended') || k.includes('past')) return { icon: Video, bg: 'bg-zinc-100', iconColor: 'text-zinc-500', valueColor: 'text-zinc-700', pulse: false };
    if (k.includes('revenue') || k.includes('amount') || k.includes('sales')) return { icon: DollarSign, bg: 'bg-emerald-50', iconColor: 'text-emerald-500', valueColor: 'text-emerald-700', pulse: false };
    if (k.includes('viewer') || k.includes('user')) return { icon: Users, bg: 'bg-violet-50', iconColor: 'text-violet-500', valueColor: 'text-violet-700', pulse: false };
    return { icon: TrendingUp, bg: 'bg-slate-50', iconColor: 'text-slate-500', valueColor: 'text-slate-700', pulse: false };
  };

  const formatStatLabel = (key: string) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).replace(/_/g, ' ').trim();

  const formatStatValue = (key: string, value: any) => {
    const k = key.toLowerCase();
    if (k.includes('revenue') || k.includes('amount') || k.includes('price')) {
      return `$${Number(value).toFixed(2)}`;
    }
    return String(value ?? 0);
  };

  const featureMutation = useMutation({
    mutationFn: async ({ roomId, featured_until }: { roomId: string; featured_until: string | null }) => {
      const response = await fetchWithAuth(`/api/rooms/features/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: true, featured_until }),
      });
      if (!response.ok) throw new Error('Failed to update featured status');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Show Featured", description: "The show has been set as featured." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shows'] });
      setFeatureDialogOpen(false);
      setSelectedShow(null);
      setFeaturedUntilDate(undefined);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const response = await fetchWithAuth(`/api/rooms/${roomId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete show');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Show Deleted", description: "The show has been deleted." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shows'] });
      setDeleteDialogOpen(false);
      setShowToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const shows = showsData?.data || [];
  const totalPages = showsData?.pages || 1;
  const totalItems = showsData?.totalDoc || 0;

  const hasActiveFilters = searchTitle || searchHost || selectedCategory || selectedRoomType;

  const clearFilters = () => {
    setSearchTitle("");
    setSearchHost("");
    setSelectedCategory("");
    setSelectedRoomType("");
    setPage(1);
  };

  const getShowStatus = (show: any) => {
    if (show.ended === true) return 'ended';
    if (show.started === true && show.ended === false) return 'live';
    if (show.started === false && show.ended === false) {
      const showDate = show.date || show.activeTime || show.createdAt;
      if (showDate && new Date(typeof showDate === 'number' ? showDate : showDate) > new Date()) {
        return 'scheduled';
      }
    }
    return 'unknown';
  };

  const StatusBadge = ({ show }: { show: any }) => {
    const status = getShowStatus(show);
    if (status === 'live') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Live
        </span>
      );
    }
    if (status === 'scheduled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
          <Clock className="h-3 w-3" />
          Scheduled
        </span>
      );
    }
    if (status === 'ended') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
          Ended
        </span>
      );
    }
    return null;
  };

  const formatShowDate = (show: any) => {
    const ts = show.date || show.activeTime || show.startedTime;
    if (!ts) return null;
    try {
      return format(new Date(typeof ts === 'number' ? ts : ts), "MMM d, yyyy · h:mm a");
    } catch {
      return null;
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Live Shows</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage and monitor all live shopping shows</p>
        </div>

        {/* Stats Row */}
        {Object.keys(roomStats).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(roomStats).map(([key, value]) => {
              const cfg = getStatConfig(key);
              const Icon = cfg.icon;
              return (
                <div key={key} className={`rounded-xl border p-4 ${cfg.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">{formatStatLabel(key)}</span>
                    {cfg.pulse ? (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                    ) : (
                      <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
                    )}
                  </div>
                  <div className={`text-2xl font-bold ${cfg.valueColor}`}>
                    {formatStatValue(key, value)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-card border rounded-xl p-4 space-y-4">
          {/* Status tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Tabs
              value={searchType || "all"}
              onValueChange={(value) => {
                setSearchType(value === "all" ? "" : value);
                setPage(1);
              }}
            >
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                <TabsTrigger value="live" className="text-xs sm:text-sm">
                  <span className="relative flex h-1.5 w-1.5 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                  Live
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="text-xs sm:text-sm">Scheduled</TabsTrigger>
                <TabsTrigger value="ended" className="text-xs sm:text-sm">Ended</TabsTrigger>
                <TabsTrigger value="featured" className="text-xs sm:text-sm">Featured</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 self-start sm:self-auto"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
            >
              <Filter className="h-3.5 w-3.5" />
              More Filters
              {hasActiveFilters && (
                <span className="ml-0.5 h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </div>

          {/* Search + extended filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title..."
                value={searchTitle}
                onChange={(e) => { setSearchTitle(e.target.value); setPage(1); }}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {filtersExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t">
              {/* Host search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by host username..."
                  value={searchHost}
                  onChange={(e) => { setSearchHost(e.target.value); setPage(1); }}
                  className="pl-9 h-9"
                />
              </div>

              {/* Category filter */}
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Categories</option>
                {categories.map((cat: any) => (
                  <option key={cat._id || cat.id} value={cat._id || cat.id}>
                    {String(cat.name || '')}
                  </option>
                ))}
              </select>

              {/* Room type filter */}
              <select
                value={selectedRoomType}
                onChange={(e) => { setSelectedRoomType(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Types</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          )}

          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {searchTitle && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                  Title: {searchTitle}
                  <button onClick={() => setSearchTitle("")}><X className="h-3 w-3" /></button>
                </span>
              )}
              {searchHost && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                  Host: {searchHost}
                  <button onClick={() => setSearchHost("")}><X className="h-3 w-3" /></button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                  Category: {categories.find((c: any) => (c._id || c.id) === selectedCategory)?.name || selectedCategory}
                  <button onClick={() => setSelectedCategory("")}><X className="h-3 w-3" /></button>
                </span>
              )}
              {selectedRoomType && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                  Type: {selectedRoomType}
                  <button onClick={() => setSelectedRoomType("")}><X className="h-3 w-3" /></button>
                </span>
              )}
              <button onClick={clearFilters} className="text-xs text-muted-foreground underline underline-offset-2">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          {/* Table header row with count */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${totalItems.toLocaleString()} show${totalItems !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                  <div className="w-14 h-10 rounded bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-muted rounded w-2/5" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                  <div className="hidden md:block h-3 bg-muted rounded w-24" />
                  <div className="hidden lg:block h-3 bg-muted rounded w-16" />
                  <div className="h-5 bg-muted rounded w-16" />
                  <div className="h-7 w-7 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : shows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-muted p-5 mb-4">
                <Video className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold mb-1">No shows found</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {hasActiveFilters || searchType
                  ? "Try adjusting or clearing your filters."
                  : "No live shows have been created yet."}
              </p>
              {(hasActiveFilters || searchType) && (
                <Button variant="outline" size="sm" className="mt-4" onClick={() => { clearFilters(); setSearchType(""); }}>
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[300px]">Show</TableHead>
                    <TableHead className="hidden md:table-cell">Host</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">Viewers</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">Sales</TableHead>
                    <TableHead className="hidden xl:table-cell text-right">Revenue</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shows.map((show: any) => {
                    const showId = show._id || show.id;
                    const ownerFirstName = String(show.owner?.firstName || '');
                    const ownerLastName = String(show.owner?.lastName || '');
                    const ownerUserName = String(show.owner?.userName || '');
                    const ownerPhoto = String(show.owner?.profilePhoto || '');
                    const hasOwner = Boolean(show.owner);
                    const showDate = formatShowDate(show);
                    const viewerCount = Array.isArray(show.viewers) ? show.viewers.length : (show.viewersCount || 0);
                    const revenue = show.salesTotal || show.totalRevenue || 0;

                    return (
                      <TableRow
                        key={showId}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => setLocation(`/admin/shows/${showId}`)}
                      >
                        {/* Show details */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {/* Thumbnail */}
                            <div className="relative w-14 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                              {show.preview_videos ? (
                                <video src={show.preview_videos} className="w-full h-full object-cover" muted playsInline />
                              ) : show.thumbnail ? (
                                <img src={show.thumbnail} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Video className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate max-w-[180px]">
                                {String(show.title || show.name || 'Untitled Show')}
                                {show.featured && (
                                  <Star className="inline h-3 w-3 fill-amber-400 text-amber-400 ml-1 -mt-0.5" />
                                )}
                              </div>
                              <div className="flex gap-1 mt-0.5">
                                {show.category?.name && (
                                  <span className="text-xs text-muted-foreground">{String(show.category.name)}</span>
                                )}
                                {show.roomType && show.roomType !== 'public' && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{String(show.roomType)}</Badge>
                                )}
                              </div>
                              {/* Mobile host fallback */}
                              <div className="md:hidden text-xs text-muted-foreground mt-0.5 truncate">
                                {hasOwner ? (ownerUserName || `${ownerFirstName} ${ownerLastName}`.trim() || 'Unknown') : 'No host'}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Host */}
                        <TableCell className="hidden md:table-cell">
                          {hasOwner ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7 flex-shrink-0">
                                <AvatarImage src={ownerPhoto} />
                                <AvatarFallback className="text-xs">
                                  {(ownerFirstName || 'U')[0]}{(ownerLastName || '')[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate max-w-[130px]">
                                  {ownerUserName || `${ownerFirstName} ${ownerLastName}`.trim() || 'Unknown'}
                                </div>
                                {show.owner?.email && (
                                  <div className="text-xs text-muted-foreground truncate max-w-[130px]">
                                    {String(show.owner.email)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Viewers */}
                        <TableCell className="hidden lg:table-cell text-center">
                          <div className="flex items-center justify-center gap-1 text-sm">
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            {viewerCount}
                          </div>
                        </TableCell>

                        {/* Sales */}
                        <TableCell className="hidden lg:table-cell text-center">
                          <div className="flex items-center justify-center gap-1 text-sm">
                            <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                            {show.salesCount || 0}
                          </div>
                        </TableCell>

                        {/* Revenue */}
                        <TableCell className="hidden xl:table-cell text-right">
                          <span className="text-sm font-medium text-emerald-600">
                            ${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="hidden sm:table-cell">
                          {showDate ? (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              {showDate}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusBadge show={show} />
                        </TableCell>

                        {/* Actions */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => setLocation(`/admin/shows/${showId}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => { setSelectedShow(show); setFeaturedUntilDate(undefined); setFeatureDialogOpen(true); }}
                                className={show.featured ? "text-amber-600" : ""}
                              >
                                <Star className={`mr-2 h-4 w-4 ${show.featured ? "fill-amber-500" : ""}`} />
                                {show.featured ? "Update Featured" : "Feature Show"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => { setShowToDelete(show); setDeleteDialogOpen(true); }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Show
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && shows.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {totalItems.toLocaleString()} total
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    return (
                      <Button key={pageNum} variant={pageNum === page ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => setPage(pageNum)}>
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="gap-1">
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature Show Dialog */}
      <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature Show</DialogTitle>
            <DialogDescription>
              Set this show as featured. Optionally choose an expiration date.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="text-sm font-medium">Show</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedShow?.title || selectedShow?.name || 'Untitled Show'}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Featured Until (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {featuredUntilDate ? format(featuredUntilDate, "PPP") : "No expiration date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={featuredUntilDate}
                    onSelect={setFeaturedUntilDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              {featuredUntilDate && (
                <Button variant="ghost" size="sm" onClick={() => setFeaturedUntilDate(undefined)} className="text-xs">
                  Clear date
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeatureDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!selectedShow) return;
                featureMutation.mutate({
                  roomId: selectedShow._id || selectedShow.id,
                  featured_until: featuredUntilDate ? String(featuredUntilDate.getTime()) : null,
                });
              }}
              disabled={featureMutation.isPending}
            >
              {featureMutation.isPending ? "Saving..." : "Feature Show"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Show</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{showToDelete?.title || showToDelete?.name || 'this show'}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!showToDelete) return;
                deleteMutation.mutate(showToDelete._id || showToDelete.id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Show"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
