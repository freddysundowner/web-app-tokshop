import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

export function AgeVerificationDialog() {
  const { user, logout, refreshUserData } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Only perform age verification if agerestricted is enabled in settings
    if (!settings.agerestricted) {
      console.log('[AgeVerification] Age restriction disabled in settings');
      return;
    }

    if (!user) {
      console.log('[AgeVerification] No user logged in');
      return;
    }

    console.log('[AgeVerification] User data:', {
      userId: user.id,
      date_of_birth: user.date_of_birth,
      hasDateOfBirth: !!user.date_of_birth
    });

    // Check if user has set date_of_birth
    if (!user.date_of_birth) {
      console.log('[AgeVerification] No date_of_birth found - showing dialog');
      setShowDialog(true);
      return;
    }

    // Calculate age
    const birthDate = new Date(user.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred this year yet
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    console.log('[AgeVerification] Age calculated:', {
      birthDate: user.date_of_birth,
      age,
      isOver18: age >= 18
    });

    // If under 18, log them out immediately
    if (age < 18) {
      console.log('[AgeVerification] User is under 18 - logging out');
      toast({
        title: "Age Requirement Not Met",
        description: "You must be at least 18 years old to use this platform.",
        variant: "destructive",
      });
      
      setTimeout(() => {
        logout();
      }, 2000);
    } else {
      console.log('[AgeVerification] User is 18+ - no action needed');
    }
  }, [user, logout, toast, settings.agerestricted]);

  const handleSubmit = async () => {
    if (!dateOfBirth) {
      toast({
        title: "Date Required",
        description: "Please enter your date of birth to continue.",
        variant: "destructive",
      });
      return;
    }

    // Validate date format and that it's not in the future
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    if (isNaN(birthDate.getTime())) {
      toast({
        title: "Invalid Date",
        description: "Please enter a valid date.",
        variant: "destructive",
      });
      return;
    }

    if (birthDate > today) {
      toast({
        title: "Invalid Date",
        description: "Date of birth cannot be in the future.",
        variant: "destructive",
      });
      return;
    }

    // Calculate age
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Check if under 18
    if (age < 18) {
      toast({
        title: "Age Requirement Not Met",
        description: "You must be at least 18 years old to use this platform.",
        variant: "destructive",
      });
      
      setTimeout(() => {
        logout();
      }, 2000);
      return;
    }

    // Update user profile with date of birth
    try {
      setIsSubmitting(true);
      
      const userId = user?.id;
      if (!userId) {
        throw new Error('User ID not found');
      }

      const response = await apiRequest('PUT', `/api/users/${userId}`, {
        date_of_birth: dateOfBirth,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update date of birth');
      }

      // Update localStorage with new user data
      if (result.data) {
        const currentUser = localStorage.getItem('user');
        if (currentUser) {
          const updatedUser = {
            ...JSON.parse(currentUser),
            date_of_birth: dateOfBirth,
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }

      // Refresh user data
      await refreshUserData();

      toast({
        title: "Date of Birth Set",
        description: "Your date of birth has been recorded.",
      });

      setShowDialog(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update';
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={showDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Age Verification Required</AlertDialogTitle>
          <AlertDialogDescription>
            To continue using this platform, please provide your date of birth. You must be at least 18 years old.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-2 py-4">
          <Label htmlFor="date-of-birth">Date of Birth</Label>
          <Input
            id="date-of-birth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            disabled={isSubmitting}
            data-testid="input-date-of-birth"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={isSubmitting || !dateOfBirth}
            data-testid="button-submit-dob"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Continue'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
