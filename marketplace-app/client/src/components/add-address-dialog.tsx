import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/queryClient';
import {
  SearchableSelect,
  useCountryOptions,
  useStateOptions,
  useCityOptions,
  findCountry,
  findState,
} from '@/components/address-fields';

interface AddAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  address?: any;
}

export function AddAddressDialog({
  open,
  onOpenChange,
  onSuccess,
  address,
}: AddAddressDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const userData = user as any;
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!address;

  const [streetAddress, setStreetAddress] = useState("");
  const [streetAddress2, setStreetAddress2] = useState("");

  const [countryData, setCountryData] = useState<any>(null);
  const [stateData, setStateData] = useState<any>(null);
  const [cityData, setCityData] = useState<any>(null);
  const [cityFreeText, setCityFreeText] = useState("");

  const countryOptions = useCountryOptions();
  const stateOptions = useStateOptions(countryData?.isoCode);
  const cityOptions = useCityOptions(countryData?.isoCode, stateData?.isoCode);

  const hasCities = cityOptions.length > 0;
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "",
    message: "",
  });

  const [zipCode, setZipCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;

    if (address) {
      setName(address.name || "");
      setStreetAddress(address.addrress1 || address.address1 || "");
      setStreetAddress2(address.addrress2 || address.address2 || "");
      setZipCode(address.zipcode || address.zip || "");
      setPhoneNumber(address.phone || "");
      // Re-hydrate country/state/city from the saved address when editing
      const savedCountry = findCountry(address.countryCode || address.country);
      if (savedCountry) {
        setCountryData({ name: savedCountry.name, isoCode: savedCountry.isoCode });
        const savedState = findState(savedCountry.isoCode, address.stateCode || address.state);
        if (savedState) {
          setStateData({ name: savedState.name, isoCode: savedState.isoCode });
        } else if (address.state) {
          setStateData({ name: address.state, isoCode: "" });
        }
        if (address.city) {
          setCityData({ name: address.city });
          setCityFreeText(address.city);
        }
      }
    } else {
      setName("");
      setStreetAddress("");
      setStreetAddress2("");
      // Default the country to the user's account country for new addresses
      const userCountry = findCountry(user?.countryCode || user?.country);
      setCountryData(userCountry ? { name: userCountry.name, isoCode: userCountry.isoCode } : null);
      setStateData(null);
      setCityData(null);
      setCityFreeText("");
      setZipCode("");
      setPhoneNumber("");
    }
  }, [address, open, user]);

  const handleAddAddress = async () => {
    const resolvedCity = cityData?.name || cityFreeText.trim();
    if (!streetAddress || !countryData || !stateData || !resolvedCity || !zipCode || !phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const addressData = {
        name: name || userData?.firstName || 'Default',
        addrress1: streetAddress,
        addrress2: streetAddress2,
        country: countryData.name,
        city: resolvedCity,
        countryCode: countryData.isoCode,
        zipcode: zipCode,
        state: stateData.name,
        stateCode: stateData.isoCode,
        userId: userData?.id,
        phone: phoneNumber.trim().replace(/\s/g, ''),
        email: userData?.email || '',
        primary: address?.primary || false,
        applying: false,
      };

      if (isEditing && address._id) {
        await apiRequest('PUT', `/api/address/${address._id}`, addressData);
        toast({
          title: "Address Updated",
          description: "Your shipping address has been updated successfully.",
        });
      } else {
        await apiRequest('POST', '/api/address', addressData);
        toast({
          title: "Address Added",
          description: "Your shipping address has been saved successfully.",
        });
      }

      setStreetAddress("");
      setStreetAddress2("");
      setCountryData(null);
      setStateData(null);
      setCityData(null);
      setCityFreeText("");
      setZipCode("");
      setPhoneNumber("");
      setName("");

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to add/update address:', error);

      let errorMessage = isEditing
        ? "Failed to update address. Please try again."
        : "Failed to add address. Please try again.";
      let errorTitle = "Error";

      let rawMessage = "";
      if (error?.text) {
        try {
          const errorData = JSON.parse(error.text);
          rawMessage = errorData.error || errorData.message || "";
        } catch (e) {
          if (typeof error.text === 'string') rawMessage = error.text;
        }
      } else if (error?.message) {
        rawMessage = error.message;
      }

      const lower = rawMessage.toLowerCase();
      if (lower.includes("missing_secondary") || lower.includes("missing secondary") || lower.includes("apartment, suite")) {
        errorTitle = "Apartment or unit number needed";
        errorMessage = "This building has multiple flats or units. Please add your flat, apartment or suite number in the Street Address 2 field.";
      } else if (lower.includes("address_not_found") || lower.includes("not found in the database") || lower.includes("invalid address")) {
        errorTitle = "Address not found";
        errorMessage = "We couldn't find this address. Please check the street, city and postcode and try again.";
      } else if (lower.includes("postal_code") || lower.includes("zip") || lower.includes("postcode")) {
        errorTitle = "Check your postcode";
        errorMessage = "The postcode doesn't match the city or state. Please double-check it.";
      } else if (rawMessage) {
        errorMessage = rawMessage;
      }

      setErrorDialog({ open: true, title: errorTitle, message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 flex flex-col overflow-hidden w-screen h-[100dvh] max-w-none max-h-none rounded-none border-0 translate-x-0 translate-y-0 left-0 top-0 shadow-none max-sm:!duration-150 max-sm:[--tw-enter-translate-x:0px] max-sm:[--tw-enter-translate-y:0px] max-sm:[--tw-enter-scale:1] max-sm:[--tw-exit-translate-x:0px] max-sm:[--tw-exit-translate-y:0px] max-sm:[--tw-exit-scale:1] sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-full sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:border sm:shadow-lg"
        data-testid="dialog-add-address"
      >
        <DialogHeader className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b sm:border-b-0 bg-background z-10">
          <DialogTitle className="text-lg">{isEditing ? "Edit Address" : "Add New Address"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your shipping address." : "Add a new shipping or billing address."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6">
          {errorDialog.open && (
            <div
              role="alert"
              className="mt-3 rounded-md border border-destructive bg-destructive/10 p-3 text-sm"
              data-testid="banner-address-error"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-destructive">{errorDialog.title}</p>
                  <p className="mt-1 text-destructive/90">{errorDialog.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorDialog((s) => ({ ...s, open: false }))}
                  className="text-destructive/70 hover:text-destructive"
                  aria-label="Dismiss"
                  data-testid="button-dismiss-error"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="street-address" className="text-sm font-medium">Street Address</Label>
              <Input
                id="street-address"
                placeholder="123 Main Street"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                data-testid="input-street-address"
                autoComplete="address-line1"
                className="h-12 text-base sm:h-10 sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street-address-2" className="text-sm font-medium">Street Address 2 (Optional)</Label>
              <Input
                id="street-address-2"
                placeholder="Apt, Suite, Unit, etc."
                value={streetAddress2}
                onChange={(e) => setStreetAddress2(e.target.value)}
                data-testid="input-street-address-2"
                autoComplete="address-line2"
                className="h-12 text-base sm:h-10 sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Country</Label>
              <SearchableSelect
                options={countryOptions}
                value={countryData?.isoCode || ""}
                onChange={(opt) => {
                  setCountryData(opt?.meta || null);
                  setStateData(null);
                  setCityData(null);
                  setCityFreeText("");
                }}
                placeholder="Select country"
                searchPlaceholder="Search country..."
                emptyText="No country found"
                testId="select-country"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">State/Province</Label>
                <SearchableSelect
                  options={stateOptions}
                  value={stateData?.isoCode || ""}
                  onChange={(opt) => {
                    setStateData(opt?.meta || null);
                    setCityData(null);
                    setCityFreeText("");
                  }}
                  placeholder={countryData ? "Select state" : "Select country first"}
                  searchPlaceholder="Search state..."
                  emptyText="No state found"
                  disabled={!countryData || stateOptions.length === 0}
                  testId="select-state"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">City</Label>
                {hasCities ? (
                  <SearchableSelect
                    options={cityOptions}
                    value={cityData?.name || ""}
                    onChange={(opt) => {
                      setCityData(opt?.meta || null);
                      setCityFreeText("");
                    }}
                    placeholder={stateData ? "Select city" : "Select state first"}
                    searchPlaceholder="Search city..."
                    emptyText="No city found"
                    disabled={!stateData}
                    testId="select-city"
                  />
                ) : (
                  <Input
                    id="city-free-text"
                    placeholder="Enter your city"
                    value={cityFreeText}
                    onChange={(e) => {
                      setCityFreeText(e.target.value);
                      setCityData(null);
                    }}
                    data-testid="input-city"
                    autoComplete="address-level2"
                    className="h-12 text-base sm:h-10 sm:text-sm"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zip" className="text-sm font-medium">ZIP/Postal Code</Label>
                <Input
                  id="zip"
                  placeholder="10001"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  data-testid="input-zip"
                  inputMode="text"
                  autoComplete="postal-code"
                  className="h-12 text-base sm:h-10 sm:text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  data-testid="input-phone"
                  inputMode="tel"
                  autoComplete="tel"
                  className="h-12 text-base sm:h-10 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter
          className="shrink-0 flex-col-reverse sm:flex-row gap-2 px-4 sm:px-6 py-3 border-t bg-background"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            data-testid="button-cancel"
            className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddAddress}
            disabled={isLoading}
            data-testid="button-add-address"
            className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (isEditing ? "Updating..." : "Adding...") : (isEditing ? "Update Address" : "Add Address")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddAddressDialog;
