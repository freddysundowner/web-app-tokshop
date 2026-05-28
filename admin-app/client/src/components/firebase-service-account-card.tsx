import { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Info, Upload, Trash2, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";

interface Status {
  configured: boolean;
  project_id?: string | null;
  client_email?: string | null;
  type?: string | null;
  error?: string;
}

const STATUS_KEY = ["/api/admin/firebase-service-account"];

export function FirebaseServiceAccountCard({
  isDemoMode,
  canManageSettings,
}: {
  isDemoMode: boolean;
  canManageSettings: boolean;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<File | null>(null);

  const { data, isLoading } = useQuery<{ success: boolean; data: Status }>({
    queryKey: STATUS_KEY,
  });
  const status: Status = data?.data || { configured: false };

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("serviceAccount", file);
      const accessToken = localStorage.getItem("adminAccessToken") || "";
      const res = await fetch("/api/admin/firebase-service-account", {
        method: "POST",
        headers: {
          ...(accessToken ? { "x-admin-token": accessToken, "x-access-token": accessToken } : {}),
        },
        body: fd,
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || `Upload failed (${res.status})`);
      }
      return json.data as Status;
    },
    onSuccess: (d) => {
      toast({
        title: "Service account saved",
        description: `Configured for ${d.client_email || d.project_id || "Firebase project"}.`,
      });
      setPicked(null);
      if (fileRef.current) fileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: STATUS_KEY });
    },
    onError: (err: any) => {
      toast({ title: "Upload failed", description: err?.message || "Try again.", variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const accessToken = localStorage.getItem("adminAccessToken") || "";
      const res = await fetch("/api/admin/firebase-service-account", {
        method: "DELETE",
        headers: {
          ...(accessToken ? { "x-admin-token": accessToken, "x-access-token": accessToken } : {}),
        },
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || `Remove failed (${res.status})`);
    },
    onSuccess: () => {
      toast({ title: "Service account removed" });
      queryClient.invalidateQueries({ queryKey: STATUS_KEY });
    },
    onError: (err: any) => {
      toast({ title: "Remove failed", description: err?.message || "Try again.", variant: "destructive" });
    },
  });

  const disabled = isDemoMode || !canManageSettings;

  return (
    <Card data-testid="card-firebase-service-account">
      <CardHeader>
        <CardTitle>Firebase Admin SDK (Service Account)</CardTitle>
        <CardDescription>
          Server-side credential used for privileged Firebase operations (uploading product images,
          deleting storage files, etc.).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Why this is needed:</strong> The public Firebase keys above only identify your
            project — they cannot prove the server is allowed to write to Storage. Without a service
            account, users who sign in with email/password (no Firebase Auth session) get blocked
            when uploading product images. Uploading the service-account JSON here lets the backend
            perform those uploads on their behalf.
            <br />
            <br />
            <strong>How to get it:</strong> Firebase Console → Project Settings → <em>Service
            accounts</em> tab → <em>Generate new private key</em> → confirm. A <code>.json</code> file
            downloads. Upload that exact file below — don't open or modify it.
            <br />
            <br />
            <strong>Security:</strong> This key grants full admin access to your Firebase project.
            It is stored server-side only and never exposed to the browser.
          </AlertDescription>
        </Alert>

        <div className="rounded-md border p-3 flex items-center justify-between gap-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking status…
            </div>
          ) : status.configured ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <Badge variant="secondary" data-testid="badge-service-account-status">Configured</Badge>
              </div>
              <div className="text-sm">
                <div><span className="text-muted-foreground">Project:</span> <span data-testid="text-sa-project">{status.project_id || "—"}</span></div>
                <div className="break-all"><span className="text-muted-foreground">Client email:</span> <span data-testid="text-sa-email">{status.client_email || "—"}</span></div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <Badge variant="outline" data-testid="badge-service-account-status">Not configured</Badge>
              <span className="text-sm text-muted-foreground">Image uploads will fail for email/password users.</span>
            </div>
          )}
          {status.configured && !disabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeMutation.mutate()}
              disabled={removeMutation.isPending}
              data-testid="button-remove-service-account"
            >
              {removeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="ml-2">Remove</span>
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            disabled={disabled}
            onChange={(e) => setPicked(e.target.files?.[0] || null)}
            className="block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80 disabled:opacity-60"
            data-testid="input-service-account-file"
          />
          {picked && (
            <p className="text-xs text-muted-foreground" data-testid="text-picked-filename">
              Selected: {picked.name} ({Math.round(picked.size / 1024)} KB)
            </p>
          )}
          <Button
            onClick={() => picked && uploadMutation.mutate(picked)}
            disabled={!picked || disabled || uploadMutation.isPending}
            data-testid="button-upload-service-account"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {status.configured ? "Replace service account" : "Upload service account"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
