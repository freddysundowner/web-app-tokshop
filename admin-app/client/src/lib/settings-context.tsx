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
  commission_rate: 0, // Default 0% commission
  demoMode: false,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  isFirebaseReady: false,
  appName: 'TokshopLive',
});

// Helper function to convert hex to HSL
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle 8-character hex (AARRGGBB or RRGGBBAA format)
  // Strip alpha channel if present
  if (hex.length === 8) {
    // Check if it's AARRGGBB (alpha first) or RRGGBBAA (alpha last)
    // Most mobile formats use AARRGGBB, so we'll handle that
    hex = hex.substring(2); // Remove first 2 chars (alpha channel)
  }
  
  // Convert hex to RGB (now guaranteed to be 6 characters)
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

// Calculate luminance to determine if color is light or dark
function getLuminance(hex: string): number {
  hex = hex.replace('#', '');
  
  // Handle 8-character hex (AARRGGBB format) - strip alpha
  if (hex.length === 8) {
    hex = hex.substring(2); // Remove first 2 chars (alpha channel)
  }
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Apply gamma correction
  const rLin = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLin = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLin = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

// Apply theme colors to CSS variables
function applyThemeColors(primaryColor: string, secondaryColor: string) {
  console.log('🎨 Applying theme colors:', { primaryColor, secondaryColor });
  
  const root = document.documentElement;
  
  // Convert colors to HSL
  const primaryHSL = hexToHSL(primaryColor);
  const secondaryHSL = hexToHSL(secondaryColor);
  
  console.log('🎨 Converted to HSL:', { primaryHSL, secondaryHSL });
  
  // Determine if primary color is light or dark
  const luminance = getLuminance(primaryColor);
  const isLightColor = luminance > 0.5; // Threshold for light vs dark
  
  console.log('🎨 Luminance:', { luminance, isLightColor });
  
  // Set text color based on background luminance
  // Light backgrounds need dark text, dark backgrounds need light text
  const foregroundColor = isLightColor ? '0 0% 9%' : '0 0% 100%'; // dark or white
  
  // Apply primary color to all primary-related CSS variables
  root.style.setProperty('--primary', primaryHSL);
  root.style.setProperty('--primary-foreground', foregroundColor);
  root.style.setProperty('--ring', primaryHSL);
  root.style.setProperty('--chart-1', primaryHSL);
  root.style.setProperty('--sidebar-primary', primaryHSL);
  root.style.setProperty('--sidebar-primary-foreground', foregroundColor);
  root.style.setProperty('--sidebar-ring', primaryHSL);
  
  // Apply secondary color
  const secondaryLuminance = getLuminance(secondaryColor);
  const isSecondaryLight = secondaryLuminance > 0.5;
  const secondaryForeground = isSecondaryLight ? '0 0% 9%' : '0 0% 100%';
  
  root.style.setProperty('--secondary', secondaryHSL);
  root.style.setProperty('--secondary-foreground', secondaryForeground);
  root.style.setProperty('--accent', secondaryHSL);
  root.style.setProperty('--accent-foreground', secondaryForeground);
  root.style.setProperty('--chart-2', secondaryHSL);
  
  console.log('✅ Theme colors applied successfully');
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        // First, fetch public themes for colors (works without auth - for login page)
        try {
          const themesResponse = await fetch('/api/public/themes');
          if (themesResponse.ok) {
            const themesData = await themesResponse.json();
            console.log('🎨 Themes fetched:', themesData);
            if (themesData.success && themesData.data) {
              const themes = themesData.data;
              // Apply theme colors immediately
              if (themes.primary_color) {
                applyThemeColors(themes.primary_color, themes.secondary_color || defaultSettings.secondary_color);
              }
            }
          }
        } catch (themesError) {
          console.warn('Failed to fetch public themes:', themesError);
        }

        // Then fetch full settings (may require auth)
        // Include auth tokens from localStorage to ensure server can authenticate with external API
        const adminToken = localStorage.getItem('adminAccessToken');
        const userToken = localStorage.getItem('accessToken');
        const headers: Record<string, string> = {};
        if (adminToken) headers['x-admin-token'] = adminToken;
        if (userToken) {
          headers['x-access-token'] = userToken;
          headers['Authorization'] = `Bearer ${userToken}`;
        }
        
        const response = await fetch('/api/settings', { 
          credentials: 'include',
          headers,
        });
        let firebaseConfig: FirebaseConfig | undefined;
        
        if (response.ok) {
          const data = await response.json();
          console.log('⚙️ Settings fetched:', data);
          if (data.success && data.data) {
            console.log('⚙️ Settings data:', data.data);
            setSettings(data.data);
            
            // Build Firebase config from either nested object or individual fields
            if (data.data.firebase_config) {
              // Use nested firebase_config object if available
              firebaseConfig = data.data.firebase_config;
              console.log('🔥 Using nested firebase_config from API');
            } else if (data.data.firebase_api_key && data.data.firebase_project_id) {
              // Build from individual fields (from admin panel settings)
              firebaseConfig = {
                apiKey: data.data.firebase_api_key || data.data.FIREBASE_API_KEY || '',
                authDomain: data.data.firebase_auth_domain || '',
                projectId: data.data.firebase_project_id || '',
                storageBucket: data.data.firebase_storage_bucket || '',
                appId: data.data.firebase_app_id || '',
              };
              console.log('🔥 Built firebase_config from individual fields');
            }
          }
        }

        // If Firebase config not found in settings, try /api/settings/full endpoint (requires auth)
        if (!firebaseConfig || !firebaseConfig.apiKey || !firebaseConfig.projectId) {
          console.log('🔥 Trying /api/settings/full for Firebase config...');
          try {
            const fullResponse = await fetch('/api/settings/full', { 
              credentials: 'include',
              headers,
            });
            if (fullResponse.ok) {
              const fullData = await fullResponse.json();
              console.log('⚙️ Full settings fetched:', fullData);
              if (fullData.success && fullData.data) {
                const s = fullData.data;
                // Check for both lowercase and uppercase field names
                const apiKey = s.firebase_api_key || s.FIREBASE_API_KEY || '';
                const projectId = s.firebase_project_id || s.FIREBASE_PROJECT_ID || '';
                const authDomain = s.firebase_auth_domain || s.FIREBASE_AUTH_DOMAIN || '';
                const storageBucket = s.firebase_storage_bucket || s.FIREBASE_STORAGE_BUCKET || '';
                const appId = s.firebase_app_id || s.FIREBASE_APP_ID || '';
                
                if (apiKey && projectId) {
                  firebaseConfig = {
                    apiKey,
                    authDomain: authDomain || `${projectId}.firebaseapp.com`,
                    projectId,
                    storageBucket: storageBucket || `${projectId}.firebasestorage.app`,
                    appId,
                  };
                  console.log('🔥 Got Firebase config from /api/settings/full:', { projectId });
                }
              }
            }
          } catch (fullError) {
            console.warn('Failed to fetch full settings:', fullError);
          }
        }
        
        // Initialize Firebase with dynamic config if available
        if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId) {
          console.log('🔥 Initializing Firebase with config:', { projectId: firebaseConfig.projectId });
          initializeFirebase(firebaseConfig);
          console.log('✅ Firebase initialized successfully');
          setIsFirebaseReady(true);
        } else {
          console.warn('⚠️ No valid Firebase config found in settings');
          setIsFirebaseReady(false);
        }
      } catch (error) {
        console.error('Failed to fetch app settings:', error);
        console.warn('⚠️ Cannot initialize Firebase without settings');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  // Apply theme colors whenever settings change
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
