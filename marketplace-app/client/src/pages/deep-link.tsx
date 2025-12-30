import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const APP_STORE_URL = "https://apps.apple.com/us/app/icona-live/id6751861344";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.iconaapp.live&hl=en";
const UNIVERSAL_LINK_DOMAIN = "https://iconaapp.com";

export default function DeepLink() {
  const params = useParams<{ type: string; id: string }>();
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  const getWebUrl = (type: string, id: string) => {
    switch (type) {
      case "user":
        return `/user?id=${id}`;
      case "product":
        return `/product/${id}`;
      case "show":
        return `/show/${id}`;
      default:
        return "/";
    }
  };

  useEffect(() => {
    const { type, id } = params;
    
    if (!type || !id) {
      window.location.replace("/");
      return;
    }

    const userAgent = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(userAgent);
    const android = /Android/i.test(userAgent);
    const mobile = ios || android;

    setIsIOS(ios);
    setIsAndroid(android);
    setIsMobile(mobile);

    if (!mobile) {
      setTimeout(() => {
        window.location.replace(getWebUrl(type, id));
      }, 1000);
      return;
    }

    setStatus("ready");
  }, [params]);

  const handleContinueOnIcona = () => {
    const { type, id } = params;
    if (!type || !id) return;
    
    const universalLink = `${UNIVERSAL_LINK_DOMAIN}/${type}/${id}`;
    const storeUrl = isIOS ? APP_STORE_URL : PLAY_STORE_URL;
    
    window.location.href = universalLink;
    
    setTimeout(() => {
      if (document.hasFocus()) {
        window.location.href = storeUrl;
      }
    }, 1500);
  };

  const handleOpenAppStore = () => {
    if (isIOS) {
      window.location.href = APP_STORE_URL;
    } else if (isAndroid) {
      window.location.href = PLAY_STORE_URL;
    }
  };

  const handleContinueOnWeb = () => {
    const { type, id } = params;
    if (type && id) {
      window.location.replace(getWebUrl(type, id));
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h1 className="text-xl font-semibold text-foreground">Loading...</h1>
          <p className="text-muted-foreground text-sm">Please wait while we redirect you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <Smartphone className="h-10 w-10 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Open in Icona App</h1>
          <p className="text-muted-foreground">
            Get the best experience with the Icona app
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleContinueOnIcona}
            className="w-full h-12 text-base font-semibold"
          >
            Continue on Icona
          </Button>
          
          <Button 
            onClick={handleContinueOnWeb}
            variant="outline"
            className="w-full h-12 text-base"
          >
            Continue on Website
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Don't have the app?{" "}
          <button 
            onClick={handleOpenAppStore}
            className="text-primary underline hover:no-underline"
          >
            {isIOS ? "Download from App Store" : "Download from Google Play"}
          </button>
        </p>
      </div>
    </div>
  );
}
