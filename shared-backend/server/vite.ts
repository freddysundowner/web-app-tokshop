import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Marketplace: process.cwd() is marketplace-app/
  const marketplaceDir = process.cwd();
  const marketplaceRoot = path.resolve(marketplaceDir, "client");

  // Admin: sibling directory
  const adminDir = path.resolve(marketplaceDir, "../admin-app");
  const adminRoot = path.resolve(adminDir, "client");

  const sharedServerOptions = {
    middlewareMode: true as const,
    hmr: { server },
    allowedHosts: true as const,
  };

  // --- Admin Vite server (base: /admin/) ---
  const adminVite = await createViteServer({
    root: adminRoot,
    base: "/admin/",
    configFile: path.resolve(adminDir, "vite.config.ts"),
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
      },
    },
    server: {
      ...sharedServerOptions,
      hmr: { server, path: "/admin/__vite_hmr" },
    },
    appType: "custom",
  });

  // --- Marketplace Vite server (base: /) ---
  const marketplaceVite = await createViteServer({
    root: marketplaceRoot,
    base: "/",
    configFile: path.resolve(marketplaceDir, "vite.config.ts"),
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: sharedServerOptions,
    appType: "custom",
  });

  // Admin middleware handles /admin/* asset/HMR requests
  app.use(adminVite.middlewares);

  // Marketplace middleware handles all other asset requests
  app.use(marketplaceVite.middlewares);

  // Unified HTML catch-all
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      if (url.startsWith("/admin")) {
        // Serve admin app
        const templatePath = path.resolve(adminRoot, "index.html");
        let template = await fs.promises.readFile(templatePath, "utf-8");
        const page = await adminVite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } else {
        // Serve marketplace app
        const templatePath = path.resolve(marketplaceRoot, "index.html");
        let template = await fs.promises.readFile(templatePath, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        const page = await marketplaceVite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      }
    } catch (e) {
      marketplaceVite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
