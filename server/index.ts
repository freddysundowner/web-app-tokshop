/**
 * Marketplace App server entry point
 *
 * This runs the Marketplace App.
 * For the admin app, change marketplaceAppDir to adminAppDir
 * To run both apps, use: ./run-both.sh
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const marketplaceAppDir = path.join(__dirname, "..", "marketplace-app");
const adminAppDir = path.join(__dirname, "..", "admin-app");

// Load .env from the target app directory BEFORE changing directory
dotenv.config({ path: path.join(adminAppDir, ".env") });

// Change to the target app directory so Vite picks up the right config
process.chdir(adminAppDir);
console.log("[Admin Server] Changed directory to:", process.cwd());

// Import the app server using an absolute path
const serverPath = path.join(process.cwd(), "server.ts");
console.log("[Admin Server] Loading server from:", serverPath);

import(serverPath).catch((err) => {
  console.error("[Admin Server] Failed to load server:", err);
  process.exit(1);
});
