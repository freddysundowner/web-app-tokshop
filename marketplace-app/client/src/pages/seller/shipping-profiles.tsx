import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, fetchWithAuth } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Package,
  Weight,
} from "lucide-react";
import type { TokshopShippingProfile, TokshopShippingProfilesResponse } from "@shared/schema";

const WEIGHT_UNIT_OPTIONS = [
  { key: "lb", label: "Pound (lb)" },
  { key: "oz", label: "Ounce (oz)" },
  { key: "kg", label: "Kilogram (kg)" },
  { key: "g", label: "Gram (g)" }
];

interface ShippingProfileFormData {
  name: string;
  description: string;
  weight: number;
  scale: string;
  max_items: number;
  limit_items_per_package: boolean;
}

const emptyForm: ShippingProfileFormData = {
  name: "",
  description: "",
  weight: 0,
  scale: "oz",
  max_items: 1,
  limit_items_per_package: false,
};

export default function ShippingProfiles() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<TokshopShippingProfile | null>(null);
  const [formData, setFormData] = useState<ShippingProfileFormData>(emptyForm);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const userId = (user as any)?._id || user?.id;

  const { data: freshUserData } = useQuery<any>({
    queryKey: [`/api/profile/${userId}`],
    enabled: !!userId,
    staleTime: 0,
  });

  const currentUser = freshUserData || user;

  const {
    data: shippingProfiles = [],
    isLoading,
    error,
  } = useQuery<TokshopShippingProfilesResponse>({
    queryKey: ["shipping-profiles", user?.id],
    queryFn: async () => {
      const response = await fetchWithAuth(`/api/shipping/profiles/${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch shipping profiles");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ShippingProfileFormData) => {
      const response = await apiRequest("POST", `/api/shipping/profiles/${user?.id}`, data);
      if (!response.ok) throw new Error("Failed to create shipping profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["external-shipping-profiles"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Shipping profile created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create shipping profile", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ShippingProfileFormData & { id: string }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PUT", `/api/shipping/profiles/${id}`, {
        ...updateData,
        userId: user?.id,
      });
      if (!response.ok) throw new Error("Failed to update shipping profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["external-shipping-profiles"] });
      setIsEditDialogOpen(false);
      setEditingProfile(null);
      resetForm();
      toast({ title: "Success", description: "Shipping profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update shipping profile", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/shipping/profiles/${id}`, {});
      if (!response.ok) throw new Error("Failed to delete shipping profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["external-shipping-profiles"] });
      toast({ title: "Success", description: "Shipping profile deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete shipping profile", variant: "destructive" });
    },
  });

  const resetForm = () => setFormData(emptyForm);

  const handleCreate = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (profile: TokshopShippingProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      description: profile.description || "",
      weight: profile.weight,
      scale: profile.scale,
      max_items: profile.max_items ?? 1,
      limit_items_per_package: profile.limit_items_per_package ?? false,
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProfile) {
      updateMutation.mutate({ ...formData, id: editingProfile._id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => deleteMutation.mutate(id);

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingProfile(null);
    resetForm();
  };

  if (!currentUser?.seller) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
        <p className="text-muted-foreground">Only sellers can access shipping profiles management.</p>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Shipping Profiles</h1>
          <p className="text-sm text-muted-foreground">Manage your shipping profiles and settings</p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-profile" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Profile
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Error loading profiles</h3>
          <p className="text-muted-foreground">Failed to load shipping profiles. Please try again.</p>
        </Card>
      ) : shippingProfiles.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No shipping profiles</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first shipping profile.</p>
          <Button onClick={handleCreate} data-testid="button-create-first-profile">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Profile
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shippingProfiles.map((profile) => (
            <Card key={profile._id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-foreground">{profile.name}</CardTitle>
                    {profile.description && (
                      <CardDescription className="mt-1">{profile.description}</CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid={`dropdown-profile-${profile._id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(profile)} data-testid={`button-edit-${profile._id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} data-testid={`button-delete-${profile._id}`}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Shipping Profile</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{profile.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(profile._id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Weight className="h-4 w-4" />
                    <span>{profile.weight} {profile.scale}</span>
                  </div>
                  {profile.limit_items_per_package && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>Max {profile.max_items ?? 1} item{(profile.max_items ?? 1) !== 1 ? 's' : ''} per package</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => { if (!open) closeDialog(); }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProfile ? "Edit Shipping Profile" : "Create Shipping Profile"}</DialogTitle>
            <DialogDescription>
              {editingProfile
                ? "Update the shipping profile details below."
                : "Create a new shipping profile for your products."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Profile Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard Shipping"
                required
                data-testid="input-profile-name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                data-testid="input-profile-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                  data-testid="input-profile-weight"
                />
              </div>
              <div>
                <Label htmlFor="scale">Unit</Label>
                <Select
                  value={formData.scale}
                  onValueChange={(value) => setFormData({ ...formData, scale: value })}
                >
                  <SelectTrigger data-testid="select-profile-scale">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    {WEIGHT_UNIT_OPTIONS.map((option) => (
                      <SelectItem key={option.key} value={option.key}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Package Limits</p>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="limit-toggle" className="text-sm font-medium">Limit items per package</Label>
                  <p className="text-xs text-muted-foreground">Restrict how many items fit in one package</p>
                </div>
                <Switch
                  id="limit-toggle"
                  checked={formData.limit_items_per_package}
                  onCheckedChange={(checked) => setFormData({ ...formData, limit_items_per_package: checked })}
                  data-testid="switch-limit-items"
                />
              </div>
              <div>
                <Label htmlFor="max_items">Max items per package</Label>
                <Input
                  id="max_items"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.max_items}
                  onChange={(e) => setFormData({ ...formData, max_items: Number(e.target.value) })}
                  placeholder="1"
                  disabled={!formData.limit_items_per_package}
                  data-testid="input-max-items"
                />
                {!formData.limit_items_per_package && (
                  <p className="text-xs text-muted-foreground mt-1">Enable "Limit items per package" to set a max</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-profile"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingProfile ? "Update Profile" : "Create Profile"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
