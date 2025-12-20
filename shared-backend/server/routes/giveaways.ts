import type { Express } from "express";
import { BASE_URL } from "../utils";
import multer from "multer";
import FormData from "form-data";
import axios from "axios";

// Multer configuration for memory storage
const upload = multer({ storage: multer.memoryStorage() });

export function registerGiveawayRoutes(app: Express) {
  // Upload giveaway images - using themes/upload-resource endpoint
  app.post("/api/giveaways/upload-image", upload.single('image'), async (req, res) => {
    try {
      if (!req.session?.accessToken) {
        return res.status(401).json({ error: 'Unauthorized - no access token' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      // Generate a unique key for the giveaway image
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const fileExt = req.file.originalname.split('.').pop() || 'jpg';
      const resourceKey = `giveaway-image-${timestamp}-${randomId}`;

      // Create FormData for the themes/upload-resource endpoint
      const formData = new FormData();
      formData.append('key', resourceKey);
      formData.append('resource', req.file.buffer, {
        filename: `${resourceKey}.${fileExt}`,
        contentType: req.file.mimetype,
      });

      const uploadUrl = `${BASE_URL}/themes/upload-resource`;
      console.log(`Uploading giveaway image to: ${uploadUrl}, key: ${resourceKey}`);

      const response = await axios.post(uploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${req.session.accessToken}`,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      console.log('Upload response:', response.data);
      
      // Return the image URL from the response
      let imageUrl = response.data.url || response.data.key;
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `${BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      }

      return res.json({
        success: true,
        url: imageUrl,
      });
    } catch (error: any) {
      console.error("Error uploading giveaway image:", error.response?.data || error.message);
      res.status(500).json({ 
        error: "Failed to upload image",
        details: error.response?.data || error.message 
      });
    }
  });
  // Get giveaways - proxy to external API
  app.get("/api/giveaways", async (req, res) => {
    try {
      console.log('Fetching giveaways with params:', req.query);
      
      // Build query params
      const queryParams = new URLSearchParams();
      if (req.query.name) queryParams.set('name', req.query.name as string);
      if (req.query.page) queryParams.set('page', req.query.page as string);
      if (req.query.limit) queryParams.set('limit', req.query.limit as string);
      if (req.query.room) queryParams.set('room', req.query.room as string);
      if (req.query.type) queryParams.set('type', req.query.type as string);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Include auth token if available
      if (req.session?.accessToken) {
        headers['Authorization'] = `Bearer ${req.session.accessToken}`;
      }

      const url = `${BASE_URL}/giveaways?${queryParams.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        console.error(`Tokshop API returned ${response.status}: ${response.statusText}`);
        return res.status(response.status).json({ error: 'Failed to fetch giveaways' });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching giveaways from Tokshop API:", error);
      res.status(500).json({ error: "Failed to fetch giveaways" });
    }
  });

  // Get single giveaway by ID - proxy to external API
  app.get("/api/giveaways/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Fetching single giveaway:', id);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Include auth token if available
      if (req.session?.accessToken) {
        headers['Authorization'] = `Bearer ${req.session.accessToken}`;
      }

      const url = `${BASE_URL}/giveaways/${id}`;
      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        console.error(`Tokshop API returned ${response.status}: ${response.statusText}`);
        return res.status(response.status).json({ error: 'Giveaway not found' });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching giveaway from Tokshop API:", error);
      res.status(500).json({ error: "Failed to fetch giveaway" });
    }
  });

  // Create giveaway - proxy to external API
  app.post("/api/giveaways", async (req, res) => {
    try {
      console.log('Creating giveaway with data:', req.body);
      
      if (!req.session?.accessToken) {
        return res.status(401).json({ error: 'Unauthorized - no access token' });
      }

      if (!req.session?.user?.id) {
        return res.status(401).json({ error: 'Unauthorized - no user ID' });
      }

      // Add user ID to the payload and rename shippingProfile to shipping_profile
      const { shippingProfile, ...restBody } = req.body;
      const giveawayData: any = {
        ...restBody,
        user: req.session.user.id,
        // Force featured to false for giveaways
        featured: false,
      };
      
      // Only add shipping_profile if it's provided (must be a valid ObjectId)
      if (shippingProfile) {
        giveawayData.shipping_profile = shippingProfile;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${req.session.accessToken}`,
      };

      const url = `${BASE_URL}/giveaways`;
      console.log('Posting to Tokshop API:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(giveawayData),
      });
      
      const responseText = await response.text();
      console.log('Tokshop API response status:', response.status);
      console.log('Tokshop API response body:', responseText);

      if (!response.ok) {
        console.error(`Tokshop API returned ${response.status}: ${response.statusText}`);
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || 'Failed to create giveaway' };
        }
        return res.status(response.status).json(errorData);
      }

      const data = JSON.parse(responseText);
      res.json(data);
    } catch (error) {
      console.error("Error creating giveaway:", error);
      res.status(500).json({ error: "Failed to create giveaway" });
    }
  });

  // Update giveaway - proxy to external API
  app.put("/api/giveaways/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Updating giveaway:', id, 'with data:', req.body);
      
      if (!req.session?.accessToken) {
        return res.status(401).json({ error: 'Unauthorized - no access token' });
      }

      // Rename shippingProfile to shipping_profile for external API
      const { shippingProfile, ...restBody } = req.body;
      const giveawayData: any = {
        ...restBody,
        // Force featured to false for giveaways
        featured: false,
      };
      
      // Only add shipping_profile if it's provided (must be a valid ObjectId)
      if (shippingProfile) {
        giveawayData.shipping_profile = shippingProfile;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${req.session.accessToken}`,
      };

      const url = `${BASE_URL}/giveaways/${id}`;
      console.log('Putting to Tokshop API:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(giveawayData),
      });
      
      const responseText = await response.text();
      console.log('Tokshop API response status:', response.status);
      console.log('Tokshop API response body:', responseText);

      if (!response.ok) {
        console.error(`Tokshop API returned ${response.status}: ${response.statusText}`);
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || 'Failed to update giveaway' };
        }
        return res.status(response.status).json(errorData);
      }

      const data = JSON.parse(responseText);
      res.json(data);
    } catch (error) {
      console.error("Error updating giveaway:", error);
      res.status(500).json({ error: "Failed to update giveaway" });
    }
  });

  // Delete giveaway - proxy to external API
  app.delete("/api/giveaways/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Deleting giveaway:', id);
      
      if (!req.session?.accessToken) {
        return res.status(401).json({ error: 'Unauthorized - no access token' });
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${req.session.accessToken}`,
      };

      const url = `${BASE_URL}/giveaways/${id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        console.error(`Tokshop API returned ${response.status}: ${response.statusText}`);
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Failed to delete giveaway' };
        }
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error deleting giveaway:", error);
      res.status(500).json({ error: "Failed to delete giveaway" });
    }
  });
}
