import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Apple, Chrome, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { initializeFirebase } from "@/lib/firebase";
import { Link } from "wouter";
import type { LoginData } from "@shared/schema";
import { loginSchema } from "@shared/schema";
import { fetchWithAuth } from '@/lib/queryClient';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const { toast } = useToast();
  const { emailLogin, loginWithGoogle, loginWithApple, isLoading: authLoading } = useAuth();
  const [providers, setProviders] = useState<{ apple: boolean; google: boolean } | null>(null);
  const appleEnabled = providers?.apple === true;
  const googleEnabled = providers?.google === true;
  
  const getRedirectUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('redirect') || '/';
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refFromUrl = urlParams.get('ref');
    if (refFromUrl && !localStorage.getItem('referredBy')) {
      localStorage.setItem('referredBy', refFromUrl);
    }
    const redirectUrl = urlParams.get('redirect');
    if (redirectUrl) {
      localStorage.setItem('loginRedirect', redirectUrl);
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

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleGoogleLogin = async () => {
    if (!isFirebaseReady) {
      toast({ title: "Please wait", description: "Initializing authentication...", variant: "default" });
      return;
    }
    try {
      setIsLoading(true);
      setLoginError("");
      await loginWithGoogle();
      const redirect = localStorage.getItem('loginRedirect') || getRedirectUrl();
      localStorage.removeItem('loginRedirect');
      window.location.replace(redirect);
    } catch (error: any) {
      let errorMessage = 'Google login failed';
      
      // Handle specific auth errors
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Domain not authorized for authentication. Please contact support.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setLoginError(errorMessage);
      toast({ 
        title: "Login failed", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (!isFirebaseReady) {
      toast({ title: "Please wait", description: "Initializing authentication...", variant: "default" });
      return;
    }
    try {
      setIsLoading(true);
      setLoginError("");
      await loginWithApple();
      const redirect = localStorage.getItem('loginRedirect') || getRedirectUrl();
      localStorage.removeItem('loginRedirect');
      window.location.replace(redirect);
    } catch (error: any) {
      let errorMessage = 'Apple login failed';
      
      // Handle specific auth errors
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Domain not authorized for authentication. Please contact support.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setLoginError(errorMessage);
      toast({ 
        title: "Login failed", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    if (provider === 'Google') {
      handleGoogleLogin();
    } else if (provider === 'Apple') {
      handleAppleLogin();
    } else {
      toast({ 
        title: "Coming Soon", 
        description: `${provider} login will be available soon!`,
        variant: "default" 
      });
    }
  };

  const onSubmit = async (data: LoginData) => {
    try {
      setIsLoading(true);
      setLoginError("");
      await emailLogin(data.email, data.password);
      const redirect = localStorage.getItem('loginRedirect') || getRedirectUrl();
      localStorage.removeItem('loginRedirect');
      window.location.replace(redirect);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setLoginError(errorMessage);
      toast({ 
        title: "Login failed", 
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
      
      <div className="relative z-10 w-full max-w-lg px-4 sm:px-6 md:px-8">
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
        <Card className="shadow-2xl border border-border/50 bg-card/80 backdrop-blur-sm relative">
          {/* Loading Overlay */}
          {(authLoading || isLoading) && (
            <div className="absolute inset-0 bg-card/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg" data-testid="loading-overlay">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-foreground">Signing you in...</p>
                <p className="text-sm text-muted-foreground">Please wait while we authenticate your account</p>
              </div>
            </div>
          )}
          
          <CardHeader className="pb-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-foreground">Sign in to continue</h2>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Social Login Buttons */}
            {(googleEnabled || appleEnabled) && (
              <div className="space-y-3">
                {googleEnabled && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 !bg-white hover:!bg-[#F8F9FA] !text-[#3C4043] !border-[#DADCE0] !font-medium tracking-[0.25px] shadow-sm dark:!bg-white dark:hover:!bg-[#F8F9FA] dark:!text-[#3C4043] dark:!border-[#DADCE0]"
                    onClick={() => handleSocialLogin('Google')}
                    data-testid="button-google-login"
                  >
                    <svg className="h-[18px] w-[18px] mr-3" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path fill="#4285F4" d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9082c1.7018-1.5668 2.6841-3.874 2.6841-6.615z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9082-2.2581c-.8059.54-1.8368.859-3.0482.859-2.344 0-4.3282-1.5832-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"/>
                      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1732 0 7.5468 0 9c0 1.4532.3477 2.8268.9573 4.0418L3.964 10.71z"/>
                      <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z"/>
                    </svg>
                    Sign in with Google
                  </Button>
                )}

                {appleEnabled && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-black hover:bg-gray-900 text-white border-gray-800"
                    onClick={() => handleSocialLogin('Apple')}
                    data-testid="button-apple-login"
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
            {loginError && (
              <Alert variant="destructive" className="mb-4" data-testid="alert-login-error">
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            {/* Email/Password Form */}
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

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium py-3 rounded-lg transition-all duration-200"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? "Please wait..." : 'Log in'}
                </Button>
              </form>
            </Form>

            <div className="text-center pt-2 space-y-2">
              <Link href="/forgot-password">
                <button
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                  data-testid="link-forgot-password"
                >
                  Forgot Password?
                </button>
              </Link>
              
              <p className="text-muted-foreground text-sm">
                Don't have an account?{" "}
                <Link href="/signup">
                  <button
                    className="text-primary hover:text-primary/80 font-medium"
                    data-testid="link-signup"
                  >
                    Sign up
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