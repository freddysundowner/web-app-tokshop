import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, Save, ShieldX } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EmailSellerApproval() {
  const { toast } = useToast();

  const [sellerApprovalSubject, setSellerApprovalSubject] = useState("");
  const [sellerApprovalBody, setSellerApprovalBody] = useState("");

  const { data: settingsData } = useQuery<any>({
    queryKey: ['/api/admin/settings'],
  });

  const settings = settingsData?.data || settingsData;
  const isDemoMode = settings?.demoMode || false;

  useEffect(() => {
    if (settings) {
      if (settings.seller_approval_email_subject) {
        setSellerApprovalSubject(settings.seller_approval_email_subject);
      } else {
        setSellerApprovalSubject('Your {appName} Seller Account is Approved!');
      }
      if (settings.seller_approval_email_body) {
        setSellerApprovalBody(settings.seller_approval_email_body);
      } else {
        setSellerApprovalBody('Congratulations! Your seller account on {appName} has been approved.\n\nYou can now:\n- List products for sale\n- Host live shopping shows\n- Run auctions and giveaways\n- Start earning on the platform\n\nGet started by visiting your Seller Hub.');
      }
    }
  }, [settings]);

  const saveTemplatesMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Email template saved",
        description: "Seller approval email has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving email",
        description: error.message || "Failed to save seller approval email",
        variant: "destructive",
      });
    },
  });

  const handleSaveTemplates = () => {
    if (!sellerApprovalSubject.trim() || !sellerApprovalBody.trim()) {
      toast({
        title: "Validation Error",
        description: "Subject and body are required",
        variant: "destructive",
      });
      return;
    }

    saveTemplatesMutation.mutate({
      seller_approval_email_subject: sellerApprovalSubject,
      seller_approval_email_body: sellerApprovalBody,
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
              <Mail className="h-4 w-4" />
              Seller Approval Email
            </CardTitle>
            <CardDescription>
              Customize the email sent to users when their seller account is approved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription>
                This email is sent automatically when you approve a seller account application. Customize the subject and body to match your brand voice.
              </AlertDescription>
            </Alert>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="seller-approval-subject">Subject Line</Label>
                <Input
                  id="seller-approval-subject"
                  value={sellerApprovalSubject}
                  onChange={(e) => setSellerApprovalSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  data-testid="input-seller-approval-subject"
                  disabled={isDemoMode}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seller-approval-body">Email Body</Label>
                <Textarea
                  id="seller-approval-body"
                  value={sellerApprovalBody}
                  onChange={(e) => setSellerApprovalBody(e.target.value)}
                  placeholder="Congratulations! Your seller account on {appName} has been approved..."
                  rows={10}
                  data-testid="textarea-seller-approval-body"
                  disabled={isDemoMode}
                />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Available placeholders:
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside ml-2">
                    <li><code className="bg-muted px-1 py-0.5 rounded">{"{appName}"}</code> - Your app name</li>
                    <li><code className="bg-muted px-1 py-0.5 rounded">{"{name}"}</code> - Seller's first name</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 The email will automatically include a styled "Go to Seller Hub" button
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSaveTemplates}
                disabled={isDemoMode || saveTemplatesMutation.isPending}
                className="w-full"
                data-testid="button-save-templates"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveTemplatesMutation.isPending ? "Saving..." : "Save Seller Approval Email"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
