import { useParams, useLocation } from "wouter";
import { lazy, Suspense, useEffect, useState } from "react";
import { MobileAppRedirect } from "@/components/mobile-app-redirect";
import { Loader2 } from "lucide-react";

const ShowView = lazy(() => import("./show-view"));

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function ShowViewWrapper() {
  const params = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const [showId, setShowId] = useState<string>('');
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryId = urlParams.get('id');
    const id = params.id || queryId || '';
    setShowId(id);
    
    if (queryId && !params.id) {
      setLocation(`/show/${queryId}`, { replace: true });
    }
  }, [params.id, location, setLocation]);
  
  if (!showId) {
    return <LoadingSpinner />;
  }

  return (
    <MobileAppRedirect type="show" id={showId}>
      <Suspense fallback={<LoadingSpinner />}>
        <ShowView />
      </Suspense>
    </MobileAppRedirect>
  );
}
