# TokShop - Live Streaming Marketplace Platform

## Overview
TokShop is a live streaming marketplace platform, similar to TikTok Shop, designed to allow sellers to host live shows, display products, and process transactions in real-time. Viewers can browse, purchase, and interact during these live streams. The project is a monorepo containing two React web applications: an Admin Panel for platform management and a Marketplace App for buyers and sellers. It is built as a pure API client, connecting to an external Icona API for all data operations, and is designed for easy deployment on DigitalOcean. The vision is to create a dynamic e-commerce ecosystem leveraging live video.

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
- **Authentication**: Firebase Auth (Google, Facebook, email/password) is used. Firebase configuration is loaded dynamically from the external API's settings endpoint (via the `firebase_config` field), with a default fallback config if not provided. The frontend sends Firebase tokens to the backend for validation, and sessions are managed via cookies.
- **API Requests**: All API calls are managed using `@tanstack/react-query`, with a custom `apiRequest` wrapper for authentication.
- **Forms**: `react-hook-form` is used with Zod validation for robust and consistent form handling.
- **Build System**: Vite is used for development with HMR. For production, Vite builds the frontend, and ESBuild bundles the backend.

**Feature Specifications:**
- **Admin App Routes**: Dashboard, User Management, Product Management, Order Management, App Settings.
- **Marketplace App Routes**: Live Show Browsing, Category Browsing, Live Show Viewer, Product Details, Seller Dashboard, User Profile, Authentication flows.

## External Dependencies
The project relies on several key external services and APIs:

-   **External API Server**: The primary external backend for all data storage and operations (configurable via BASE_URL environment variable).
-   **Firebase Auth**: Used for user authentication (supporting Google, Facebook, and email/password).
-   **Stripe**: Integrated for handling payment processing.
-   **LiveKit Cloud**: Provides the infrastructure for live video streaming capabilities.
-   **Socket.IO**: Used for real-time chat and interactions within the platform.
-   **SendGrid**: Utilized for email delivery services.
-   **PostgreSQL**: The external Icona API uses PostgreSQL as its database.