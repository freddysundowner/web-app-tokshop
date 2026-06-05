import type { Express } from "express";
import multer from "multer";
import crypto from "crypto";
import { getAccessToken } from "../utils";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export function registerUploadRoutes(app: Express) {
  app.post(
    "/api/upload/product-image",
    upload.single("image"),
    async (req, res) => {
      try {
        const accessToken = getAccessToken(req);
        if (!accessToken) {
          return res.status(401).json({ success: false, message: "Not authenticated" });
        }

        if (!req.file) {
          return res.status(400).json({ success: false, message: "No file provided" });
        }

        if (!req.file.mimetype.startsWith("image/")) {
          return res.status(400).json({ success: false, message: "File must be an image" });
        }

        return res.status(503).json({
          success: false,
          message: "Direct image upload is not available in this environment. Please use the external API for image uploads.",
        });
      } catch (error: any) {
        console.error("Product image upload failed:", error);
        res.status(500).json({
          success: false,
          message: error?.message || "Upload failed",
        });
      }
    }
  );
}
