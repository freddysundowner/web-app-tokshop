import { useParams, useLocation } from "wouter";
import { lazy, Suspense, useEffect, useState } from "react";
import { MobileAppRedirect } from "@/components/mobile-app-redirect";
import { Loader2 } from "lucide-react";

const ProfileView = lazy(() => import("./profile-view"));

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function ProfileViewWrapper() {
  const params = useParams<{ userId: string }>();
  const [location] = useLocation();
  const [userId, setUserId] = useState<string>('');
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryId = urlParams.get('id');
    const id = params.userId || queryId || '';
    setUserId(id);
  }, [params.userId, location]);
  
  if (!userId) {
    return <LoadingSpinner />;
  }

  return (
    <MobileAppRedirect type="user" id={userId}>
      <Suspense fallback={<LoadingSpinner />}>
        <ProfileView />
      </Suspense>
    </MobileAppRedirect>
  );
}
