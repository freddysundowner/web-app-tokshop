import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Truck, Plus, Trash2, Edit, Package, Scale, Ruler } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { queryClient, fetchWithAuth } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ShippingProfile {
  _id: string;
  name: string;
  description?: string;
  weight?: number;
  scale?: string;
  length?: number;
  width?: number;
  height?: number;
  max_items?: number;
  limit_items_per_package?: boolean;
  user?: any;
  createdAt?: string;
}

const emptyForm = {
  name: "",
  description: "",
  weight: "",
  scale: "oz",
  length: "",
  width: "",
  height: "",
  max_items: "1",
  limit_items_per_package: false,
};

export default function AdminShippingProfiles() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ShippingProfile | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const { toast } = useToast();

  const { data: profilesData, isLoading } = useQuery<any>({
    queryKey: ['/api/shipping/profiles'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/shipping/profiles', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch shipping profiles');
      return response.json();
    },
  });

  const profiles: ShippingProfile[] = Array.isArray(profilesData?.data)
    ? profilesData.data
    : Array.isArray(profilesData)
      ? profilesData
      : profilesData?._id
        ? [profilesData]
        : [];

  const resetForm = () => setFormData(emptyForm);

  const buildPayload = (f: typeof emptyForm) => ({
    name: f.name,
    description: f.description,
    weight: f.weight ? parseFloat(f.weight) : undefined,
    scale: f.scale,
    length: f.length ? parseFloat(f.length) : undefined,
    width: f.width ? parseFloat(f.width) : undefined,
    height: f.height ? parseFloat(f.height) : undefined,
    max_items: f.max_items ? parseInt(f.max_items) : 1,
    limit_items_per_package: f.limit_items_per_package,
  });

  const authHeaders = (): Record<string, string> => {
    const adminToken = localStorage.getItem('adminAccessToken');
    const userToken = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) h['x-admin-token'] = adminToken;
    if (userToken) { h['x-access-token'] = userToken; h['Authorization'] = `Bearer ${userToken}`; }
    if (userData) h['x-user-data'] = btoa(unescape(encodeURIComponent(userData)));
    return h;
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/shipping/profiles', {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(data), credentials: 'include',
      });
      if (!response.ok) { const e = await response.json().catch(() => ({})); throw new Error(e.error || 'Failed to create shipping profile'); }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipping/profiles'] });
      toast({ title: "Success", description: "Shipping profile created successfully" });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create shipping profile", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/shipping/profiles/${id}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(data), credentials: 'include',
      });
      if (!response.ok) { const e = await response.json().catch(() => ({})); throw new Error(e.error || 'Failed to update shipping profile'); }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipping/profiles'] });
      toast({ title: "Success", description: "Shipping profile updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedProfile(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update shipping profile", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/shipping/profiles/${id}`, {
        method: 'DELETE', headers: authHeaders(), credentials: 'include',
      });
      if (!response.ok) { const e = await response.json().catch(() => ({})); throw new Error(e.error || 'Failed to delete shipping profile'); }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipping/profiles'] });
      toast({ title: "Success", description: "Shipping profile deleted successfully" });
      setProfileToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete shipping profile", variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Profile name is required", variant: "destructive" });
      return;
    }
    createMutation.mutate(buildPayload(formData));
  };

  const handleEdit = () => {
    if (!selectedProfile) return;
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Profile name is required", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id: selectedProfile._id, data: buildPayload(formData) });
  };

  const openEditDialog = (profile: ShippingProfile) => {
    setSelectedProfile(profile);
    setFormData({
      name: profile.name || "",
      description: profile.description || "",
      weight: profile.weight?.toString() || "",
      scale: profile.scale || "oz",
      length: profile.length?.toString() || "",
      width: profile.width?.toString() || "",
      height: profile.height?.toString() || "",
      max_items: profile.max_items?.toString() ?? "1",
      limit_items_per_package: profile.limit_items_per_package ?? false,
    });
    setIsEditDialogOpen(true);
  };

  const ProfileForm = ({ prefix = "" }: { prefix?: string }) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`${prefix}name`}>Name *</Label>
        <Input
          id={`${prefix}name`}
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Small Package"
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}description`}>Description</Label>
        <Input
          id={`${prefix}description`}
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Optional description"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${prefix}weight`}>Weight</Label>
          <Input
            id={`${prefix}weight`}
            type="number"
            step="0.1"
            min="0"
            value={formData.weight}
            onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}scale`}>Unit</Label>
          <Select value={formData.scale} onValueChange={(v) => setFormData(prev => ({ ...prev, scale: v }))}>
            <SelectTrigger id={`${prefix}scale`}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="oz">oz</SelectItem>
              <SelectItem value="lb">lb</SelectItem>
              <SelectItem value="g">g</SelectItem>
              <SelectItem value="kg">kg</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Dimensions (inches)</Label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <Input type="number" step="0.1" min="0" value={formData.length} onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))} placeholder="L" />
          <Input type="number" step="0.1" min="0" value={formData.width} onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))} placeholder="W" />
          <Input type="number" step="0.1" min="0" value={formData.height} onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))} placeholder="H" />
        </div>
      </div>
      <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Package Limits</p>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor={`${prefix}limit`} className="text-sm font-medium">Limit items per package</Label>
            <p className="text-xs text-muted-foreground">Restrict how many items fit in one package</p>
          </div>
          <Switch
            id={`${prefix}limit`}
            checked={formData.limit_items_per_package}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, limit_items_per_package: checked }))}
            data-testid={`${prefix}switch-limit-items`}
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}max_items`}>Max items per package</Label>
          <Input
            id={`${prefix}max_items`}
            type="number"
            min="1"
            step="1"
            value={formData.max_items}
            onChange={(e) => setFormData(prev => ({ ...prev, max_items: e.target.value }))}
            placeholder="1"
            disabled={!formData.limit_items_per_package}
            data-testid={`${prefix}input-max-items`}
          />
          {!formData.limit_items_per_package && (
            <p className="text-xs text-muted-foreground mt-1">Enable "Limit items per package" to set a max</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shipping Profiles</h1>
            <p className="text-muted-foreground">Manage general shipping profiles for giveaways and products</p>
          </div>
          <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Shipping Profile
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              All Shipping Profiles
            </CardTitle>
            <CardDescription>
              {profiles.length} shipping profile{profiles.length !== 1 ? 's' : ''} available
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No shipping profiles found</p>
                <p className="text-sm">Create your first shipping profile to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <div key={profile._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{profile.name}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {profile.weight && (
                            <span className="flex items-center gap-1">
                              <Scale className="h-3 w-3" />
                              {profile.weight} {profile.scale || 'oz'}
                            </span>
                          )}
                          {(profile.length || profile.width || profile.height) && (
                            <span className="flex items-center gap-1">
                              <Ruler className="h-3 w-3" />
                              {profile.length || 0} × {profile.width || 0} × {profile.height || 0} in
                            </span>
                          )}
                          {profile.limit_items_per_package && (
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              Max {profile.max_items ?? 1} item{(profile.max_items ?? 1) !== 1 ? 's' : ''}/pkg
                            </span>
                          )}
                        </div>
                        {profile.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {profile.description.substring(0, 60)}{profile.description.length > 60 ? '…' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(profile)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setProfileToDelete(profile._id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Shipping Profile</DialogTitle>
              <DialogDescription>Add a new general shipping profile</DialogDescription>
            </DialogHeader>
            <ProfileForm prefix="create-" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Profile"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Shipping Profile</DialogTitle>
              <DialogDescription>Update shipping profile details</DialogDescription>
            </DialogHeader>
            <ProfileForm prefix="edit-" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!profileToDelete} onOpenChange={() => setProfileToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Shipping Profile</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this shipping profile? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => profileToDelete && deleteMutation.mutate(profileToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
