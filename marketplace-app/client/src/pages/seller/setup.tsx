import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchWithAuth, queryClient } from '@/lib/queryClient';
import {
  MapPin,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Check,
  Clock
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SearchableSelect,
  useCountryOptions,
  useStateOptions,
  useCityOptions,
} from "@/components/address-fields";

interface Step {
  id: 'address' | 'bank' | 'complete';
  title: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 'address', title: 'Address', description: 'Shipping information' },
  { id: 'bank', title: 'Bank Account', description: 'Payout setup' },
  { id: 'complete', title: 'Complete', description: 'Finish setup' },
];

// Country-specific bank-account field schemas for Stripe Connect payouts.
type BankFieldKind = 'iban' | 'account_routing' | 'account_sort' | 'account_bsb' | 'account_transit_institution';
interface BankSchema {
  kind: BankFieldKind;
  currency: string;
  accountLabel: string;
  accountPlaceholder: string;
  accountMaxLength?: number;
  routingLabel?: string;       // Generic "routing-style" code field (US routing / UK sort / AU BSB / CA transit)
  routingPlaceholder?: string;
  routingMaxLength?: number;
  ibanLabel?: string;
  ibanPlaceholder?: string;
  showSsn?: boolean;
  ssnLabel?: string;
}

const SEPA_COUNTRIES = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT',
  'LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','NO','CH','LI','IS',
]);

function getBankSchema(countryCode?: string): BankSchema {
  const cc = (countryCode || 'US').toUpperCase();
  if (cc === 'GB') {
    return {
      kind: 'account_sort',
      currency: 'gbp',
      accountLabel: 'Account Number',
      accountPlaceholder: '00012345',
      accountMaxLength: 8,
      routingLabel: 'Sort Code',
      routingPlaceholder: '108800',
      routingMaxLength: 6,
    };
  }
  if (cc === 'AU') {
    return {
      kind: 'account_bsb',
      currency: 'aud',
      accountLabel: 'Account Number',
      accountPlaceholder: '000123456',
      routingLabel: 'BSB',
      routingPlaceholder: '062-000',
      routingMaxLength: 7,
    };
  }
  if (cc === 'CA') {
    return {
      kind: 'account_transit_institution',
      currency: 'cad',
      accountLabel: 'Account Number',
      accountPlaceholder: '000123456789',
      routingLabel: 'Transit Number',
      routingPlaceholder: '11000',
      routingMaxLength: 5,
    };
  }
  if (SEPA_COUNTRIES.has(cc)) {
    return {
      kind: 'iban',
      currency: 'eur',
      accountLabel: 'IBAN',
      accountPlaceholder: 'DE89370400440532013000',
      ibanLabel: 'IBAN',
      ibanPlaceholder: 'DE89370400440532013000',
    };
  }
  // Default: United States
  return {
    kind: 'account_routing',
    currency: 'usd',
    accountLabel: 'Account Number',
    accountPlaceholder: '000123456789',
    routingLabel: 'Routing Number',
    routingPlaceholder: '110000000',
    routingMaxLength: 9,
    showSsn: true,
    ssnLabel: 'SSN Last 4 Digits',
  };
}

