// Admin App Server Entry Point
// This runs the shared backend on port 5000 for the admin frontend

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import '../shared-backend/server/index';
