import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Copy, Video, Plus, ChevronLeft, ChevronRight, Search,
  Calendar, Clock, Lock, Unlock, X, Pencil, ExternalLink, Radio
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";
import { apiRequest, fetchWithAuth, queryClient } from '@/lib/queryClient';
import type { TokshopCategoriesResponse } from "@shared/schema";

interface Show {
  _id: string;
  title: string;
  description?: string;
  date: number;
  status: boolean;
  started?: boolean;
  ended?: boolean;
  category?: {
    _id: string;
    name: string;
  };
  thumbnail?: string;
  preview_videos?: string;
  roomType: string;
  activeTime: number;
}

interface ShowsResponse {
  rooms: Show[];
  totalDoc: number;
  limits: number;
  pages: number;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const ShowStatusBadge = ({ show }: { show: Show }) => {
  if (show.started && !show.ended) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-600 text-white shadow">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
        </span>
        Live
      </span>
    );
  }
  if (show.ended) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-black/50 text-white">
        Ended
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-600/90 text-white">
      <Clock className="h-2.5 w-2.5" />
      Scheduled
    </span>
  );
};

export default function LiveShows() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const debouncedSearch = useDebounce(searchInput, 500);

  const statusFilter = activeTab === "upcoming" ? "active" : "inactive";

  const { data: categoriesData } = useQuery<TokshopCategoriesResponse>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetchWithAuth(`/api/categories`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const flattenCategories = (categories: any[]): any[] => {
    const result: any[] = [];
    categories.forEach((category) => {
      result.push(category);
      if (category.subCategories?.length) {
        category.subCategories.forEach((subCat: any) => {
          result.push({ ...subCat, name: `${category.name} > ${subCat.name}` });
        });
      }
    });
    return result;
  };

  const categories = categoriesData?.categories ? flattenCategories(categoriesData.categories) : [];

  const { data: showsData, isLoading } = useQuery<ShowsResponse>({
    queryKey: ["/api/rooms", user?.id, currentPage, statusFilter, debouncedSearch, selectedCategory],
    queryFn: async () => {
      if (!user?.id) return { rooms: [], totalDoc: 0, limits: 15, pages: 0 };
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "15",
        userid: user.id,
        currentUserId: user.id,
        category: selectedCategory === "all" ? "" : selectedCategory,
        title: debouncedSearch,
        status: statusFilter,
      });
      const response = await fetchWithAuth(`/api/rooms?${params.toString()}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch shows");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const shows = showsData?.rooms || [];
  const totalPages = Math.ceil((showsData?.totalDoc || 0) / (showsData?.limits || 15));
  const hasFilters = searchInput || selectedCategory !== "all";

  const toggleRoomTypeMutation = useMutation({
    mutationFn: async ({ showId, newRoomType }: { showId: string; newRoomType: string }) => {
      return await apiRequest("PUT", `/api/rooms/${showId}`, { roomType: newRoomType });
    },
    onMutate: async ({ showId, newRoomType }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/rooms"] });
      const prev = queryClient.getQueryData(["/api/rooms", user?.id, currentPage, statusFilter]);
      queryClient.setQueryData(["/api/rooms", user?.id, currentPage, statusFilter], (old: ShowsResponse | undefined) => {
        if (!old) return old;
        return { ...old, rooms: old.rooms.map(s => s._id === showId ? { ...s, roomType: newRoomType } : s) };
      });
      return { prev };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({ title: "Room type updated", description: "Show privacy settings updated." });
    },
    onError: (error: Error, _vars, context: any) => {
      if (context?.prev) queryClient.setQueryData(["/api/rooms", user?.id, currentPage, statusFilter], context.prev);
      toast({ title: "Failed to update room type", description: error.message, variant: "destructive" });
    },
  });

  const cancelShowMutation = useMutation({
    mutationFn: async (showId: string) => {
      return await apiRequest("PUT", `/api/rooms/${showId}`, { ended: true });
    },
    onMutate: async (showId) => {
      await queryClient.cancelQueries({ queryKey: ["/api/rooms"] });
      const prev = queryClient.getQueryData(["/api/rooms", user?.id, currentPage, statusFilter]);
      queryClient.setQueryData(["/api/rooms", user?.id, currentPage, statusFilter], (old: ShowsResponse | undefined) => {
        if (!old) return old;
        return { ...old, rooms: old.rooms.map(s => s._id === showId ? { ...s, ended: true } : s) };
      });
      return { prev };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({ title: "Show cancelled" });
    },
    onError: (error: Error, _vars, context: any) => {
      if (context?.prev) queryClient.setQueryData(["/api/rooms", user?.id, currentPage, statusFilter], context.prev);
      toast({ title: "Failed to cancel show", description: error.message, variant: "destructive" });
    },
  });

  const copyShowLink = (showId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/show/${showId}`);
    toast({ title: "Link copied to clipboard" });
  };

  const handleTabChange = (val: string) => { setActiveTab(val); setCurrentPage(1); };
  const handleCategoryChange = (val: string) => { setSelectedCategory(val); setCurrentPage(1); };
  const clearFilters = () => { setSearchInput(""); setSelectedCategory("all"); setCurrentPage(1); };

  const renderShowCard = (show: Show) => {
    const isPast = show.date <= Date.now();
    const hideCancel = isPast && (show.started || show.ended);

    return (
      <div
        key={show._id}
        className="group relative rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow duration-200"
        data-testid={`show-card-${show._id}`}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          {show.preview_videos ? (
            <video src={show.preview_videos} className="w-full h-full object-cover" muted playsInline />
          ) : show.thumbnail ? (
            <img src={show.thumbnail} alt={show.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/60">
              <Video className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-2 left-2">
            <ShowStatusBadge show={show} />
          </div>

          {/* Private badge */}
          {show.roomType === "private" && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-black/60 text-white">
                <Lock className="h-2.5 w-2.5" />
                Private
              </span>
            </div>
          )}

          {/* Quick-open overlay */}
          <button
            onClick={() => setLocation(`/show/${show._id}`)}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30"
            data-testid={`button-open-show-${show._id}`}
          >
            <span className="bg-white text-black text-xs font-semibold px-3 py-1.5 rounded-full shadow flex items-center gap-1.5">
              <ExternalLink className="h-3 w-3" />
              Open Show
            </span>
          </button>
        </div>

        {/* Card body */}
        <div className="p-4 space-y-3">
          {/* Title row */}
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-sm leading-snug line-clamp-1 text-foreground"
                data-testid={`show-title-${show._id}`}
              >
                {show.title}
              </h3>
              {show.category && (
                <Badge variant="secondary" className="mt-1 text-xs font-normal">
                  {show.category.name}
                </Badge>
              )}
            </div>
            <button
              onClick={() => copyShowLink(show._id)}
              className="flex-shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
              title="Copy show link"
              data-testid={`button-copy-link-${show._id}`}
            >
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{format(new Date(show.date), "MMM d, yyyy · h:mm a")}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => setLocation(`/show/${show._id}`)}
            >
              Open Show
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1">
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setLocation(`/schedule-show?edit=${show._id}`)}
                  data-testid={`button-edit-show-${show._id}`}
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit Show
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => toggleRoomTypeMutation.mutate({ showId: show._id, newRoomType: show.roomType === "private" ? "public" : "private" })}
                  disabled={toggleRoomTypeMutation.isPending}
                  data-testid={`button-private-mode-${show._id}`}
                >
                  {show.roomType === "private" ? (
                    <><Unlock className="mr-2 h-3.5 w-3.5" />Make Public</>
                  ) : (
                    <><Lock className="mr-2 h-3.5 w-3.5" />Make Private</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => copyShowLink(show._id)}
                >
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Copy Link
                </DropdownMenuItem>
                {!hideCancel && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => cancelShowMutation.mutate(show._id)}
                      disabled={cancelShowMutation.isPending}
                      className="text-destructive focus:text-destructive"
                      data-testid={`button-cancel-show-${show._id}`}
                    >
                      <X className="mr-2 h-3.5 w-3.5" />
                      Cancel Show
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card overflow-hidden animate-pulse">
          <div className="aspect-video bg-muted" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmpty = (tab: string) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        {tab === "upcoming" ? (
          <Radio className="h-10 w-10 text-muted-foreground" />
        ) : (
          <Video className="h-10 w-10 text-muted-foreground" />
        )}
      </div>
      <h3 className="text-base font-semibold mb-1">
        {hasFilters ? "No shows match your filters" : tab === "upcoming" ? "No upcoming shows" : "No past shows"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">
        {hasFilters
          ? "Try clearing your search or changing the category filter."
          : tab === "upcoming"
          ? "Schedule your first show to start selling live."
          : "Your completed shows will appear here."}
      </p>
      {hasFilters ? (
        <Button variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>
      ) : tab === "upcoming" ? (
        <Button size="sm" onClick={() => setLocation("/schedule-show")} data-testid="button-create-first-show">
          <Plus className="h-4 w-4 mr-2" />
          Schedule a Show
        </Button>
      ) : null}
    </div>
  );

  const renderGrid = (tab: string) => {
    if (isLoading) return renderSkeleton();
    if (!shows.length) return renderEmpty(tab);
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {shows.map(renderShowCard)}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} · {showsData?.totalDoc || 0} shows
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} data-testid="button-previous-page">
                <ChevronLeft className="h-4 w-4 mr-1" />Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages} data-testid="button-next-page">
                Next<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground" data-testid="text-shows-title">My Shows</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage and monitor your live shopping shows</p>
          </div>
          <Button
            size="sm"
            onClick={() => setLocation("/schedule-show")}
            data-testid="button-schedule-show"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Schedule a Show
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-9"
              data-testid="input-search-shows"
            />
          </div>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-48 h-9" data-testid="select-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={clearFilters} data-testid="button-clear-filters">
              <X className="h-3.5 w-3.5" />Clear
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-5 h-9" data-testid="tabs-shows">
            <TabsTrigger value="upcoming" className="text-sm" data-testid="tab-upcoming">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past" className="text-sm" data-testid="tab-past">
              Past
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" data-testid="content-upcoming">
            {renderGrid("upcoming")}
          </TabsContent>
          <TabsContent value="past" data-testid="content-past">
            {renderGrid("past")}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
