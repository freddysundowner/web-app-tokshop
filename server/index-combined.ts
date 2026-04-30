/**
 * Combined server - runs both Marketplace and Admin apps on port 5000
 *
 * Routing:
 *   /admin/*  → Admin app (Vite base: /admin/)
 *   /*        → Marketplace app
 *   /api/*    → Shared Express backend (serves both frontends)
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import { createServer } from "http";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.join(__dirname, "..");

// Load env from marketplace-app (primary app)
dotenv.config({ path: path.join(workspaceRoot, "marketplace-app", ".env") });
dotenv.config({ path: path.join(workspaceRoot, ".env") });

if (!process.env.BASE_URL) {
  throw new Error("BASE_URL environment variable is required");
}
console.log(`[Combined Server] BASE_URL: ${process.env.BASE_URL}`);

// Set cwd to workspace root so relative imports work
process.chdir(workspaceRoot);

// ─── Express App ────────────────────────────────────────────────────────────

const app = express();
app.set("etag", false);
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const isProduction = process.env.NODE_ENV === "production";

app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret-for-development-only",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction || process.env.FORCE_SECURE_COOKIES === "true",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
    name: "sessionId",
  })
);

// Session restoration from headers
app.use((req, _res, next) => {
  const accessToken = req.headers["x-access-token"] as string;
  const adminToken = req.headers["x-admin-token"] as string;
  const userData = req.headers["x-user-data"] as string;
  if (accessToken) req.session.accessToken = accessToken;
  else if (adminToken) req.session.accessToken = adminToken;
  if (userData) {
    try {
      req.session.user = JSON.parse(Buffer.from(userData, "base64").toString("utf8"));
    } catch {}
  }
  next();
});

// No-cache for API
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const p = req.path;
  let captured: Record<string, any> | undefined;
  const orig = res.json;
  res.json = function (body, ...args) {
    captured = body;
    return orig.apply(res, [body, ...args]);
  };
  res.on("finish", () => {
    if (p.startsWith("/api")) {
      const duration = Date.now() - start;
      let line = `${req.method} ${p} ${res.statusCode} in ${duration}ms`;
      if (captured) line += ` :: ${JSON.stringify(captured)}`;
      if (line.length > 80) line = line.slice(0, 79) + "…";
      const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
      console.log(`${time} [express] ${line}`);
    }
  });
  next();
});

// ─── Register API Routes ─────────────────────────────────────────────────────

// We need process.cwd() to be the marketplace app dir for route imports
// but we set it to workspace root. The routes don't use cwd so this is fine.
const { registerRoutes } = await import("../shared-backend/server/routes.js");
const httpServer = await registerRoutes(app);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
});

app.use("/api", (req, res) => {
  res.status(404).json({ success: false, error: `API endpoint not found: ${req.method} ${req.path}` });
});

// ─── Dual Vite Dev Servers ────────────────────────────────────────────────────

const viteLogger = createLogger();

const marketplaceRoot = path.join(workspaceRoot, "marketplace-app", "client");
const adminRoot = path.join(workspaceRoot, "admin-app", "client");

const marketplaceVite = await createViteServer({
  root: marketplaceRoot,
  configFile: path.join(workspaceRoot, "marketplace-app", "vite.config.ts"),
  customLogger: { ...viteLogger, error: (msg, opts) => { viteLogger.error(msg, opts); } },
  server: { middlewareMode: true, hmr: { server: httpServer, path: "/_marketplace_hmr" }, allowedHosts: true as const },
  appType: "custom",
});

const adminVite = await createViteServer({
  root: adminRoot,
  configFile: path.join(workspaceRoot, "admin-app", "vite.config.ts"),
  base: "/admin/",
  customLogger: { ...viteLogger, error: (msg, opts) => { viteLogger.error(msg, opts); } },
  server: { middlewareMode: true, hmr: { server: httpServer, path: "/_admin_hmr" }, allowedHosts: true as const },
  appType: "custom",
});

// Mount admin Vite middleware for /admin routes
app.use("/admin", adminVite.middlewares);

// Admin SPA fallback
app.use("/admin", async (req, res, next) => {
  try {
    const template = await fs.promises.readFile(path.join(adminRoot, "index.html"), "utf-8");
    const updated = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
    const page = await adminVite.transformIndexHtml(req.originalUrl, updated);
    res.status(200).set({ "Content-Type": "text/html" }).end(page);
  } catch (e) {
    adminVite.ssrFixStacktrace(e as Error);
    next(e);
  }
});

// Mount marketplace Vite middleware for everything else
app.use(marketplaceVite.middlewares);

// Marketplace SPA fallback
app.use("*", async (req, res, next) => {
  try {
    const template = await fs.promises.readFile(path.join(marketplaceRoot, "index.html"), "utf-8");
    const updated = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
    const page = await marketplaceVite.transformIndexHtml(req.originalUrl, updated);
    res.status(200).set({ "Content-Type": "text/html" }).end(page);
  } catch (e) {
    marketplaceVite.ssrFixStacktrace(e as Error);
    next(e);
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const port = parseInt(process.env.PORT || "5000", 10);
httpServer.listen({ port, host: "0.0.0.0", reusePort: true }, async () => {
  console.log(`[Combined Server] serving on port ${port}`);
  console.log(`[Combined Server] Marketplace: http://localhost:${port}/`);
  console.log(`[Combined Server] Admin:       http://localhost:${port}/admin/`);

  const { socketListener } = await import("../shared-backend/server/services/socket-listener.js");
  try {
    await socketListener.initialize();
    console.log("✅ Socket.IO listener initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Socket.IO listener:", error);
  }
});
