# TokShop - Live Streaming Marketplace Platform

## Overview
TokShop is a live streaming marketplace platform, similar to TikTok Shop, designed to allow sellers to host live shows, display products, and process transactions in real-time. Viewers can browse, purchase, and interact during these live streams. The project is a monorepo containing two React web applications: an Admin Panel for platform management and a Marketplace App for buyers and sellers. It is built as a pure API client, connecting to an external backend API for all data operations, and is designed for easy deployment on DigitalOcean. The vision is to create a dynamic e-commerce ecosystem leveraging live video.

## User Preferences
**Communication Style**: Simple, everyday language - avoid technical jargon

## System Architecture
TokShop's architecture is centered around being a pure API client. Neither the Admin nor the Marketplace applications have their own backend or database; they function as frontend applications that make API calls to an external API server. All routes within the `shared-backend/server/` directory act as proxy routes, forwarding requests to this external API.

**Monorepo Structure:**
- `admin-app/`: Admin panel application (port 5000), including client-side React frontend and an Express server for proxying.
- `marketplace-app/`: Buyer/seller marketplace application (port 5001), also with a React frontend and an Express proxy server.
- `shared-backend/`: Contains shared Express routes used by both applications for API proxying.
- `packages/`: Generated deployment packages (`web-full-platform` and `admin-for-flutter`).

**UI/UX Decisions:**
- **Technology Stack**: React with TypeScript, Vite, Wouter for routing, TanStack Query for state management.
- **UI Components**: `shadcn/ui` with Tailwind CSS for a consistent and modern design.
- **Dynamic Branding**: App name, primary, and secondary theme colors are loaded dynamically from the external API's settings endpoint via `SettingsContext`. Colors are converted to HSL and applied via CSS variables.

**Technical Implementations:**
- **Authentication**: Firebase Auth (Google, Facebook, email/password) is used. Firebase configuration is loaded dynamically from the external API's settings endpoint via individual fields (firebase_api_key, firebase_auth_domain, firebase_project_id, firebase_storage_bucket, firebase_app_id). The SettingsContext builds the firebase_config object from these fields and initializes Firebase. The AuthProvider waits for `isFirebaseReady` before setting up auth listeners. Firebase initialization is protected against placeholder config to prevent invalid Firestore operations.
- **API Requests**: All API calls are managed using `@tanstack/react-query`, with a custom `apiRequest` wrapper for authentication.
- **Forms**: `react-hook-form` is used with Zod validation for robust and consistent form handling.
- **Build System**: Vite is used for development with HMR. For production, Vite builds the frontend, and ESBuild bundles the backend.
- **Deployment Configuration**: Each package includes a pre-configured `ecosystem.config.cjs` file with PM2 settings. Customers edit this file to set their API URL before installation, simplifying the deployment process.

**Feature Specifications:**
- **Admin App Routes**: Dashboard, User Management, Product Management, Order Management, App Settings.
- **Marketplace App Routes**: Live Show Browsing, Category Browsing, Live Show Viewer, Product Details, Auction Detail Page, Seller Dashboard, User Profile, Authentication flows.

**Recent Updates (November 2025):**
- **iOS Safari Fixes:**
  - Resolved "Maximum call stack size exceeded" crash by implementing lazy loading with Suspense wrappers for PaymentShippingSheet and LiveKitVideoPlayer components
  - Fixed iOS header display using safe-area-inset-top padding and proper z-index hierarchy (header z-40, overlays z-30)
  - Corrected mobile chat pointer-events hierarchy: only chat avatar links to profile, adjusted positioning (right-20) to prevent overlap with video action icons
  - Fixed chat input typing issue by eliminating state shadowing: removed local `message` and `currentMentions` state from VideoCenter component in favor of parent-managed state, ensuring proper data flow through props

