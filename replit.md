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
- **Admin App Routes**: Dashboard, User Management, Product Management, Order Management, App Settings, **Content Pages Management**.
- **Marketplace App Routes**: Live Show Browsing, Category Browsing, Live Show Viewer, Product Details, Auction Detail Page, Seller Dashboard, User Profile, Authentication flows, **Dynamic Content Pages** (FAQ, About, Privacy, Terms, Contact).
- **Scheduled Featured Auctions**: Implemented with absolute start/end times, distinct display states, and validation.
- **Age Verification**: Mandatory age verification for all users (18+) implemented via a non-dismissible dialog and profile field.
- **Deals Page**: Dedicated page for featured auctions and trending products with responsive display and navigation.
- **Bid Tracking System**: Implements reliable bid tracking with `custom_bid` flag inheritance, state management for `currentUserBid`, and real-time updates via Socket.IO. Includes enhanced UX for max bid limits and alerts when autobid limits are exceeded.
- **Shipping Estimate Optimization**: Show owners are automatically excluded from shipping estimate API calls across all paths (auction start, pinned products, Socket.IO events). Uses ref-based persistence with proper cleanup on room changes to prevent unnecessary API calls while preserving full functionality for viewers.
- **Unified Payment/Shipping Validation**: All bid flows (regular, custom, mobile, desktop, scheduled auctions) route through `placeBidMutation` which enforces payment/shipping validation before allowing bids. Mutation supports both number format (regular bids) and object format with custom parameters (custom bids with autobid). Shows `PaymentShippingAlertDialog` and `PaymentShippingSheet` for adding missing info.
- **Content Management System (CMS)**: Comprehensive page content management through Admin Panel with dynamic display on marketplace. Admins can edit Landing Page, FAQ, About Us, Privacy Policy, Terms of Service, and Contact pages. Content stored in Firestore `app_content` collection with 5s timeout and fallback to defaults. API endpoints: GET `/api/content/:pageType` (public), PUT `/api/admin/content/:pageType` (admin-only), POST `/api/admin/content/:pageType/reset` (admin-only). Specialized Zod schemas for each page type with validation (except landing page which needs refactoring for validation). Marketplace pages dynamically load content from API using TanStack Query. TypeScript path `@shared` maps to `shared-backend/shared/` for schema imports. Vite configs use smart zod resolution for production builds.
- **Shipping Page Filtering**: Seller shipping page includes show and status filter dropdowns. Show filter displays "All Shows & Marketplace", "Marketplace", and ended shows with dates/times. Fetches ended shows via `/api/rooms?status=ended&userid=<sellerId>`. Filter parameters: `tokshow` for specific shows, `marketplace=true` for marketplace-only orders. Status filter dropdown replaces tabs with options: All, Need Label, Ready to Ship, Shipped, Cancelled. Reset Filters button clears both filters. Dropdowns auto-resize (min-width: 256px, max-width: 448px). Filters work together for combined filtering. Search and customer filter removed for simplified interface.
- **USPS Scan Form Generation**: Implemented "Generate Scan Form" feature on seller shipping page with conditional button behavior (View vs Generate). Button positioned far right of filters section. Validation requires ALL orders in show to have `shipment_id` before generation. Uses separate query (`show-orders-all`) independent of pagination/filtering for accurate validation. Dialog displays loading states (blue banner), error states (red banner with retry), and validation errors (missing shipment IDs). Confirm button disabled during loading, error, or validation failure. API endpoint: `/shipping/generate/manifest` with `tokshow` parameter. Button disabled for "all" and "marketplace" scopes with toast notification. Query invalidation ensures fresh data after generation. Response handling uses server-provided messages without hardcoded errors.

## External Dependencies
- **External API Server**: Primary backend for all data storage and operations.
- **Firebase**: User authentication (Google, Facebook, email/password), real-time chat (one-on-one & show chat), and image storage.
- **Socket.IO**: Real-time bid management, product updates, and show events.
- **Stripe**: Payment processing.
- **LiveKit Cloud**: Live video streaming infrastructure.
- **SendGrid**: Email delivery services.
- **PostgreSQL**: Database used by the external backend API.