export default function SellerSetup() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<'address' | 'bank' | 'complete'>('address');
  
  // Address form state
  const [streetAddress, setStreetAddress] = useState("");
  const [streetAddress2, setStreetAddress2] = useState("");
  const [country, setCountry] = useState<any>(null);
  const [state, setState] = useState<any>(null);
  const [city, setCity] = useState<any>(null);
  const [cityFreeText, setCityFreeText] = useState("");
  const [hasCityOptions, setHasCityOptions] = useState<boolean | null>(null);
  const [zipCode, setZipCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Bank account form state
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState(""); // US routing / UK sort code / AU BSB / CA transit
  const [institutionNumber, setInstitutionNumber] = useState(""); // CA only
  const [iban, setIban] = useState(""); // EU / SEPA countries
  const [ssnLast4, setSsnLast4] = useState(""); // US only
  const [bankPhoneNumber, setBankPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const userId = (user as any)?._id || user?.id;
  
  // Fetch fresh user data to check current seller/applied_seller status
  const { data: freshUserData, isLoading: userLoading } = useQuery<any>({
    queryKey: [`/api/profile/${userId}`],
    enabled: !!userId,
  });
  
  // Check if user already has an address
  const { data: existingAddress, isLoading: addressLoading } = useQuery<{ address: any | null }>({
    queryKey: [`/api/address/default/address/${userId}`],
    enabled: !!userId,
  });

  // Set US as default on mount
  useEffect(() => {
    if (!country) {
      setCountry({ name: "United States", isoCode: "US", iso2: "US" });
    }
  }, []);

  const countryOptions = useCountryOptions();
  const stateOptions = useStateOptions(country?.isoCode);
  const cityOptions = useCityOptions(country?.isoCode, state?.isoCode);

  // Some regions (e.g. UK Northern Ireland districts) have no cities in the
  // dataset, so we fall back to a free-text input.
  useEffect(() => {
    if (!country?.isoCode || !state?.isoCode) {
      setHasCityOptions(null);
      return;
    }
    setHasCityOptions(cityOptions.length > 0);
  }, [country?.isoCode, state?.isoCode, cityOptions.length]);

  // Skip address step if user already has one
  useEffect(() => {
    if (existingAddress?.address) {
      setCurrentStep('bank');
    }
  }, [existingAddress]);

  // Use fresh user data instead of cached auth context
  const currentUser = freshUserData || user;

  // Resolve the seller's country (from saved address or selected on the address step)
  // and look up the matching bank-account schema.
  const bankCountryCode = (
    existingAddress?.address?.countryCode ||
    (user as any)?.address?.countryCode ||
    country?.iso2 ||
    'US'
  ).toUpperCase();
  const bankSchema = useMemo(() => getBankSchema(bankCountryCode), [bankCountryCode]);
  
  // Check if user has already applied and is waiting for approval
  const appliedSeller = currentUser?.applied_seller;
  const isSeller = currentUser?.seller;

  // Redirect sellers to homepage - they don't need setup
  useEffect(() => {
    if (isSeller && !userLoading) {
      setLocation('/marketplace');
    }
  }, [isSeller, userLoading, setLocation]);

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetchWithAuth('/api/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        // Check multiple possible error field names
        const errorMessage = errorData.error || errorData.message || 'Failed to save address';
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Address Saved",
        description: "Your address has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/address/default/address'] });
      setCurrentStep('bank');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save address",
        variant: "destructive",
      });
    },
  });

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const cityName = (hasCityOptions === false) ? cityFreeText.trim() : city?.name;
    if (!streetAddress || !country || !state || !cityName || !zipCode || !phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const addressData = {
      name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Default',
      addrress1: streetAddress,
      addrress2: streetAddress2,
      country: country.name,
      city: cityName,
      countryCode: country.isoCode || country.iso2,
      zipcode: zipCode,
      state: state.name,
      stateCode: state.isoCode || state.state_code || state.iso2,
      userId: userId,
      phone: phoneNumber.trim().replace(/\s/g, ''),
      email: user?.email || '',
      primary: false,
      applying: false,
    };

    createAddressMutation.mutate(addressData);
  };

  // Create bank account mutation
  const createBankAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetchWithAuth(`/api/stripe/connect/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to create Stripe account');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success === false) {
        toast({
          title: "Error",
          description: data.error || "Failed to create Stripe account",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Bank Account Connected",
        description: "Your bank account has been connected successfully.",
      });
      
      // Refetch user profile to get updated applied_seller status
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${userId}`] });
      
      setCurrentStep('complete');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Country-aware validation
    const cleanAccount = accountNumber.replace(/\s/g, '');
    const cleanRouting = routingNumber.replace(/[\s-]/g, '');
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    const cleanInstitution = institutionNumber.replace(/\s/g, '');

    let bankValid = false;
    if (bankSchema.kind === 'iban') {
      bankValid = cleanIban.length >= 15;
    } else if (bankSchema.kind === 'account_transit_institution') {
      bankValid = !!cleanAccount && !!cleanRouting && !!cleanInstitution;
    } else if (bankSchema.kind === 'account_routing' || bankSchema.kind === 'account_sort' || bankSchema.kind === 'account_bsb') {
      bankValid = !!cleanAccount && !!cleanRouting;
      if (bankSchema.showSsn && !ssnLast4) bankValid = false;
    }

    if (!bankValid || !bankPhoneNumber || !dateOfBirth) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check age requirement (must be 18+)
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const isOver18 = age > 18 || (age === 18 && monthDiff >= 0);
    
    if (!isOver18) {
      toast({
        title: "Age Requirement",
        description: "You must be at least 18 years old to become a seller.",
        variant: "destructive",
      });
      return;
    }

    // Parse date of birth
    const dob = new Date(dateOfBirth);
    
    // Get user address (either from existing address or from the form we just filled)
    const userAddress = existingAddress?.address || user?.address;
    
    // Build payload matching Flutter structure
    const payload = {
      country: bankCountryCode,
      currency: bankSchema.currency,
      account_number: bankSchema.kind === 'iban' ? cleanIban : cleanAccount,
      city: userAddress?.city || city?.name || (cityFreeText.trim() || null),
      state: userAddress?.state || state?.name || state,
      day: dob.getDate().toString(),
      month: (dob.getMonth() + 1).toString(),
      year: dob.getFullYear().toString(),
      line1: userAddress?.addrress1 || userAddress?.address1 || streetAddress,
      line2: userAddress?.addrress2 || userAddress?.address2 || streetAddress2 || "",
      postal_code: userAddress?.zipcode || zipCode,
      countryCode: userAddress?.countryCode || country?.iso2 || bankCountryCode,
      phone: bankPhoneNumber,
      email: user?.email || '',
      name: user?.firstName || '',
      first_name: user?.firstName || '',
      last_name: user?.lastName || '',
      create_address: !userAddress,
      account_holder_name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      ...(bankSchema.kind === 'account_routing' ? { routing_number: cleanRouting } : {}),
      ...(bankSchema.kind === 'account_sort' ? { sort_code: cleanRouting, routing_number: cleanRouting } : {}),
      ...(bankSchema.kind === 'account_bsb' ? { bsb_number: cleanRouting, routing_number: cleanRouting } : {}),
      ...(bankSchema.kind === 'account_transit_institution'
        ? { transit_number: cleanRouting, institution_number: cleanInstitution, routing_number: `${cleanRouting}-${cleanInstitution}` }
        : {}),
      ...(bankSchema.showSsn ? { ssn_last_4: ssnLast4 } : {}),
    };

    createBankAccountMutation.mutate(payload);
  };

  const handleFinishSetup = () => {
    if (user?.seller) {
      setLocation('/seller/hub');
    } else {
      toast({
        title: "Application Submitted",
        description: "Your seller application is being reviewed. You'll be notified once approved.",
      });
      setLocation('/marketplace');
    }
  };

  if (addressLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If already applied but not approved, show review in progress page
  if (appliedSeller && !isSeller) {
    return (
      <div className="py-4 sm:py-6 lg:py-8 w-full" data-testid="page-seller-review">
        <div className="px-4 sm:px-6 lg:px-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-6 py-8">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-3">
                    Application Under Review
                  </h2>
                  <p className="text-muted-foreground text-base mb-2">
                    Your seller application is currently being reviewed by our team.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    We'll notify you via email at <span className="font-medium text-foreground">{currentUser?.email}</span> once your account is approved.
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-left">
                      <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1 text-sm">
                        What happens next?
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Our team typically reviews applications within 1-2 business days. Once approved, you'll be able to list products, host live shows, and start selling on {settings.app_name}.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    onClick={() => setLocation('/marketplace')}
                    variant="outline"
                    size="lg"
                    data-testid="button-back-to-marketplace"
                  >
                    Return to Marketplace
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getCurrentStepIndex = () => {
    if (existingAddress?.address) {
      return STEPS.findIndex(s => s.id === currentStep);
    }
    return STEPS.findIndex(s => s.id === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="py-4 sm:py-6 lg:py-8 w-full" data-testid="page-seller-setup">
      {/* Header */}
      <div className="mb-6 sm:mb-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" data-testid="heading-seller-setup">
          Complete Seller Setup
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Set up your seller account to start selling on {settings.app_name}
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            // Skip address step in display if user has address
            if (step.id === 'address' && existingAddress?.address) {
              return null;
            }
            
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex || (step.id === 'address' && existingAddress?.address);
            const adjustedIndex = existingAddress?.address && step.id !== 'address' ? index - 1 : index;
            const totalSteps = existingAddress?.address ? STEPS.length - 1 : STEPS.length;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`flex items-center justify-center h-10 w-10 rounded-full border-2 transition-colors ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'bg-background border-muted-foreground/30 text-muted-foreground'
                  }`}>
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{adjustedIndex + 1}</span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-xs sm:text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {adjustedIndex < totalSteps - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 transition-colors ${
                    isCompleted ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Step 1: Address */}
        {currentStep === 'address' && !existingAddress?.address && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
              <CardDescription>
                Enter your primary shipping address for order fulfillment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="street-address">Street Address *</Label>
                  <Input
                    id="street-address"
                    placeholder="123 Main Street"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    required
                    data-testid="input-street-address"
                  />
                </div>

                <div>
                  <Label htmlFor="street-address-2">Street Address 2 (Optional)</Label>
                  <Input
                    id="street-address-2"
                    placeholder="Apt, Suite, Unit, etc."
                    value={streetAddress2}
                    onChange={(e) => setStreetAddress2(e.target.value)}
                    data-testid="input-street-address-2"
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <SearchableSelect
                    options={countryOptions}
                    value={country?.isoCode || ""}
                    onChange={(opt) => {
                      setCountry(opt?.meta || null);
                      setState(null);
                      setCity(null);
                      setCityFreeText("");
                      setHasCityOptions(null);
                    }}
                    placeholder="Select Country"
                    searchPlaceholder="Search country..."
                    emptyText="No country found"
                    testId="select-country"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">State/Province *</Label>
                    <SearchableSelect
                      options={stateOptions}
                      value={state?.isoCode || ""}
                      onChange={(opt) => {
                        setState(opt?.meta || null);
                        setCity(null);
                        setCityFreeText("");
                        setHasCityOptions(null);
                      }}
                      placeholder={country ? "Select State" : "Select country first"}
                      searchPlaceholder="Search state..."
                      emptyText="No state found"
                      disabled={!country || stateOptions.length === 0}
                      testId="select-state"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City *</Label>
                    {hasCityOptions === false ? (
                      <Input
                        id="city"
                        value={cityFreeText}
                        onChange={(e) => setCityFreeText(e.target.value)}
                        placeholder="Enter your city"
                        data-testid="input-city-freetext"
                      />
                    ) : (
                      <SearchableSelect
                        options={cityOptions}
                        value={city?.name || ""}
                        onChange={(opt) => setCity(opt?.meta || null)}
                        placeholder={state ? "Enter your city" : "Select state first"}
                        searchPlaceholder="Search city..."
                        emptyText="No city found"
                        disabled={!state}
                        testId="select-city"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="zip">ZIP/Postal Code *</Label>
                  <Input
                    id="zip"
                    placeholder="10001"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    required
                    data-testid="input-zip"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    data-testid="input-phone"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createAddressMutation.isPending}
                    data-testid="button-save-address"
                  >
                    {createAddressMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Bank Account Setup */}
        {currentStep === 'bank' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Where do you want to withdraw your earnings to?
              </CardTitle>
              <CardDescription>
                Enter your bank account details to receive seller payouts
                {bankCountryCode && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Showing fields for {bankCountryCode} ({bankSchema.currency.toUpperCase()} payouts)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBankSubmit} className="space-y-4">
                {bankSchema.kind === 'iban' ? (
                  <div>
                    <Label htmlFor="iban">{bankSchema.ibanLabel} *</Label>
                    <Input
                      id="iban"
                      placeholder={bankSchema.ibanPlaceholder}
                      value={iban}
                      onChange={(e) => setIban(e.target.value.toUpperCase())}
                      required
                      data-testid="input-iban"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="account-number">{bankSchema.accountLabel} *</Label>
                      <Input
                        id="account-number"
                        placeholder={bankSchema.accountPlaceholder}
                        maxLength={bankSchema.accountMaxLength}
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        required
                        data-testid="input-account-number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="routing-number">{bankSchema.routingLabel} *</Label>
                      <Input
                        id="routing-number"
                        placeholder={bankSchema.routingPlaceholder}
                        maxLength={bankSchema.routingMaxLength}
                        value={routingNumber}
                        onChange={(e) => setRoutingNumber(e.target.value)}
                        required
                        data-testid="input-routing-number"
                      />
                    </div>

                    {bankSchema.kind === 'account_transit_institution' && (
                      <div>
                        <Label htmlFor="institution-number">Institution Number *</Label>
                        <Input
                          id="institution-number"
                          placeholder="000"
                          maxLength={3}
                          value={institutionNumber}
                          onChange={(e) => setInstitutionNumber(e.target.value.replace(/\D/g, ''))}
                          required
                          data-testid="input-institution-number"
                        />
                      </div>
                    )}

                    {bankSchema.showSsn && (
                      <div>
                        <Label htmlFor="ssn-last4">{bankSchema.ssnLabel} *</Label>
                        <Input
                          id="ssn-last4"
                          placeholder="0000"
                          maxLength={4}
                          value={ssnLast4}
                          onChange={(e) => setSsnLast4(e.target.value.replace(/\D/g, ''))}
                          required
                          data-testid="input-ssn-last4"
                        />
                      </div>
                    )}
                  </>
                )}

                <div>
                  <Label htmlFor="bank-phone">Phone Number *</Label>
                  <Input
                    id="bank-phone"
                    type="tel"
                    placeholder="+17297409480"
                    value={bankPhoneNumber}
                    onChange={(e) => setBankPhoneNumber(e.target.value)}
                    required
                    data-testid="input-bank-phone"
                  />
                </div>

                <div>
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                    data-testid="input-dob"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  {!existingAddress?.address && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('address')}
                      type="button"
                      data-testid="button-back"
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createBankAccountMutation.isPending}
                    data-testid="button-save-bank"
                  >
                    {createBankAccountMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save and Continue'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Complete */}
        {currentStep === 'complete' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4 py-8">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Setup Complete!
                  </h2>
                  <p className="text-muted-foreground">
                    {user?.seller 
                      ? "Your seller account is ready. Start listing products and hosting shows!"
                      : "Your application has been submitted. An admin will review your account and contact you soon."}
                  </p>
                </div>
                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    onClick={handleFinishSetup}
                    size="lg"
                    data-testid="button-finish-setup"
                  >
                    {user?.seller ? 'Go to Seller Hub' : 'Return to Marketplace'}
                  </Button>
                  {!user?.seller && (
                    <p className="text-sm text-muted-foreground">
                      We'll email you at <span className="font-medium">{user?.email}</span> once your account is approved.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
