import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Smartphone, Users, User, ShieldX, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EmailUpdate() {
  const { toast } = useToast();

  const [androidLink, setAndroidLink] = useState("https://play.google.com/store/apps/details?id=com.tokshop.live&hl=en");
  const [iosLink, setIosLink] = useState("https://testflight.apple.com/join/jjzjjnC2");
  const [updateRecipientType, setUpdateRecipientType] = useState<"all" | "individual">("all");
  const [updateRecipientEmail, setUpdateRecipientEmail] = useState("");

  const { data: settingsData } = useQuery<any>({
    queryKey: ['/api/admin/settings'],
  });

  const settings = settingsData?.data || settingsData;
  const isDemoMode = settings?.demoMode || false;

  const { data: usersData } = useQuery<any>({
    queryKey: ['/api/admin/users?limit=1000'],
    enabled: updateRecipientType === "individual",
  });

  const users = usersData?.data?.users || [];

  const sendUpdateNotificationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/send-update-notification", data);
    },
    onSuccess: () => {
      toast({
        title: "Update notification sent",
        description: updateRecipientType === "all" 
          ? "App update notification has been sent to all users"
          : "App update notification has been sent to the selected user",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error sending notification",
        description: error.message || "Failed to send update notification",
        variant: "destructive",
      });
    },
  });

  const handleSendUpdateNotification = () => {
    if (updateRecipientType === "individual" && !updateRecipientEmail) {
      toast({
        title: "Validation Error",
        description: "Please select a recipient",
        variant: "destructive",
      });
      return;
    }

    sendUpdateNotificationMutation.mutate({
      androidLink,
      iosLink,
      sendToAll: updateRecipientType === "all",
      recipientEmail: updateRecipientType === "individual" ? updateRecipientEmail : undefined,
    });
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {isDemoMode && (
          <Alert className="mb-6 border-destructive bg-destructive/10">
            <ShieldX className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              Email functionality is disabled in demo mode. This page is view-only to prevent sending emails to real users.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              App Update Notification
            </CardTitle>
            <CardDescription>
              Send a notification to all users about the latest app version
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Send To</Label>
              <div className="flex gap-4">
                <Button
                  variant={updateRecipientType === "all" ? "default" : "outline"}
                  onClick={() => setUpdateRecipientType("all")}
                  className="flex-1"
                  data-testid="button-update-recipient-all"
                  disabled={isDemoMode}
                >
                  <Users className="h-4 w-4 mr-2" />
                  All Users
                </Button>
                <Button
                  variant={updateRecipientType === "individual" ? "default" : "outline"}
                  onClick={() => setUpdateRecipientType("individual")}
                  className="flex-1"
                  data-testid="button-update-recipient-individual"
                  disabled={isDemoMode}
                >
                  <User className="h-4 w-4 mr-2" />
                  Individual User
                </Button>
              </div>
            </div>

            {updateRecipientType === "individual" && (
              <div className="space-y-2">
                <Label htmlFor="update-recipient">Select Recipient</Label>
                <Select value={updateRecipientEmail} onValueChange={setUpdateRecipientEmail} disabled={isDemoMode}>
                  <SelectTrigger id="update-recipient" data-testid="select-update-recipient">
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user._id || user.id} value={user.email}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <Label className="text-xs text-muted-foreground">Android Version</Label>
                <p className="text-2xl font-bold">{settings?.androidVersion || "Not set"}</p>
              </div>
              <div className="p-4 border rounded-lg bg-muted/30">
                <Label className="text-xs text-muted-foreground">iOS Version</Label>
                <p className="text-2xl font-bold">{settings?.iosVersion || "Not set"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="android-link">Android Store Link</Label>
                <Input
                  id="android-link"
                  value={androidLink}
                  onChange={(e) => setAndroidLink(e.target.value)}
                  placeholder="https://play.google.com/store/apps/..."
                  data-testid="input-android-link"
                  disabled={isDemoMode}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ios-link">iOS Store Link</Label>
                <Input
                  id="ios-link"
                  value={iosLink}
                  onChange={(e) => setIosLink(e.target.value)}
                  placeholder="https://testflight.apple.com/join/..."
                  data-testid="input-ios-link"
                  disabled={isDemoMode}
                />
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Email Preview:</strong> Users will receive a professionally formatted email with:
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Personalized greeting with their name</li>
                  <li>• Version numbers for Android and iOS</li>
                  <li>• Direct links to update on their respective stores</li>
                  <li>• Responsive design for mobile and desktop</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleSendUpdateNotification}
              disabled={isDemoMode || sendUpdateNotificationMutation.isPending}
              className="w-full"
              size="lg"
              data-testid="button-send-update-notification"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendUpdateNotificationMutation.isPending 
                ? "Sending Update Notification..." 
                : updateRecipientType === "all" 
                  ? "Send Update Notification to All Users"
                  : "Send Update Notification to Selected User"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
