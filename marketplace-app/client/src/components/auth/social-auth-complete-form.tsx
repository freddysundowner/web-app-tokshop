import { useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, AtSign, UserCircle, Phone, Globe, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SocialAuthCompleteData } from "@shared/schema";
import { socialAuthCompleteSchema } from "@shared/schema";
import { getAllowedCountries } from "@shared/currency";
import { useSettings } from "@/lib/settings-context";
import type { User as FirebaseUser } from "firebase/auth";

interface SocialAuthCompleteFormProps {
  userEmail: string;
  socialAuthData: FirebaseUser;
  onComplete: (data: SocialAuthCompleteData) => Promise<void>;
  isLoading?: boolean;
}

export function SocialAuthCompleteForm({ userEmail, socialAuthData, onComplete, isLoading = false }: SocialAuthCompleteFormProps) {
  const [submitError, setSubmitError] = useState<string>("");
  const { toast } = useToast();
  const { settings } = useSettings();
  const allowedCodes = settings.allowed_countries ?? null;
  // When no restriction is configured this shows the full catalog; otherwise
  // only the admin-selected countries.
  const countryOptions = getAllowedCountries(allowedCodes);

  // Country is required only when a restriction is active. With no restriction
  // it stays optional, so social sign-ups aren't forced to pick a country.
  const completeSchema = useMemo(
    () =>
      allowedCodes === null
        ? socialAuthCompleteSchema
        : socialAuthCompleteSchema.extend({
            country: z.string().min(1, "Country is required"),
          }),
    [allowedCodes],
  );

  // Extract first name and last name from Firebase display name
  const firstName = socialAuthData.displayName?.split(' ')[0] || '';
  const lastName = socialAuthData.displayName?.split(' ').slice(1).join(' ') || '';

  const form = useForm<SocialAuthCompleteData>({
    resolver: zodResolver(completeSchema),
    defaultValues: {
      firstName,
      lastName,
      userName: "",
      country: "",
      phone: "",
      gender: "",
    },
  });

  const onSubmit = async (values: SocialAuthCompleteData) => {
    try {
      setSubmitError("");
      await onComplete(values);
    } catch (error: any) {
      console.error("Social auth completion failed:", error);
      const errorMessage = error?.message || "Failed to complete account setup. Please try again.";
      setSubmitError(errorMessage);
      toast({
        variant: "destructive",
        title: "Setup failed",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 overflow-hidden">
            {socialAuthData.photoURL ? (
              <img 
                src={socialAuthData.photoURL} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <UserCircle className={`h-8 w-8 text-primary ${socialAuthData.photoURL ? 'hidden' : ''}`} />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground mb-2">
            Just a few more details to finish setting up your account
          </p>
          <p className="text-xs text-muted-foreground/70">
            Signed in as: {userEmail}
          </p>
        </div>

        {/* Auth Card - Modern wider design */}
        <Card className="shadow-2xl border border-border/50 bg-card/80 backdrop-blur-sm" data-testid="card-social-auth-complete">
          <CardHeader className="pb-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground">Setup your profile</h2>
              <p className="text-muted-foreground mt-2">Choose your unique username to complete your account</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            {/* Error Alert */}
            {submitError && (
              <Alert variant="destructive" className="mb-4" data-testid="alert-submit-error">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Profile Setup Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-social-auth-complete">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="First Name"
                              className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground h-12"
                              disabled={isLoading}
                              data-testid="input-firstName"
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
                              {...field}
                              placeholder="Last Name"
                              className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground h-12"
                              disabled={isLoading}
                              data-testid="input-lastName"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="userName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            placeholder="Choose your unique username"
                            className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground h-12"
                            disabled={isLoading}
                            data-testid="input-userName"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <Select name={field.name} onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-input border-border text-foreground" data-testid="select-country">
                              <div className="flex items-center">
                                <Globe className="h-4 w-4 text-muted-foreground mr-3" />
                                <SelectValue placeholder="Select Country" />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60">
                            {countryOptions.map((c) => (
                              <SelectItem key={c.isoCode} value={c.name}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                              {...field}
                              placeholder="Phone Number (optional)"
                              className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground h-12"
                              disabled={isLoading}
                              data-testid="input-phone"
                              type="tel"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-input border-border text-foreground" data-testid="select-gender">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 text-muted-foreground mr-3" />
                              <SelectValue placeholder="Select Gender (optional)" />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium h-12 text-lg"
                  disabled={isLoading}
                  data-testid="button-complete-setup"
                >
                  {isLoading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent mr-3"></div>
                      Setting up your account...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}