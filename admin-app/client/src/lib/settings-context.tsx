import { createContext, useContext, useEffect, useState } from 'react';
import { initializeFirebase } from './firebase';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  appId: string;
}

interface AppSettings {
  app_name: string;
  seo_title?: string;
  support_email: string;
  primary_color: string;
  secondary_color: string;
  stripe_publishable_key: string;
  commission_rate: number;
  firebase_config?: FirebaseConfig;
  demoMode?: boolean;
  currency?: string;
}

interface SettingsContextType {
  settings: AppSettings;
  isLoading: boolean;
  isFirebaseReady: boolean;
  appName: string;
}

const defaultSettings: AppSettings = {
  app_name: 'TokshopLive',
  seo_title: '',
  support_email: 'support@example.com',
  primary_color: '#F4D03F',
  secondary_color: '#1A1A1A',
  stripe_publishable_key: '',
  commission_rate: 0,
  demoMode: false,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  isFirebaseReady: false,
  appName: 'TokshopLive',
});

function hexToHSL(hex: string): string {
  hex = hex.replace('#', '');
  if (hex.length === 8) {
    hex = hex.substring(2);
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return `${h} ${s}% ${l}%`;
}

function getLuminance(hex: string): number {
  hex = hex.replace('#', '');
  if (hex.length === 8) {
    hex = hex.substring(2);
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const rLin = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLin = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLin = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

function applyThemeColors(primaryColor: string, secondaryColor: string) {
  const root = document.documentElement;
  const primaryHSL = hexToHSL(primaryColor);
  const secondaryHSL = hexToHSL(secondaryColor);
  const luminance = getLuminance(primaryColor);
  const isLightColor = luminance > 0.5;
  const foregroundColor = isLightColor ? '0 0% 9%' : '0 0% 100%';
  root.style.setProperty('--primary', primaryHSL);
  root.style.setProperty('--primary-foreground', foregroundColor);
  root.style.setProperty('--ring', primaryHSL);
  root.style.setProperty('--chart-1', primaryHSL);
  root.style.setProperty('--sidebar-primary', primaryHSL);
  root.style.setProperty('--sidebar-primary-foreground', foregroundColor);
  root.style.setProperty('--sidebar-ring', primaryHSL);
  const secondaryLuminance = getLuminance(secondaryColor);
  const isSecondaryLight = secondaryLuminance > 0.5;
  const secondaryForeground = isSecondaryLight ? '0 0% 9%' : '0 0% 100%';
  root.style.setProperty('--secondary', secondaryHSL);
  root.style.setProperty('--secondary-foreground', secondaryForeground);
  root.style.setProperty('--accent', secondaryHSL);
  root.style.setProperty('--accent-foreground', secondaryForeground);
  root.style.setProperty('--chart-2', secondaryHSL);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  async function fetchSettings() {
    try {
      // Fetch public themes for branding/colors (works without auth)
      try {
        const themesResponse = await fetch('/themes');
        if (themesResponse.ok) {
          const themesData = await themesResponse.json();
          if (themesData.success && themesData.data) {
            const themes = themesData.data;
            if (themes.primary_color) {
              applyThemeColors(themes.primary_color, themes.secondary_color || defaultSettings.secondary_color);
            }
            setSettings(prev => ({
              ...prev,
              app_name: themes.app_name || prev.app_name,
              demoMode: themes.demoMode !== undefined ? themes.demoMode : prev.demoMode,
            }));
          }
        }
      } catch {
        // silently ignore themes fetch failure
      }

      // Fetch full settings with Firebase/payment config (requires auth token)
      try {
        const adminToken = localStorage.getItem('adminAccessToken');
        const userToken = localStorage.getItem('accessToken');
        const settingsHeaders: Record<string, string> = {};
        if (adminToken) {
          settingsHeaders['Authorization'] = `Bearer ${adminToken}`;
          settingsHeaders['x-admin-token'] = adminToken;
        } else if (userToken) {
          settingsHeaders['Authorization'] = `Bearer ${userToken}`;
          settingsHeaders['x-access-token'] = userToken;
        }
        const settingsResponse = await fetch('/api/settings', {
          credentials: 'include',
          headers: settingsHeaders,
        });
        if (settingsResponse.status === 401 || settingsResponse.status === 404) {
          const hasToken = !!(adminToken || userToken);
          if (hasToken) {
            localStorage.removeItem('adminAccessToken');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            localStorage.removeItem('adminUser');
            localStorage.removeItem('userId');
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/admin/login';
            }
            return;
          }
        }
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          if (settingsData.success && settingsData.data) {
            const apiSettings = settingsData.data;
            // app_name, seo_title, and colors are authoritative from /themes —
            // never let /settings overwrite them. Also skip empty/null values.
            const THEMES_ONLY_FIELDS = ['app_name', 'seo_title', 'slogan', 'primary_color', 'secondary_color'];
            setSettings(prev => ({
              ...prev,
              ...Object.fromEntries(
                Object.entries(apiSettings).filter(([k, v]) =>
                  !THEMES_ONLY_FIELDS.includes(k) && v !== '' && v !== null && v !== undefined
                )
              ),
            }));

            if (apiSettings.firebase_api_key &&
              apiSettings.firebase_project_id &&
              apiSettings.firebase_storage_bucket) {
              const firebaseConfig = {
                apiKey: apiSettings.firebase_api_key,
                authDomain: apiSettings.firebase_auth_domain,
                projectId: apiSettings.firebase_project_id,
                storageBucket: apiSettings.firebase_storage_bucket,
                appId: apiSettings.firebase_app_id,
              };
              initializeFirebase(firebaseConfig);
              setIsFirebaseReady(true);
            } else {
              setIsFirebaseReady(false);
            }
          }
        }
      } catch {
        // silently ignore settings fetch failure
      }
    } catch (error) {
      console.error('Failed to fetch app settings:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const handleRefetch = () => fetchSettings();
    window.addEventListener('settings:refetch', handleRefetch);
    return () => window.removeEventListener('settings:refetch', handleRefetch);
  }, []);

  useEffect(() => {
    if (settings.primary_color && settings.secondary_color) {
      applyThemeColors(settings.primary_color, settings.secondary_color);
    }
  }, [settings.primary_color, settings.secondary_color]);

  const appName = settings.app_name || 'TokshopLive';

  return (
    <SettingsContext.Provider value={{ settings, isLoading, isFirebaseReady, appName }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
