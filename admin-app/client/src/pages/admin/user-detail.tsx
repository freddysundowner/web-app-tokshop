import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, MapPin, Truck, CreditCard, ExternalLink, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminUserDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/users/:userId");
  const { user } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();
  const userId = params?.userId;
  const [activeTab, setActiveTab] = useState<string>("addresses");

  // Redirect if not admin (in useEffect to avoid render-phase side effects)
  useEffect(() => {
    if (!user?.admin) {
      setLocation("/");
    }
  }, [user?.admin, setLocation]);

  // Mutation to approve user as seller
  const approveSellerMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}/approve-seller`, { email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
      toast({
        title: "Success",
        description: "User approved as seller successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve seller",
        variant: "destructive",
      });
    },
  });

  // Mutation to update user details (for revoking seller status)
  const updateUserMutation = useMutation({
    mutationFn: async (updates: any) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Mutation to impersonate user (open as seller in marketplace)
  const impersonateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/impersonate/user`, { userId });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.accessToken) {
        // Get the marketplace URL from settings or use default
        const marketplaceUrl = settings?.website_url || window.location.origin.replace('admin', 'marketplace');
        
        // Build URL with impersonation token
        const impersonateUrl = new URL(marketplaceUrl);
        impersonateUrl.pathname = '/';
        impersonateUrl.searchParams.set('impersonate', 'true');
        impersonateUrl.searchParams.set('token', data.accessToken);
        impersonateUrl.searchParams.set('authtoken', data.authtoken || '');
        impersonateUrl.searchParams.set('user', encodeURIComponent(JSON.stringify(data.data)));
        
        // Open in new tab
        window.open(impersonateUrl.toString(), '_blank');
        
        toast({
          title: "Opening Marketplace",
          description: `Opening marketplace as ${userInfo?.userName || userInfo?.email}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to get impersonation tokens",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to impersonate user",
        variant: "destructive",
      });
    },
  });

  const handleSellerToggle = (checked: boolean) => {
    if (checked) {
      // Use approve seller endpoint when enabling seller status
      const userEmail = userInfo?.email || '';
      approveSellerMutation.mutate(userEmail);
    } else {
      // Use update endpoint when disabling seller status
      updateUserMutation.mutate({ seller: false });
    }
  };

  // Fetch user details - always fetch fresh data from users/:id endpoint
  const { data: userData, isLoading: loadingUser } = useQuery<{ success: boolean; data: any }>({
    queryKey: [`/api/admin/users/${userId}`],
    enabled: !!userId,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  // Fetch user addresses
  const { data: addressesData, isLoading: loadingAddresses } = useQuery<any>({
    queryKey: [`/api/address/all/${userId}`],
    enabled: !!userId,
  });

  // Fetch user shipping profiles
  const { data: shippingData, isLoading: loadingShipping } = useQuery<any>({
    queryKey: [`/api/shipping/profiles/user/${userId}`],
    enabled: !!userId,
  });

  // Fetch user payment methods - only when Payment Methods tab is active
  const { data: paymentMethodsData, isLoading: loadingPaymentMethods } = useQuery<any>({
    queryKey: [`/users/paymentmethod/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/users/paymentmethod/${userId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }
      return await response.json();
    },
    enabled: !!userId && activeTab === 'payment-methods',
  });

  const userInfo = userData?.data;
  const addresses = addressesData?.data || addressesData || [];
  const shippingProfiles = shippingData?.data || shippingData || [];
  const paymentMethods = paymentMethodsData?.data || paymentMethodsData || [];

  if (loadingUser) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading user details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!userInfo) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground">User not found</p>
            <Button onClick={() => setLocation("/admin")} className="mt-4">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/admin")}
            data-testid="button-back-to-admin"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
        {/* User Profile Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Complete user information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={userInfo.profilePhoto} />
                <AvatarFallback className="text-2xl">
                  {userInfo.firstName?.[0]}{userInfo.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium" data-testid="text-user-name">
                    {userInfo.firstName} {userInfo.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium" data-testid="text-user-email">{userInfo.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium" data-testid="text-user-username">{userInfo.userName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p className="font-medium">{userInfo.country || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{userInfo.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Default Payment Method</p>
                  <p className="font-medium" data-testid="text-default-payment-method">
                    {typeof userInfo.defaultpaymentmethod === 'object' && userInfo.defaultpaymentmethod
                      ? `${(userInfo.defaultpaymentmethod.type || 'Card').replace(/_/g, ' ')} ending in ${userInfo.defaultpaymentmethod.last4 || '****'}`
                      : userInfo.defaultpaymentmethod ? String(userInfo.defaultpaymentmethod).replace(/_/g, ' ') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Type</p>
                  <Badge variant={userInfo.seller ? "default" : "secondary"}>
                    {userInfo.seller ? "Seller" : "Customer"}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Admin Controls */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold mb-4">Admin Controls</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between max-w-md">
                  <div className="space-y-0.5">
                    <Label htmlFor="seller-toggle" className="text-base">
                      Seller Account
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow this user to sell products on the platform
                    </p>
                  </div>
                  <Switch
                    id="seller-toggle"
                    checked={userInfo.seller}
                    onCheckedChange={handleSellerToggle}
                    disabled={approveSellerMutation.isPending || updateUserMutation.isPending}
                    data-testid="switch-seller-status"
                  />
                </div>
                
                {/* Open as Seller button */}
                {userInfo.seller && (
                  <div className="flex items-center justify-between max-w-md">
                    <div className="space-y-0.5">
                      <Label className="text-base">
                        View as Seller
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Open the marketplace as this seller in a new tab
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => impersonateMutation.mutate()}
                      disabled={impersonateMutation.isPending}
                      data-testid="button-impersonate-user"
                    >
                      {impersonateMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                          Opening...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open as Seller
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different data sections */}
        <Tabs defaultValue="addresses" className="w-full" onValueChange={setActiveTab}>
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className={`inline-flex w-full min-w-max sm:w-full sm:min-w-0 sm:grid ${userInfo?.seller ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
              <TabsTrigger value="addresses" data-testid="tab-addresses" className="flex-shrink-0 sm:flex-shrink">
                <MapPin className="h-4 w-4 mr-2 hidden sm:inline" />
                Addresses ({addresses.length})
              </TabsTrigger>
              {userInfo?.seller && (
                <TabsTrigger value="shipping" data-testid="tab-shipping" className="flex-shrink-0 sm:flex-shrink">
                  <Truck className="h-4 w-4 mr-2 hidden sm:inline" />
                  Shipping Profiles ({shippingProfiles.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="payment-methods" data-testid="tab-payment-methods" className="flex-shrink-0 sm:flex-shrink">
                <CreditCard className="h-4 w-4 mr-2 hidden sm:inline" />
                Payment Methods
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <CardTitle>User Addresses</CardTitle>
                <CardDescription>All saved addresses for this user</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAddresses ? (
                  <div className="text-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading addresses...</p>
                  </div>
                ) : addresses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No addresses found</p>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {addresses.length > 0 && Object.keys(addresses[0])
                            .filter(key => !['_id', '__v', 'userId', 'user', 'createdAt', 'updatedAt', 'cityCode', 'stateCode', 'countryCode', 'street'].includes(key))
                            .map((key) => (
                              <TableHead key={key} className="capitalize whitespace-nowrap">
                                {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                              </TableHead>
                            ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {addresses.map((address: any, idx: number) => (
                          <TableRow key={address._id || idx} data-testid={`address-${idx}`}>
                            {Object.entries(address)
                              .filter(([key]) => !['_id', '__v', 'userId', 'user', 'createdAt', 'updatedAt', 'cityCode', 'stateCode', 'countryCode', 'street'].includes(key))
                              .map(([key, value]: [string, any]) => (
                                <TableCell key={key} className="whitespace-nowrap">
                                  {value === null || value === undefined ? (
                                    <span className="text-muted-foreground">N/A</span>
                                  ) : typeof value === 'boolean' ? (
                                    <Badge variant={value ? "default" : "secondary"}>
                                      {value ? 'Yes' : 'No'}
                                    </Badge>
                                  ) : typeof value === 'object' ? (
                                    <span className="text-xs font-mono max-w-[200px] truncate block" title={JSON.stringify(value)}>
                                      {JSON.stringify(value)}
                                    </span>
                                  ) : (
                                    String(value)
                                  )}
                                </TableCell>
                              ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipping Profiles Tab */}
          <TabsContent value="shipping">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Profiles</CardTitle>
                <CardDescription>User's shipping configurations</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingShipping ? (
                  <div className="text-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading shipping profiles...</p>
                  </div>
                ) : shippingProfiles.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No shipping profiles found</p>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {shippingProfiles.length > 0 && Object.keys(shippingProfiles[0])
                            .filter(key => !['_id', '__v', 'userId', 'user', 'taxCode', 'createdAt', 'updatedAt'].includes(key))
                            .map((key) => (
                              <TableHead key={key} className="capitalize whitespace-nowrap">
                                {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                              </TableHead>
                            ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shippingProfiles.map((profile: any, idx: number) => (
                          <TableRow key={profile._id || idx} data-testid={`shipping-profile-${idx}`}>
                            {Object.entries(profile)
                              .filter(([key]) => !['_id', '__v', 'userId', 'user', 'taxCode', 'createdAt', 'updatedAt'].includes(key))
                              .map(([key, value]: [string, any]) => (
                                <TableCell key={key} className="whitespace-nowrap">
                                  {value === null || value === undefined ? (
                                    <span className="text-muted-foreground">N/A</span>
                                  ) : typeof value === 'boolean' ? (
                                    <Badge variant={value ? "default" : "secondary"}>
                                      {value ? 'Yes' : 'No'}
                                    </Badge>
                                  ) : typeof value === 'object' ? (
                                    <span className="text-xs font-mono max-w-[200px] truncate block" title={JSON.stringify(value)}>
                                      {JSON.stringify(value)}
                                    </span>
                                  ) : (
                                    String(value)
                                  )}
                                </TableCell>
                              ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>All saved payment methods for this user</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPaymentMethods ? (
                  <div className="text-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading payment methods...</p>
                  </div>
                ) : !Array.isArray(paymentMethods) || paymentMethods.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No payment methods found</p>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {paymentMethods.length > 0 && Object.keys(paymentMethods[0])
                            .filter(key => !['_id', '__v', 'cardid', 'cardId', 'customerid', 'customerId', 'token', 'paymentMethodId', 'walletType', 'userid', 'userId', 'type'].includes(key))
                            .map((key) => (
                              <TableHead key={key} className="capitalize whitespace-nowrap">
                                {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                              </TableHead>
                            ))}
                          <TableHead className="whitespace-nowrap">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentMethods.map((method: any, idx: number) => (
                          <TableRow key={method._id || method.id || method.paymentMethodId || idx} data-testid={`payment-method-${method._id || method.id || idx}`}>
                            {Object.entries(method)
                              .filter(([key]) => !['_id', '__v', 'cardid', 'cardId', 'customerid', 'customerId', 'token', 'paymentMethodId', 'walletType', 'userid', 'userId'].includes(key))
                              .map(([key, value]: [string, any]) => (
                                <TableCell key={key} className="whitespace-nowrap">
                                  {value === null || value === undefined ? (
                                    <span className="text-muted-foreground">N/A</span>
                                  ) : typeof value === 'boolean' ? (
                                    <Badge variant={value ? "default" : "secondary"}>
                                      {value ? 'Yes' : 'No'}
                                    </Badge>
                                  ) : typeof value === 'object' ? (
                                    <span className="text-xs font-mono max-w-[200px] truncate block" title={JSON.stringify(value)}>
                                      {JSON.stringify(value)}
                                    </span>
                                  ) : key.toLowerCase().includes('date') || key === 'createdAt' || key === 'updatedAt' ? (
                                    new Date(value).toLocaleDateString()
                                  ) : key === 'created' && typeof value === 'number' ? (
                                    new Date(value * 1000).toLocaleDateString()
                                  ) : (
                                    String(value)
                                  )}
                                </TableCell>
                              ))}
                            <TableCell className="whitespace-nowrap">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      const isCurrentlyPrimary = method.primary === true;
                                      try {
                                        const response = await fetch(`/users/paymentmethod/${method._id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          credentials: 'include',
                                          body: JSON.stringify({ primary: !isCurrentlyPrimary })
                                        });
                                        if (response.ok) {
                                          queryClient.invalidateQueries({ queryKey: [`/users/paymentmethod/${userId}`] });
                                          toast({ title: "Success", description: isCurrentlyPrimary ? "Removed from default" : "Payment method set as default" });
                                        } else {
                                          const data = await response.json();
                                          toast({ title: "Error", description: data.error || "Failed to update default", variant: "destructive" });
                                        }
                                      } catch (error: any) {
                                        toast({ title: "Error", description: error.message || "Failed to update default", variant: "destructive" });
                                      }
                                    }}
                                  >
                                    {method.primary === true ? 'Remove Default' : 'Make Default'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      const isCurrentlyBlocked = method.status === 'blocked';
                                      try {
                                        const response = await fetch(`/users/paymentmethod/${method._id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          credentials: 'include',
                                          body: JSON.stringify({ status: isCurrentlyBlocked ? 'active' : 'blocked' })
                                        });
                                        if (response.ok) {
                                          queryClient.invalidateQueries({ queryKey: [`/users/paymentmethod/${userId}`] });
                                          toast({ title: "Success", description: `Payment method ${isCurrentlyBlocked ? 'activated' : 'deactivated'}` });
                                        } else {
                                          const data = await response.json();
                                          toast({ title: "Error", description: data.error || "Failed to update status", variant: "destructive" });
                                        }
                                      } catch (error: any) {
                                        toast({ title: "Error", description: error.message || "Failed to update status", variant: "destructive" });
                                      }
                                    }}
                                  >
                                    {method.status === 'blocked' ? 'Activate' : 'Deactivate'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={async () => {
                                      if (!confirm('Are you sure you want to delete this payment method?')) return;
                                      try {
                                        const response = await fetch(`/users/paymentmethod/${method._id}`, {
                                          method: 'DELETE',
                                          headers: { 'Content-Type': 'application/json' },
                                          credentials: 'include',
                                        });
                                        if (response.ok) {
                                          queryClient.invalidateQueries({ queryKey: [`/users/paymentmethod/${userId}`] });
                                          toast({ title: "Success", description: "Payment method deleted" });
                                        } else {
                                          const data = await response.json();
                                          toast({ title: "Error", description: data.error || "Failed to delete", variant: "destructive" });
                                        }
                                      } catch (error: any) {
                                        toast({ title: "Error", description: error.message || "Failed to delete", variant: "destructive" });
                                      }
                                    }}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
