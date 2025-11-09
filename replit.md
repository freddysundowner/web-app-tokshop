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

**Recent Updates (November 2025):**
- **Socket.IO Connection Fix (November 9, 2025):**
  - Fixed socket stuck in "connecting" state on show view page
  - Socket now connects immediately when user navigates to show view page (via `connect()` in mount effect)
  - Room joining occurs immediately when `isConnected === true` (no longer waits for show to start)
  - Fixed duplicate join-room events by removing duplicate call from `useShowSocketEvents` hook
  - Room joining now only happens in show-view.tsx mount effect (single source of truth)
  - Automatic reconnections after network disruptions still properly rejoin rooms
  - **Auction Detail Page Socket Integration**: Added complete socket integration to auction detail page
    - Connects socket on mount, disconnects on unmount
    - Emits `join-schedule-auction` event with auction ID (from `auction._id`), user ID, and user name when socket connects
    - Emits `leave-schedule-auction` event when leaving the page
    - Fixed duplicate join events by using `auctionIdRef` to store auction ID on first load only
    - Emits `place-bid` socket event with `type: 'scheduled'` for scheduled auctions
    - Listens to `bid-updated` and `auction-ended` socket events (no `auction-time-extended` for scheduled auctions with fixed times)
    - Fallback query invalidation ensures UI updates even if socket events are delayed
    - Enables real-time bid updates and auction status changes for scheduled/featured auctions
  - **Scheduled Auction Data Structure**: Moved `start_time_date` and `end_time_date` fields to be read exclusively from `auction` object
    - Frontend now reads scheduling times only from `auction.start_time_date` and `auction.end_time_date`
    - Removed all fallbacks to product-level fields for cleaner data structure
  - **Timezone Fix for Scheduled Auctions**: Fixed timezone handling for scheduled auction start/end times
    - Frontend converts datetime-local inputs to timestamps in user's local timezone before sending to server
    - Prevents server from misinterpreting times as UTC when user is in different timezone
    - Server receives pre-converted timestamps instead of datetime strings
    - Ensures countdown timers and auction start/end times are accurate for users in all timezones
  - **Auction Start State Display Fix**: Fixed UI to properly indicate when scheduled auctions haven't started yet
    - Shows "Starts in: XX hours" instead of "Time Remaining" for auctions that haven't started
    - Displays "Auction Not Started" message and disables bid button until actual start time
    - Automatically enables bidding when auction reaches its scheduled start time
    - Added socket listener for `scheduled-auction-created` event to auto-refresh when cron creates new daily auction
  - **Profile Picture Cache Fix (November 9, 2025)**: Fixed header avatar not updating after profile picture upload
    - Replaced full page reload with React Query cache invalidation
    - Invalidates all profile-related queries (`/api/profile/${userId}`)
    - Calls `refreshUserData()` to update auth context
    - Both sidebar and header avatars now update immediately without page reload
  - **Inventory Form Improvements (November 9, 2025)**:
    - **Show Dropdown Hidden for Featured Auctions**: Show dropdown is now hidden when listing type is auction AND featured is true
      - Prevents sellers from assigning featured/scheduled auctions to specific shows
      - Featured auctions are standalone scheduled auctions that don't belong to any live show
    - **Featured Section Hidden for Giveaways**: Featured section is now hidden when listing type is giveaway in inventory form
      - Giveaways cannot be marked as featured products - enforced at multiple layers
      - Only buy_now and auction types can be featured
      - **UI Conditional Logic**: Featured field hidden when `listingType !== 'giveaway' && selectedShow === 'general'`
      - **React Hook Form Subscription Fix**: Changed from `form.watch()` to `useWatch()` to ensure component re-renders when watched values change (fixes issue where featured field would appear for giveaways assigned to specific shows)
      - **Frontend enforcement**: useEffect automatically sets `featured: false` when listing type changes to giveaway (both inventory-product-form.tsx and product-form.tsx)
      - **Submit-time enforcement**: Submit handlers explicitly force `featured: false` for giveaways before sending data
      - **Backend hardening**: Both POST and PUT endpoints in giveaways.ts force `featured: false` to prevent future client regressions
    - **Giveaway Endpoint Routing Fix**: Fixed inventory pages to use correct endpoints for giveaways
      - **add-product.tsx**: Routes giveaway creation to POST `/api/giveaways` instead of POST `/api/products/${userId}`
      - **edit-product.tsx**: Routes giveaway updates to PUT `/api/giveaways/${productId}` instead of PATCH `/api/products/${productId}`
      - Regular products (buy_now, auction) still use `/api/products` endpoints as expected
    - **Shipping Profile Fix for Giveaways**: Fixed shipping profile handling to ensure valid ObjectIds are sent to external API
      - **Frontend (inventory-product-form.tsx)**: Validates giveaways must have shipping profile selected, only sends `shipping_profile` field if a valid profile is selected
      - **Frontend (product-form.tsx)**: Validates giveaways must have shipping profile selected before submission
      - **Backend (giveaways.ts)**: Renames `shippingProfile` to `shipping_profile` in POST/PUT endpoints, only includes field if valid profile provided (no "skip" fallback)
      - External API expects `shipping_profile` to be a valid ObjectId (MongoDB ID), not a string like "skip"
      - Frontend validation ensures users select a shipping profile before submission
    - **Giveaway Duration Simplified (November 9, 2025)**: Removed duration field from giveaway UI and set default to 5 minutes
      - Duration field removed from both inventory-product-form.tsx and product-form.tsx
      - All giveaways automatically set to 300 seconds (5 minutes) duration
      - Users can no longer customize giveaway duration - standardized to 5 minutes for all giveaways
    - **Giveaway Show Assignment Required (November 9, 2025)**: All giveaways must be assigned to a specific show
      - Giveaways cannot be assigned to "General Inventory" - they must belong to a show
      - **Frontend (inventory-product-form.tsx)**: Show dropdown marked as required (*) for giveaways, validation prevents submission without show selection
      - **Frontend (product-form.tsx)**: Validation ensures giveaways have a show assigned (automatically set from roomId in live show context)
      - Show assignment label and description updated to indicate giveaways require a show
      - Validation displays error toast if user attempts to create giveaway without selecting a show
      - **Show Endpoint Fix**: Inventory page show selection now uses `status=active` instead of `status=true` when fetching user's shows

## External Dependencies
-   **External API Server**: Primary backend for all data storage and operations.
-   **Firebase Auth**: User authentication (Google, Facebook, email/password).
-   **Stripe**: Payment processing.
-   **LiveKit Cloud**: Live video streaming infrastructure.
-   **Socket.IO**: Real-time chat and interactions.
-   **SendGrid**: Email delivery services.
-   **PostgreSQL**: Database used by the external backend API.