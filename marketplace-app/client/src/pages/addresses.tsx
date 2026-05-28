import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/queryClient";
import {
  SearchableSelect,
  useCountryOptions,
  useStateOptions,
  useCityOptions,
  findCountry,
  findState,
} from "@/components/address-fields";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, MoreVertical, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Address {
  id?: string;
  _id?: string;
  name: string;
  addrress1: string; // Keep typo from API
  addrress2?: string;
  city: string;
  state: string;
  zipcode: string;
  zip?: string;
  country: string;
  countryCode?: string;
  phone?: string;
  email?: string;
  primary?: boolean;
  userId?: string;
}

interface AddressFormData {
  name: string;
  addrress1: string;
  addrress2: string;
  city: string;
  state: string;
  zipcode: string;
  countryCode: string;
  country: string;
  phone: string;
  email: string;
  userId: string;
}

export default function Addresses() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Store full data objects for submission
  const [countryData, setCountryData] = useState<any>(null);
  const [stateData, setStateData] = useState<any>(null);
  const [cityData, setCityData] = useState<any>(null);

  const countryOptions = useCountryOptions();
  const stateOptions = useStateOptions(countryData?.isoCode);
  const cityOptions = useCityOptions(countryData?.isoCode, stateData?.isoCode);
  
  const [formData, setFormData] = useState<AddressFormData>({
    name: "",
    addrress1: "",
    addrress2: "",
    city: "",
    state: "",
    zipcode: "",
    countryCode: "US",
    country: "United States",
    phone: "",
    email: "",
    userId: "",
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch addresses
  const {
    data: addresses = [],
    isLoading,
    error,
  } = useQuery<Address[]>({
    queryKey: ["addresses", user?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/address/all/${user?.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch addresses");
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Create address mutation
  const createMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const response = await apiRequest("POST", "/api/address", {
        ...data,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Address created successfully",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to create address";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update address mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: AddressFormData & { id: string }) => {
      const response = await apiRequest("PUT", `/api/address/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setIsDialogOpen(false);
      setEditingAddress(null);
      resetForm();
      toast({
        title: "Success",
        description: "Address updated successfully",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to update address";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete address mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/address/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast({
        title: "Success",
        description: "Address deleted successfully",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to delete address";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Set primary address mutation
  const makePrimaryMutation = useMutation({
    mutationFn: async ({
      id,
      primary,
      userId,
    }: {
      id: string;
      primary: boolean;
      userId: string;
    }) => {
      const response = await apiRequest("PUT", `/api/address/primary/${id}`, {
        primary,
        userId,
      });
      if (!response.ok) {
        throw new Error("Failed to update address primary status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast({
        title: "Success",
        description: "Primary address updated successfully",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to update primary address";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      addrress1: "",
      addrress2: "",
      city: "",
      state: "",
      zipcode: "",
      countryCode: "US",
      country: "United States",
      phone: "",
      email: "",
      userId: "",
    });
    setCountryData(null);
    setStateData(null);
    setCityData(null);
  };

  const handleCreate = () => {
    resetForm();
    setEditingAddress(null);
    setIsDialogOpen(true);
  };

  const handleEdit = async (address: Address) => {
    console.log('🔵 handleEdit called for address:', address);
    
    // Set form data with existing address values
    setFormData({
      name: address.name || "",
      addrress1: address.addrress1 || "",
      addrress2: address.addrress2 || "",
      city: address.city || "",
      state: address.state || "",
      zipcode: address.zipcode || (address as any).zip || "",
      countryCode: address.countryCode || "US",
      country: address.country || "United States",
      phone: address.phone || "",
      email: address.email || "",
      userId: user?.id || "",
    });
    
    setEditingAddress(address);
    setIsDialogOpen(true);

    // Re-hydrate country/state/city from saved address (synchronous lookup)
    const foundCountry = findCountry(address.countryCode || address.country);
    if (foundCountry) {
      setCountryData({ name: foundCountry.name, isoCode: foundCountry.isoCode });
      const foundState = findState(foundCountry.isoCode, (address as any).stateCode || address.state);
      if (foundState) {
        setStateData({ name: foundState.name, isoCode: foundState.isoCode });
        if (address.city) {
          setCityData({ name: address.city });
        }
      } else {
        setStateData(null);
        setCityData(null);
      }
    } else {
      setCountryData(null);
      setStateData(null);
      setCityData(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that location data is selected
    if (!countryData || !stateData || !cityData) {
      toast({
        title: "Missing Information",
        description: "Please select country, state, and city from the dropdowns.",
        variant: "destructive",
      });
      return;
    }

    // Get name and email from user data
    const userName =
      `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
      user?.userName ||
      user?.email ||
      "";
    const userEmail = user?.email || "";

    // Use selected data if available, otherwise use existing form data (for edits)
    const dataToSubmit = {
      ...formData,
      name: userName,
      email: userEmail,
      country: countryData?.name || formData.country,
      countryCode: countryData?.isoCode || formData.countryCode,
      state: stateData?.name || formData.state,
      stateCode: stateData?.isoCode || (editingAddress as any)?.stateCode || "",
      city: cityData?.name || formData.city,
      cityCode: (editingAddress as any)?.cityCode || "",
    };

    if (editingAddress) {
      const addressId = editingAddress.id || (editingAddress as any)._id;
      updateMutation.mutate({ ...dataToSubmit, id: addressId });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleDelete = (address: Address) => {
    const addressId = address.id || (address as any)._id;
    deleteMutation.mutate(addressId);
  };

  const handleTogglePrimary = (address: Address, currentPrimary: boolean) => {
    const addressId = address.id || (address as any)._id;
    makePrimaryMutation.mutate({
      id: addressId,
      primary: !currentPrimary,
      userId: user?.id || "",
    });
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Addresses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your shipping and billing addresses
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="w-full sm:w-auto"
          data-testid="button-add-address"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Address
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted" />
              <CardContent className="h-32 bg-muted/50" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center text-destructive">
            Failed to load addresses. Please try again.
          </CardContent>
        </Card>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No addresses yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first address to get started
            </p>
            <Button onClick={handleCreate} data-testid="button-add-first-address">
              <Plus className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => {
            const addressId = address.id || (address as any)._id;
            return (
              <Card key={addressId} data-testid={`card-address-${addressId}`}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-start gap-2 flex-1">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {address.name}
                        {address.primary && (
                          <Badge variant="default" className="text-xs">
                            <Star className="mr-1 h-3 w-3" />
                            Primary
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-menu-${addressId}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEdit(address)}
                          data-testid={`button-edit-${addressId}`}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleTogglePrimary(address, address.primary || false)
                          }
                          data-testid={`button-toggle-primary-${addressId}`}
                        >
                          {address.primary
                            ? "Remove as Primary"
                            : "Set as Primary"}
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive"
                              data-testid={`button-delete-${addressId}`}
                            >
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Address</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this address? This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(address)}
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
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>{address.addrress1}</div>
                    {address.addrress2 && <div>{address.addrress2}</div>}
                    <div>
                      {address.city}, {address.state} {address.zipcode}
                    </div>
                    <div>{address.country}</div>
                    {address.phone && <div>Phone: {address.phone}</div>}
                    {address.email && <div>Email: {address.email}</div>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDialogOpen(false);
            setEditingAddress(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription>
              {editingAddress
                ? "Update the address details below."
                : "Add a new shipping or billing address."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="addrress1">Street Address</Label>
              <Input
                id="addrress1"
                value={formData.addrress1}
                onChange={(e) =>
                  setFormData({ ...formData, addrress1: e.target.value })
                }
                placeholder="123 Main Street"
                required
                data-testid="input-address-street1"
              />
            </div>

            <div>
              <Label htmlFor="addrress2">Street Address 2 (Optional)</Label>
              <Input
                id="addrress2"
                value={formData.addrress2}
                onChange={(e) =>
                  setFormData({ ...formData, addrress2: e.target.value })
                }
                placeholder="Apt, Suite, Unit, etc."
                data-testid="input-address-street2"
              />
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <SearchableSelect
                options={countryOptions}
                value={countryData?.isoCode || ""}
                onChange={(opt) => {
                  setCountryData(opt?.meta || null);
                  setStateData(null);
                  setCityData(null);
                }}
                placeholder="Select Country"
                searchPlaceholder="Search country..."
                emptyText="No country found"
                testId="select-country"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>State/Province</Label>
                <SearchableSelect
                  options={stateOptions}
                  value={stateData?.isoCode || ""}
                  onChange={(opt) => {
                    setStateData(opt?.meta || null);
                    setCityData(null);
                  }}
                  placeholder={countryData ? "Select State" : "Select country first"}
                  searchPlaceholder="Search state..."
                  emptyText="No state found"
                  disabled={!countryData || stateOptions.length === 0}
                  testId="select-state"
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                {cityOptions.length > 0 ? (
                  <SearchableSelect
                    options={cityOptions}
                    value={cityData?.name || ""}
                    onChange={(opt) => setCityData(opt?.meta || null)}
                    placeholder={stateData ? "Select City" : "Select state first"}
                    searchPlaceholder="Search city..."
                    emptyText="No city found"
                    disabled={!stateData}
                    testId="select-city"
                  />
                ) : (
                  <Input
                    value={cityData?.name || ""}
                    onChange={(e) => setCityData(e.target.value ? { name: e.target.value } : null)}
                    placeholder={stateData ? "Enter city" : "Select state first"}
                    disabled={!stateData}
                    data-testid="input-city-freetext"
                  />
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="zipcode">ZIP / Postal Code</Label>
              <Input
                id="zipcode"
                value={formData.zipcode}
                onChange={(e) =>
                  setFormData({ ...formData, zipcode: e.target.value })
                }
                placeholder="12345"
                required
                data-testid="input-address-zipcode"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+1 (555) 123-4567"
                data-testid="input-address-phone"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                data-testid="button-cancel-address"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-address"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingAddress
                  ? "Update Address"
                  : "Add Address"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
