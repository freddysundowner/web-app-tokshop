import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Save, Camera, User, Mail, Phone, MapPin, Edit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { getFirebaseStorage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// Profile update schema
const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  userName: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional().refine((phone) => {
    if (!phone || phone === '') return true;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4,6}$|^[\+]?[0-9]{8,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }, "Please enter a valid phone number"),
  country: z.string().min(1, "Country is required"),
  date_of_birth: z.string().optional().refine((date) => {
    if (!date || date === '') return true;
    const birthDate = new Date(date);
    return !isNaN(birthDate.getTime()) && birthDate <= new Date();
  }, "Please enter a valid date"),
});

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [updateError, setUpdateError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, refreshUserData } = useAuth();
  
  const userId = (user as any)?._id || user?.id;
  
  // Fetch fresh user data to always show latest profile photo
  const { data: freshUserData } = useQuery<any>({
    queryKey: [`/api/profile/${userId}`],
    enabled: !!userId,
    staleTime: 0, // Always fetch fresh data
  });
  
  // Use fresh data if available, otherwise fall back to cached user
  const currentUser = freshUserData || user;

  const form = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      userName: user?.userName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      country: user?.country || "",
      date_of_birth: user?.date_of_birth || "",
    },
  });

  const isSocialLogin = user?.authProvider === 'google' || user?.authProvider === 'apple';

  const onSubmit = async (data: ProfileUpdateData) => {
    try {
      setIsLoading(true);
      setUpdateError("");
      
      // Call profile update API
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      // Update localStorage with new user data
      if (result.data) {
        const currentUser = localStorage.getItem('user');
        if (currentUser) {
          const updatedUser = {
            ...JSON.parse(currentUser),
            ...result.data,
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
      
      toast({ 
        title: "Profile updated", 
        description: "Your profile has been successfully updated." 
      });
      
      setIsEditing(false);
      
      // Reload to reflect changes
      window.location.reload();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setUpdateError(errorMessage);
      toast({ 
        title: "Update failed", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
    setUpdateError("");
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploadingImage(true);
      setUploadProgress(0);

      // Get Firebase Storage instance
      const storage = getFirebaseStorage();
      
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `profile-images/${user?.id || 'unknown'}_${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);

      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          // Handle upload errors
          console.error('Upload error:', error);
          toast({
            title: "Upload failed",
            description: error.message || "Failed to upload image",
            variant: "destructive"
          });
          setIsUploadingImage(false);
          setUploadProgress(0);
        },
        async () => {
          // Upload completed successfully, get download URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Image uploaded successfully:', downloadURL);

            // Update user profile with new image URL
            const response = await fetch('/api/users/profile', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ profilePhoto: downloadURL }),
            });

            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.error || 'Failed to update profile photo');
            }

            // Update localStorage with new user data
            if (result.data) {
              const currentUser = localStorage.getItem('user');
              if (currentUser) {
                const updatedUser = {
                  ...JSON.parse(currentUser),
                  ...result.data,
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
              }
            }

            // Invalidate all profile-related queries to refresh the UI
            const userId = (user as any)?._id || user?.id;
            queryClient.invalidateQueries({ queryKey: ['/api/profile', userId] });
            queryClient.invalidateQueries({ queryKey: [`/api/profile/${userId}`] });
            
            // Refresh auth context to update user data everywhere
            if (refreshUserData) {
              await refreshUserData();
            }

            toast({
              title: "Profile photo updated",
              description: "Your profile photo has been successfully updated."
            });
          } catch (error) {
            console.error('Profile update error:', error);
            toast({
              title: "Update failed",
              description: error instanceof Error ? error.message : "Failed to update profile photo",
              variant: "destructive"
            });
          } finally {
            setIsUploadingImage(false);
            setUploadProgress(0);
          }
        }
      );
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
      setIsUploadingImage(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-sm text-muted-foreground">Manage your account information and preferences</p>
          </div>
          {!isEditing && (
            <Button 
              onClick={() => setIsEditing(true)}
              data-testid="button-edit-profile"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Profile Picture Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <Camera className="h-5 w-5 mr-2" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24" data-testid="avatar-profile">
                  <AvatarImage src={currentUser?.profilePhoto} />
                  <AvatarFallback className="text-lg">
                    {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                {isEditing && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      data-testid="input-file-upload"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      data-testid="button-upload-photo"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading {uploadProgress}%
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Change Photo
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Information Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {updateError && (
                <Alert variant="destructive" className="mb-6" data-testid="alert-update-error">
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}

              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your first name"
                                data-testid="input-first-name"
                                {...field} 
                              />
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
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your last name"
                                data-testid="input-last-name"
                                {...field} 
                              />
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
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your username"
                              data-testid="input-username"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="Enter your email"
                              data-testid="input-email"
                              disabled={isSocialLogin}
                              {...field} 
                            />
                          </FormControl>
                          {isSocialLogin && (
                            <p className="text-xs text-muted-foreground">
                              Email cannot be changed for {user?.authProvider === 'google' ? 'Google' : 'Apple'} accounts
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your phone number"
                                data-testid="input-phone"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your country"
                                data-testid="input-country"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="date_of_birth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              placeholder="Select your date of birth"
                              data-testid="input-date-of-birth"
                              max={new Date().toISOString().split('T')[0]}
                              {...field} 
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            You must be at least 18 years old to use this platform
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="my-6" />

                    <div className="flex justify-end space-x-4">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={isLoading}
                        data-testid="button-save"
                      >
                        {isLoading ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
                      <p className="text-foreground" data-testid="text-first-name">
                        {user?.firstName || "Not provided"}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
                      <p className="text-foreground" data-testid="text-last-name">
                        {user?.lastName || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                    <p className="text-foreground" data-testid="text-username">
                      {user?.userName || "Not provided"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Address
                      {isSocialLogin && (
                        <span className="ml-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                          {user?.authProvider === 'google' ? 'Google' : 'Apple'} Account
                        </span>
                      )}
                    </Label>
                    <p className="text-foreground" data-testid="text-email">
                      {user?.email || "Not provided"}
                    </p>
                    {isSocialLogin && (
                      <p className="text-xs text-muted-foreground">
                        Email is managed by your {user?.authProvider === 'google' ? 'Google' : 'Apple'} account
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        Phone Number
                      </Label>
                      <p className="text-foreground" data-testid="text-phone">
                        {user?.phone || "Not provided"}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Country
                      </Label>
                      <p className="text-foreground" data-testid="text-country">
                        {user?.country || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                    <p className="text-foreground" data-testid="text-date-of-birth">
                      {user?.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : "Not provided"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}