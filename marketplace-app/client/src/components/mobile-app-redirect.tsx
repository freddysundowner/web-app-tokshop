import { useEffect, useState } from "react";
import { Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const APP_STORE_URL = "https://apps.apple.com/us/app/icona-live/id6751861344";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.iconaapp.live&hl=en";
const APP_SCHEME = "icona://";
const UNIVERSAL_LINK_DOMAIN = "https://iconaapp.com";

interface MobileAppRedirectProps {
  type: "user" | "show" | "product";
  id: string;
  children: React.ReactNode;
}

export function MobileAppRedirect({ type, id, children }: MobileAppRedirectProps) {
  const [showAppPrompt, setShowAppPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [attemptedAppOpen, setAttemptedAppOpen] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(userAgent);
    const android = /Android/i.test(userAgent);
    const mobile = ios || android;

    setIsIOS(ios);
    setIsAndroid(android);

    if (mobile && !attemptedAppOpen) {
      setAttemptedAppOpen(true);
      
      const referrer = document.referrer;
      const isFromIconaDomain = referrer.includes('iconaapp.com');
      const isOnIconaDomain = window.location.hostname === 'iconaapp.com' || 
                               window.location.hostname === 'www.iconaapp.com';
      
      if (isOnIconaDomain && !isFromIconaDomain) {
        const universalLink = `${UNIVERSAL_LINK_DOMAIN}/${type}/${id}`;
        window.location.replace(universalLink);
        
        setTimeout(() => {
          if (document.hasFocus()) {
            setShowAppPrompt(true);
          }
        }, 1500);
      } else {
        setShowAppPrompt(true);
      }
    }
    
    if (!mobile) {
      setIsChecking(false);
    }
  }, [type, id, attemptedAppOpen]);

  const handleOpenInApp = () => {
    const deepLink = `${APP_SCHEME}${type}/${id}`;
    const storeUrl = isIOS ? APP_STORE_URL : PLAY_STORE_URL;
    
    const now = Date.now();
    
    window.location.href = deepLink;
    
    setTimeout(() => {
      if (document.hasFocus() && Date.now() - now < 2000) {
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
    setShowAppPrompt(false);
    setIsChecking(false);
  };

  if (isChecking && !showAppPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showAppPrompt) {
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
              onClick={handleOpenInApp}
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

  return <>{children}</>;
}
