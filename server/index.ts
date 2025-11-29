/**
 * Root server entry point
 *
 * This redirects to the marketplace app by default.
 * For the admin app, change marketplaceAppDir to adminAppDir
 * To run both apps, use: ./run-both.sh
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from marketplace-app directory BEFORE changing directory
const marketplaceAppDir = path.join(__dirname, "..", "marketplace-app");
dotenv.config({ path: path.join(marketplaceAppDir, ".env") });

// Change to marketplace-app directory
process.chdir(marketplaceAppDir);
console.log("[Root Server] Changed directory to:", process.cwd());

// Import the marketplace app server using absolute path
const serverPath = path.join(process.cwd(), "server.ts");
console.log("[Root Server] Loading server from:", serverPath);

import(serverPath).catch((err) => {
  console.error("[Root Server] Failed to load marketplace server:", err);
  process.exit(1);
});
