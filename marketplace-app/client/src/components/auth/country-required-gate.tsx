import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { COUNTRIES } from "@/lib/countries";

export function CountryRequiredGate() {
  const { updateCountry, logout } = useAuth();
  const { toast } = useToast();
  const [country, setCountry] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  const handleSubmit = async () => {
    if (!country) {
      setSubmitError("Please select your country to continue.");
      return;
    }

    try {
      setSubmitError("");
      setIsSaving(true);
      await updateCountry(country);
      toast({
        title: "Country saved",
        description: "Thanks! You're all set.",
      });
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to save your country. Please try again.";
      setSubmitError(errorMessage);
      toast({
        variant: "destructive",
        title: "Could not save country",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Select your country
          </h1>
          <p className="text-muted-foreground">
            We need to know your country before you can continue using the app.
          </p>
        </div>

        <Card className="shadow-2xl border border-border/50 bg-card/80 backdrop-blur-sm" data-testid="card-country-gate">
          <CardHeader className="pb-2" />
          <CardContent className="space-y-6 pb-8 pt-6">
            {submitError && (
              <Alert variant="destructive" data-testid="alert-country-error">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <Select value={country} onValueChange={setCountry} disabled={isSaving}>
              <SelectTrigger className="h-12 bg-input border-border text-foreground" data-testid="select-country-gate">
                <div className="flex items-center">
                  <Globe className="h-4 w-4 text-muted-foreground mr-3" />
                  <SelectValue placeholder="Select Country" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium h-12 text-lg"
              disabled={isSaving}
              data-testid="button-save-country"
            >
              {isSaving ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent mr-3" />
                  Saving...
                </>
              ) : (
                "Continue"
              )}
            </Button>

            <button
              type="button"
              onClick={() => logout()}
              disabled={isSaving}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-logout-country-gate"
            >
              Log out
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
