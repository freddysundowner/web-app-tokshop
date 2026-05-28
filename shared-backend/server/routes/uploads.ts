import type { Express } from "express";
import multer from "multer";
import crypto from "crypto";
import { getAdminStorage } from "../firebase-admin";
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

        const storage = await getAdminStorage();
        const bucket = storage.bucket();

        const ext = (req.file.originalname.split(".").pop() || "jpg").toLowerCase();
        const filePath = `product-images/${crypto.randomUUID()}.${ext}`;
        const file = bucket.file(filePath);

        const downloadToken = crypto.randomUUID();

        await file.save(req.file.buffer, {
          contentType: req.file.mimetype,
          metadata: {
            metadata: {
              firebaseStorageDownloadTokens: downloadToken,
            },
          },
          resumable: false,
        });

        const encodedPath = encodeURIComponent(filePath);
        const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;

        res.json({ success: true, data: { url, path: filePath } });
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
