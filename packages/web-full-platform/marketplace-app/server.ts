// Marketplace App Server Entry Point
// This runs the shared backend on port 5001 for the marketplace/seller frontend

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import '../shared-backend/server/index';
