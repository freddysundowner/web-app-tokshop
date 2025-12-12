import type { Express } from "express";
import { BASE_URL } from "../utils";

export function registerSettingsRoutes(app: Express) {
  // Get public theme settings (no auth required)
  app.get("/api/public/themes", async (req, res) => {
    try {
      const url = `${BASE_URL}/themes`;
      console.log(`Fetching public themes from: ${url}`);
      
      // Try to get access token from session if available
      const accessToken = req.session?.accessToken;
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        // Return default values if API fails
        console.warn(`Failed to fetch themes from API, using defaults`);
        return res.json({
          success: true,
          data: {
            app_name: "",
            slogan: "",
            primary_color: "FFFACC15",
            secondary_color: "FF0D9488",
            button_color: "FF000000",
            button_text_color: "FFFFFFFF",
            app_logo: "",
          },
        });
      }

      const data = await response.json();
      const themes = Array.isArray(data) ? data[0] : data;
      
      res.json({
        success: true,
        data: {
          app_name: themes?.app_name || "",
          slogan: themes?.slogan || "",
          primary_color: themes?.primary_color || "FFFACC15",
          secondary_color: themes?.secondary_color || "FF0D9488",
          button_color: themes?.button_color || "FF000000",
          button_text_color: themes?.button_text_color || "FFFFFFFF",
          app_logo: themes?.app_logo || "",
        },
      });
    } catch (error: any) {
      console.error("Error fetching public themes:", error);
      // Return default values on error
      res.json({
        success: true,
        data: {
          app_name: "",
          slogan: "",
          primary_color: "FFFACC15",
          secondary_color: "FF0D9488",
          button_color: "FF000000",
          button_text_color: "FFFFFFFF",
          app_logo: "",
        },
      });
    }
  });

  // Get public app settings (branding information)
  app.get("/api/settings", async (req, res) => {
    try {
      // For public settings, we need to fetch without requiring user authentication
      // We'll use a system-level access if available, or make it public on the API
      const url = `${BASE_URL}/admin/app/settings`;
      console.log(`Fetching public app settings from: ${url}`);
      
      // Try to get access token from session if available
      const accessToken = req.session?.accessToken;
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        // Return default values if API fails
        console.warn(`Failed to fetch settings from API, using defaults`);
        return res.json({
          success: true,
          data: {
            app_name: "App",
            seo_title: "",
            support_email: "support@example.com",
            primary_color: "#F4D03F",
            secondary_color: "#1A1A1A",
            stripe_publishable_key: "",
            commission_rate: 0,
            // Firebase configuration
            firebase_api_key: "AIzaSyAq_pNPbTOSvA1X6K2jOCsiVUQyVdqcqBA",
            firebase_auth_domain: "icona-e7769.firebaseapp.com",
            firebase_project_id: "icona-e7769",
            firebase_storage_bucket: "icona-e7769.firebasestorage.app",
            firebase_app_id: "1:167886286942:web:f13314bc30af1005e384cf",
            demoMode: false,
          },
        });
      }

      const data = await response.json();
      const settings = Array.isArray(data) ? data[0] : data;
      
      // Extract public branding information, Stripe publishable key, and Firebase config
      const publicSettings = {
        app_name: settings?.app_name || "App",
        seo_title: settings?.seo_title || "",
        support_email: settings?.support_email || "support@example.com",
        primary_color: settings?.primary_color || "#F4D03F",
        secondary_color: settings?.secondary_color || "#1A1A1A",
        // API returns 'stripepublickey' not 'stripe_publishable_key'
        stripe_publishable_key: settings?.stripepublickey || settings?.stripe_publishable_key || "",
        commission_rate: parseFloat(settings?.commission || "0"), // API returns 'commission' as string
        // Firebase configuration (individual fields)
        firebase_api_key: settings?.firebase_api_key || settings?.FIREBASE_API_KEY || "",
        firebase_auth_domain: settings?.firebase_auth_domain || "",
        firebase_project_id: settings?.firebase_project_id || "",
        firebase_storage_bucket: settings?.firebase_storage_bucket || "",
        firebase_app_id: settings?.firebase_app_id || "",
        // Demo mode flag
        demoMode: settings?.demoMode || false,
        // Age restriction flag
        agerestricted: settings?.agerestricted || false,
      };
      
      res.json({
        success: true,
        data: publicSettings,
      });
    } catch (error: any) {
      console.error("Error fetching public app settings:", error);
      // Return default values on error
      res.json({
        success: true,
        data: {
          app_name: "App",
          seo_title: "",
          support_email: "support@example.com",
          primary_color: "#F4D03F",
          secondary_color: "#1A1A1A",
          stripe_publishable_key: "",
          commission_rate: 0,
          // Firebase configuration
          firebase_api_key: "AIzaSyAq_pNPbTOSvA1X6K2jOCsiVUQyVdqcqBA",
          firebase_auth_domain: "icona-e7769.firebaseapp.com",
          firebase_project_id: "icona-e7769",
          firebase_storage_bucket: "icona-e7769.firebasestorage.app",
          firebase_app_id: "1:167886286942:web:f13314bc30af1005e384cf",
          demoMode: false,
        },
      });
    }
  });
}
