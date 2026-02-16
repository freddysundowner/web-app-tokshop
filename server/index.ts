/**
 * Dual App Development Server
 *
 * Serves BOTH the Marketplace and Admin apps simultaneously on port 5000:
 *   - /admin/*  → Admin App
 *   - /*        → Marketplace App
 *
 * API routes are shared between both apps.
 * This is for DEVELOPMENT ONLY. Production builds are unaffected.
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import fs from "fs";
import { createServer as createViteServer, createLogger } from "vite";
import { createServer } from "http";
import { nanoid } from "nanoid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const marketplaceAppDir = path.join(rootDir, "marketplace-app");
const adminAppDir = path.join(rootDir, "admin-app");

dotenv.config({ path: path.join(adminAppDir, ".env") });

if (!process.env.BASE_URL) {
  throw new Error("BASE_URL environment variable is required");
}
console.log(`[Dual Server] BASE_URL: ${process.env.BASE_URL}`);
console.log(`[Dual Server] Marketplace: ${marketplaceAppDir}`);
console.log(`[Dual Server] Admin: ${adminAppDir}`);

process.chdir(marketplaceAppDir);

const app = express();

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-for-development-only',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction || process.env.FORCE_SECURE_COOKIES === 'true',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  },
  name: 'sessionId'
}));

app.use((req, res, next) => {
  const accessToken = req.headers['x-access-token'] as string;
  const adminToken = req.headers['x-admin-token'] as string;
  const userData = req.headers['x-user-data'] as string;

  if (accessToken) {
    req.session.accessToken = accessToken;
  } else if (adminToken) {
    req.session.accessToken = adminToken;
  }

  if (userData) {
    try {
      const decoded = Buffer.from(userData, 'base64').toString('utf8');
      req.session.user = JSON.parse(decoded);
    } catch (e) {
      console.error('Failed to parse user data from header:', e);
    }
  }

  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
    }
  });

  next();
});

(async () => {
  const { registerRoutes } = await import(path.join(rootDir, "shared-backend", "server", "routes.ts"));
  const httpServer = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  app.use('/api', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API endpoint not found: ${req.method} ${req.path}`
    });
  });

  const viteLogger = createLogger();

  const marketplaceVite = await createViteServer({
    root: path.join(marketplaceAppDir, "client"),
    configFile: path.join(marketplaceAppDir, "vite.config.ts"),
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
      },
    },
    server: {
      middlewareMode: true,
      hmr: { server: httpServer },
      allowedHosts: true,
    },
    appType: "custom",
  });

  const adminVite = await createViteServer({
    root: path.join(adminAppDir, "client"),
    configFile: path.join(adminAppDir, "vite.config.ts"),
    base: "/admin/",
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
      },
    },
    server: {
      middlewareMode: true,
      hmr: { server: httpServer, path: "/__admin_hmr" },
      allowedHosts: true,
    },
    appType: "custom",
  });

  app.use("/admin", adminVite.middlewares);
  app.use(marketplaceVite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      if (url.startsWith("/admin")) {
        const clientTemplate = path.join(adminAppDir, "client", "index.html");
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/admin/src/main.tsx?v=${nanoid()}"`,
        );
        const page = await adminVite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } else {
        const clientTemplate = path.join(marketplaceAppDir, "client", "index.html");
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        const page = await marketplaceVite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      }
    } catch (e) {
      if (url.startsWith("/admin")) {
        adminVite.ssrFixStacktrace(e as Error);
      } else {
        marketplaceVite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });

  const { socketListener } = await import(path.join(rootDir, "shared-backend", "server", "services", "socket-listener.ts"));

  const port = parseInt(process.env.PORT || '5000', 10);
  httpServer.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    console.log(`[Dual Server] ✅ Serving on port ${port}`);
    console.log(`[Dual Server] 📦 Marketplace App → /`);
    console.log(`[Dual Server] 🔧 Admin App → /admin`);

    try {
      await socketListener.initialize();
      console.log('✅ Socket.IO listener initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Socket.IO listener:', error);
    }
  });
})();
