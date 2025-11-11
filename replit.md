# TokShop - Live Streaming Marketplace Platform

## Overview
TokShop is a live streaming marketplace platform, similar to TikTok Shop, enabling sellers to host live shows, display products, and process real-time transactions. Viewers can interact, browse, and purchase during these streams. The project is a monorepo comprising two React web applications: an Admin Panel for platform management and a Marketplace App for buyers and sellers. It functions purely as an API client, relying on an external backend API for all data operations, and is designed for easy deployment on DigitalOcean. The overarching vision is to cultivate a dynamic e-commerce ecosystem powered by live video.

## User Preferences
**Communication Style**: Simple, everyday language - avoid technical jargon

## System Architecture
TokShop's architecture is built as a pure API client, with both the Admin and Marketplace applications acting as frontends that communicate with an external API server. All routes within the `shared-backend/server/` directory serve as proxy routes to this external API.

**Monorepo Structure:**
- `admin-app/`: Admin panel application (port 5000) with React frontend and Express proxy server.
- `marketplace-app/`: Buyer/seller marketplace application (port 5001) with React frontend and Express proxy server.
- `shared-backend/`: Contains shared Express routes for API proxying.
- `packages/`: Generated deployment packages.

**UI/UX Decisions:**
- **Technology Stack**: React with TypeScript, Vite, Wouter for routing, TanStack Query for state management.
- **UI Components**: `shadcn/ui` with Tailwind CSS for consistent design.
- **Dynamic Branding**: App name and theme colors are dynamically loaded from the external API's settings and applied via CSS variables.

**Technical Implementations:**
- **Authentication**: Firebase Auth (Google, Facebook, email/password) is used, with configuration loaded dynamically from the external API's settings.
- **API Requests**: Managed using `@tanstack/react-query` with a custom `apiRequest` wrapper for authentication.
- **Forms**: `react-hook-form` with Zod validation.
- **Build System**: Vite for development, ESBuild for production backend bundling.
- **Deployment Configuration**: `ecosystem.config.cjs` files with PM2 settings are provided for easy deployment via environment variables.
- **LiveKit Video Quality**: Configured with explicit video encoding presets (3 Mbps bitrate for 1080p) and simulcast layers for adaptive streaming quality optimization.

**Feature Specifications:**
- **Admin App Routes**: Dashboard, User Management, Product Management, Order Management, App Settings.
- **Marketplace App Routes**: Live Show Browsing, Category Browsing, Live Show Viewer, Product Details, Auction Detail Page, Seller Dashboard, User Profile, Authentication flows.
- **Scheduled Featured Auctions**: Implemented with absolute start/end times, distinct display states, and validation.
- **Age Verification**: Mandatory age verification for all users (18+) implemented via a non-dismissible dialog and profile field.
- **Deals Page**: Dedicated page for featured auctions and trending products with responsive display and navigation.
- **Bid Tracking System**: Implements reliable bid tracking with `custom_bid` flag inheritance, state management for `currentUserBid`, and real-time updates via socket events. Includes enhanced UX for max bid limits and alerts when autobid limits are exceeded.
- **Shipping Estimate Optimization**: Show owners are automatically excluded from shipping estimate API calls across all paths (auction start, pinned products, socket events). Uses ref-based persistence with proper cleanup on room changes to prevent unnecessary API calls while preserving full functionality for viewers.

## External Dependencies
- **External API Server**: Primary backend for all data storage and operations.
- **Firebase Auth**: User authentication (Google, Facebook, email/password).
- **Stripe**: Payment processing.
- **LiveKit Cloud**: Live video streaming infrastructure.
- **Socket.IO**: Real-time chat and interactions.
- **SendGrid**: Email delivery services.
- **PostgreSQL**: Database used by the external backend API.