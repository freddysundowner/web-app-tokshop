/**
 * Admin App server entry point
 *
 * This runs the Admin App on port 5001.
 * The Marketplace App runs on port 5000 via server/index.ts
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const adminAppDir = path.join(__dirname, "..", "admin-app");

// Load .env from the admin app directory BEFORE changing directory
dotenv.config({ path: path.join(adminAppDir, ".env") });

// Set port to 3000 so it doesn't conflict with the marketplace app (port 5000)
process.env.PORT = "3000";

// Change to the admin app directory so Vite picks up the right config
process.chdir(adminAppDir);
console.log("[Admin Server] Changed directory to:", process.cwd());

// Import the app server using an absolute path
const serverPath = path.join(process.cwd(), "server.ts");
console.log("[Admin Server] Loading server from:", serverPath);

import(serverPath).catch((err) => {
  console.error("[Admin Server] Failed to load server:", err);
  process.exit(1);
});
