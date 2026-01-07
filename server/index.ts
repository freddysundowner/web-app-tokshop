/**
 * Admin App server entry point
 *
 * This runs the Admin App.
 * For the marketplace app, change adminAppDir to marketplaceAppDir
 * To run both apps, use: ./run-both.sh
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from admin-app directory BEFORE changing directory
const adminAppDir = path.join(__dirname, "..", "admin-app");
dotenv.config({ path: path.join(adminAppDir, ".env") });

// Change to admin-app directory
process.chdir(adminAppDir);
console.log("[Admin Server] Changed directory to:", process.cwd());

// Import the admin app server using absolute path
const serverPath = path.join(process.cwd(), "server.ts");
console.log("[Admin Server] Loading server from:", serverPath);

import(serverPath).catch((err) => {
  console.error("[Admin Server] Failed to load admin server:", err);
  process.exit(1);
});