- **Auction Detail Page (November 7, 2025):**
  - Created dedicated eBay-style auction detail page at `/auction/:id` for improved auction UX
  - Features live countdown timer with visual urgency indicators (pulse animation for final 5 minutes)
  - Displays current bid and quick bidding functionality
  - Includes product image carousel, seller information, and real-time shipping cost calculation
  - Fetches actual shipping cost via `/api/shipping/estimate` endpoint (matches product detail page behavior)
  - Displays shipping cost with service level, shows loading state during calculation
  - Uses lazy loading with Suspense for CustomBidDialog to optimize bundle size
  - Polls auction data every 5 seconds to keep bid information fresh
  - Updated auction cards to navigate to dedicated auction page instead of generic product page
  - Fixed query client to properly construct product detail URLs (`/api/products/:id` instead of `/api/products?userId=:id`)
  - Simplified data fetching: single product endpoint returns full auction data with nested bids array
  - "Place Bid" button displays and sends `newbaseprice` from auction data
  - Removed bid history section for cleaner UI focused on current bid and placing bids

- **Scheduled Featured Auctions (November 7, 2025):**
  - Implemented scheduled auction system for featured auctions with absolute start/end times
  - Added `startTime` and `endTime` datetime fields to product form schema for featured auctions
  - Form now shows datetime pickers when user selects "Featured = Yes" and "Listing Type = Auction"
  - Backend sends `scheduledStartTime` and `scheduledEndTime` fields to external API
  - Auction cards display different states:
    - "Starts in X time" for auctions that haven't started yet
    - Live countdown for active auctions
    - "Ended" overlay for completed auctions
  - Auction detail page supports both scheduled (featured) and duration-based (live show) auctions
  - Featured auctions use absolute timestamps while live show auctions use duration + start time
  - Times are displayed in user's local timezone via browser's date handling

- **Responsive Design Improvements (November 7, 2025):**
  - **Inventory Page**: Made fully responsive while maintaining table layout
    - Header stacks vertically on mobile with responsive button text (abbreviated on small screens)
    - Search bar and filters use grid layout (2 columns on mobile, 4 on desktop)
    - Table enforces horizontal scrolling on mobile with `min-w-[800px]` constraint
    - Reduced padding and font sizes on mobile for better space utilization
    - Hidden less critical content (product descriptions, SKU) on narrow screens
    - Loading skeleton matches responsive behavior of actual table
  - **Pagination Component**: Implemented smart mobile pagination logic
    - Main container stacks vertically on mobile, horizontal on larger screens
    - Mobile view shows 3-page window centered on current page with boundary handling
    - First/last page buttons hidden on mobile to save space
    - Prev/next buttons and page numbers always accessible
    - Text and icon sizes reduced on mobile for better fit
    - Always shows current page regardless of position in pagination
    - For datasets with ≤5 pages, all pages shown on mobile

- **Deals Page (November 7, 2025):**
  - Created new `/deals` page showcasing featured auctions and trending products
  - Main deals page displays preview of 10 auctions and 6 trending products in responsive grid
  - Each section has "View All" button for expanded views
  - Created `/deals/auctions` page showing all available auctions (up to 100)
  - Created `/deals/trending` page showing all trending products (up to 100)
  - All pages feature proper loading states, empty states, and back navigation
  - Routes positioned next to `/browse` in App.tsx for logical navigation grouping
  - Uses responsive grid layout: 2 columns on mobile, scaling to 6 columns on extra-large screens
  - Increased grid spacing to prevent card overlap: `gap-4 md:gap-6` (16px mobile, 24px desktop)
  - Added "Deals" navigation link to header (appears between Browse and search bar)
  - Fetches auctions using same API as homepage: `featured=true`, `sortBy=views`, `status=active`
  - Auction detail page shipping estimate now includes `customer` parameter with current user ID

## External Dependencies
The project relies on several key external services and APIs:

-   **External API Server**: The primary external backend for all data storage and operations (configurable via BASE_URL environment variable).
-   **Firebase Auth**: Used for user authentication (supporting Google, Facebook, and email/password).
-   **Stripe**: Integrated for handling payment processing.
-   **LiveKit Cloud**: Provides the infrastructure for live video streaming capabilities.
-   **Socket.IO**: Used for real-time chat and interactions within the platform.
-   **SendGrid**: Utilized for email delivery services.
-   **PostgreSQL**: The external backend API uses PostgreSQL as its database.