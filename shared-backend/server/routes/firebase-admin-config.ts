import type { Express, Request, Response, NextFunction } from "express";
import multer from "multer";
import { BASE_URL, getAdminToken } from "../utils";
import { resetFirebaseAdmin } from "../firebase-admin";

// Server-side admin guard: requires a logged-in session whose user has admin=true.
// Does NOT trust client-supplied user-data headers for the role decision.
function requireAdminSession(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).session?.user;
  if (!user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  if (user.admin !== true) {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 64 * 1024 },
});

const REQUIRED_FIELDS = ["type", "project_id", "private_key", "client_email"];

function summarize(parsed: any) {
  return {
    configured: true,
    project_id: parsed.project_id || null,
    client_email: parsed.client_email || null,
    type: parsed.type || null,
  };
}

async function fetchSettings(accessToken: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  const r = await fetch(`${BASE_URL}/settings`, { headers });
  if (!r.ok) throw new Error(`Failed to fetch settings (${r.status})`);
  return r.json();
}

async function saveServiceAccountToSettings(accessToken: string | null, value: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  const r = await fetch(`${BASE_URL}/settings`, {
    method: "POST",
    headers,
    body: JSON.stringify({ firebase_service_account_json: value ?? "" }),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Failed to save settings (${r.status}): ${text}`);
  }
  return r.json();
}

export function registerFirebaseAdminConfigRoutes(app: Express) {
  // Status — returns whether a service account is configured and basic non-secret metadata.
  app.get("/api/admin/firebase-service-account", requireAdminSession, async (req, res) => {
    try {
      const accessToken = getAdminToken(req);
      const data = await fetchSettings(accessToken);
      const settings = data?.data || data;
      const raw =
        settings?.firebase_service_account_json ||
        (settings?.firebase_service_account &&
        typeof settings.firebase_service_account === "object"
          ? JSON.stringify(settings.firebase_service_account)
          : settings?.firebase_service_account) ||
        "";

      if (!raw || typeof raw !== "string" || !raw.trim().startsWith("{")) {
        return res.json({ success: true, data: { configured: false } });
      }
      try {
        const parsed = JSON.parse(raw);
        return res.json({ success: true, data: summarize(parsed) });
      } catch {
        return res.json({ success: true, data: { configured: false, error: "Invalid JSON stored" } });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message || "Failed to read status" });
    }
  });

  // Upload — accepts a multipart .json file, validates, saves to settings, resets Admin SDK.
  app.post(
    "/api/admin/firebase-service-account",
    requireAdminSession,
    upload.single("serviceAccount"),
    async (req, res) => {
      try {
        const accessToken = getAdminToken(req);
        if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

        const text = req.file.buffer.toString("utf8").trim();
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch {
          return res.status(400).json({
            success: false,
            message: "File is not valid JSON. Upload the unmodified service-account .json file from Firebase Console.",
          });
        }

        const missing = REQUIRED_FIELDS.filter((k) => !parsed[k]);
        if (missing.length) {
          return res.status(400).json({
            success: false,
            message: `JSON is missing required fields: ${missing.join(", ")}. This does not look like a Firebase service-account key.`,
          });
        }
        if (parsed.type !== "service_account") {
          return res.status(400).json({
            success: false,
            message: `Unexpected JSON type "${parsed.type}". Expected "service_account".`,
          });
        }

        await saveServiceAccountToSettings(accessToken, JSON.stringify(parsed));
        await resetFirebaseAdmin();

        res.json({ success: true, data: summarize(parsed) });
      } catch (e: any) {
        console.error("Service account upload failed:", e);
        res.status(500).json({ success: false, message: e?.message || "Upload failed" });
      }
    }
  );

  // Remove — clears the stored service-account credential.
  app.delete("/api/admin/firebase-service-account", requireAdminSession, async (req, res) => {
    try {
      const accessToken = getAdminToken(req);
      await saveServiceAccountToSettings(accessToken, null);
      await resetFirebaseAdmin();
      res.json({ success: true, data: { configured: false } });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message || "Failed to remove" });
    }
  });
}
