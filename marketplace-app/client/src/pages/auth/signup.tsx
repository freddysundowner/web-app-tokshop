import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Apple, Chrome, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { initializeFirebase } from "@/lib/firebase";
import { Link, useLocation } from "wouter";
import type { SignupData } from "@shared/schema";
import { signupSchema } from "@shared/schema";
import { SearchableSelect, useCountryOptions } from "@/components/address-fields";
import { fetchWithAuth } from '@/lib/queryClient';

function SignupCountryField({
  value,
  onChange,
}: {
  value: string;
  onChange: (meta: any) => void;
}) {
  const options = useCountryOptions();
  return (
    <div data-testid="select-country">
      <SearchableSelect
        options={options}
        value={value}
        onChange={(opt) => onChange(opt?.meta || null)}
        placeholder="Select your country"
        searchPlaceholder="Search country..."
        emptyText="No country found"
      />
    </div>
  );
}

export default function Signup() {
  const [providers, setProviders] = useState<{ apple: boolean; google: boolean } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [referrerName, setReferrerName] = useState<string>("");
  const [referrerPhoto, setReferrerPhoto] = useState<string>("");
  const { toast } = useToast();
  const { emailSignup, loginWithGoogle, loginWithApple } = useAuth();
  const appleEnabled = providers?.apple === true;
  const googleEnabled = providers?.google === true;
  const [, setLocation] = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refFromUrl = urlParams.get('ref');
    if (refFromUrl && !localStorage.getItem('referredBy')) {
      localStorage.setItem('referredBy', refFromUrl);
    }
    const referredBy = localStorage.getItem('referredBy');
    if (referredBy) {
      fetchWithAuth(`/api/users/public/profile/${referredBy}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            const user = data.data || data;
            const name = user.userName || '';
            if (name) setReferrerName(name);
            const photo = user.profilePhoto || '';
            if (photo) setReferrerPhoto(photo.startsWith('http') ? photo : `/api/proxy-image?url=${encodeURIComponent(photo)}`);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Fetch Firebase keys on mount to initialize Firebase for auth (no token required)
  useEffect(() => {
    const fetchFirebaseKeys = async () => {
      try {
        const response = await fetchWithAuth('/api/settings/keys');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const { firebase_api_key, firebase_auth_domain, firebase_project_id, apple_login, google_login } = data.data;
            setProviders({ apple: apple_login !== false, google: google_login !== false });
            if (firebase_api_key && firebase_project_id) {
              initializeFirebase({
                apiKey: firebase_api_key,
                authDomain: firebase_auth_domain,
                projectId: firebase_project_id,
                storageBucket: '',
                appId: '',
              });
              setIsFirebaseReady(true);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch auth keys:', error);
      }
    };
    fetchFirebaseKeys();
  }, []);

  // Set default country to United States
  useEffect(() => {
    if (!selectedCountry) {
      setSelectedCountry({ id: 233, name: "United States", iso2: "US" });
    }
  }, []);

  // Extended schema with password confirmation
  const extendedSignupSchema = signupSchema.extend({
    confirmPassword: signupSchema.shape.password,
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  type ExtendedSignupData = SignupData & { confirmPassword: string };

  const form = useForm<ExtendedSignupData>({
    resolver: zodResolver(extendedSignupSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      userName: "",
      phone: "",
      country: "United States",
      password: "",
      confirmPassword: "",
    },
  });

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      setSignupError("");
      await loginWithGoogle();
      // Success handled in auth context - no premature toast
    } catch (error: any) {
      let errorMessage = 'Google signup failed';
      
      // Handle specific auth errors
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Domain not authorized for authentication. Please contact support.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSignupError(errorMessage);
      toast({ 
        title: "Signup failed", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignup = async () => {
    try {
      setIsLoading(true);
      setSignupError("");
      await loginWithApple();
      // Success handled in auth context - no premature toast
    } catch (error: any) {
      let errorMessage = 'Apple signup failed';
      
      // Handle specific auth errors
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Domain not authorized for authentication. Please contact support.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSignupError(errorMessage);
      toast({ 
        title: "Signup failed", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = (provider: string) => {
    if (provider === 'Google') {
      handleGoogleSignup();
    } else if (provider === 'Apple') {
      handleAppleSignup();
    } else {
      toast({ 
        title: "Coming Soon", 
        description: `${provider} signup will be available soon!`,
        variant: "default" 
      });
    }
  };

  const onSubmit = async (data: ExtendedSignupData) => {
    try {
      setIsLoading(true);
      setSignupError("");
      // Use the country name and ISO code from the selected country object
      const countryName = selectedCountry?.name || data.country || "";
      const countryCode = selectedCountry?.isoCode || selectedCountry?.iso2 || "";
      await emailSignup(data.email, data.password, data.firstName, data.lastName, data.userName, data.phone || "", countryName, countryCode);
      // Redirect to marketplace home after successful signup
      setLocation("/");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      setSignupError(errorMessage);
      toast({ 
        title: "Signup failed", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-lg px-4 sm:px-6 md:px-8 pt-8">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold">
              <span className="text-primary">Shop Live.</span>
              <br />
              <span className="text-accent">Stream. Sell. Connect.</span>
            </h1>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="shadow-2xl border border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-foreground">Create your account</h2>
              {referrerName && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  {referrerPhoto && (
                    <img
                      src={referrerPhoto}
                      alt={referrerName}
                      className="w-6 h-6 rounded-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <p className="text-sm text-muted-foreground">
                    Invited by <span className="font-medium text-primary">{referrerName}</span>
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Social Signup Buttons */}
            {(googleEnabled || appleEnabled) && (
              <div className="space-y-3">
                {googleEnabled && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 !bg-white hover:!bg-[#F8F9FA] !text-[#3C4043] !border-[#DADCE0] !font-medium tracking-[0.25px] shadow-sm dark:!bg-white dark:hover:!bg-[#F8F9FA] dark:!text-[#3C4043] dark:!border-[#DADCE0]"
                    onClick={() => handleSocialSignup('Google')}
                    data-testid="button-google-signup"
                  >
                    <svg className="h-[18px] w-[18px] mr-3" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path fill="#4285F4" d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9082c1.7018-1.5668 2.6841-3.874 2.6841-6.615z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9082-2.2581c-.8059.54-1.8368.859-3.0482.859-2.344 0-4.3282-1.5832-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"/>
                      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1732 0 7.5468 0 9c0 1.4532.3477 2.8268.9573 4.0418L3.964 10.71z"/>
                      <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z"/>
                    </svg>
                    Sign up with Google
                  </Button>
                )}

                {appleEnabled && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-black hover:bg-gray-900 text-white border-gray-800"
                    onClick={() => handleSocialSignup('Apple')}
                    data-testid="button-apple-signup"
                  >
                    <Apple className="h-4 w-4 mr-2" />
                    Continue with Apple
                  </Button>
                )}
              </div>
            )}

            <div className="relative">
              <Separator className="my-4" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="px-3 bg-card text-muted-foreground text-sm">or</span>
              </div>
            </div>

            {/* Error Alert */}
            {signupError && (
              <Alert variant="destructive" className="mb-4" data-testid="alert-signup-error">
                <AlertDescription>{signupError}</AlertDescription>
              </Alert>
            )}

            {/* Email/Password Signup Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="Email Address"
                            className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                            data-testid="input-email"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="First Name"
                            className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                            data-testid="input-firstname"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Last Name"
                            className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                            data-testid="input-lastname"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="userName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Username"
                            className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                            data-testid="input-username"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="tel"
                            placeholder="Phone Number (Optional)"
                            className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                            data-testid="input-phone"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormControl>
                    <SignupCountryField
                      value={selectedCountry?.isoCode || ""}
                      onChange={(meta) => {
                        setSelectedCountry(meta);
                        form.setValue("country", meta?.name || "");
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-10"
                            data-testid="input-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-10"
                            data-testid="input-confirm-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            data-testid="button-toggle-confirm-password"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium py-3 rounded-lg transition-all duration-200"
                  disabled={isLoading}
                  data-testid="button-signup"
                >
                  {isLoading ? "Creating account..." : 'Create Account'}
                </Button>
              </form>
            </Form>

            <div className="text-center pt-2">
              <p className="text-muted-foreground text-sm">
                Already have an account?{" "}
                <Link href="/login">
                  <button
                    className="text-primary hover:text-primary/80 font-medium"
                    data-testid="link-login"
                  >
                    Sign in
                  </button>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-muted-foreground text-sm">
          <p>Need help? Contact our support team</p>
        </div>
      </div>
    </div>
  );
}