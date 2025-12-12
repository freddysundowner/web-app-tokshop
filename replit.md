# Tokshop

## Overview

Tokshop is a monorepo project comprising two primary web applications: an Admin App for platform management and a Marketplace App. The Marketplace App is a comprehensive live streaming e-commerce platform featuring real-time video, auctions, chat, and product sales. Both applications leverage React, TypeScript, and Vite, sharing a common UI component library (shadcn/ui) while serving distinct functionalities. The project aims to deliver a robust and scalable solution for live commerce.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure

The project is structured as a monorepo containing `/admin-app` (Admin App), `/marketplace-app` (Marketplace App), and a `/shared-backend`. The Marketplace App is the default application that runs on port 5000. To switch to the Admin App, edit `server/index.ts` and change `marketplaceAppDir` to `adminAppDir`. This separation allows for independent development and deployment while facilitating code sharing.

### Frontend Architecture

Both applications use **Wouter** for lightweight client-side routing. State management is handled by **TanStack Query** for server state and data fetching, and **React Context** for local state. UI components are built using **shadcn/ui**, **Radix UI** primitives, and **Tailwind CSS**. A key design decision involves duplicating the component library across apps for independent customization, with the Admin App using Space Grotesk font and the Marketplace App using Inter.

Lazy loading in the Marketplace App is primarily applied at the route level. Large, monolithic components are refactored into smaller, directly imported modules to prevent "Maximum call stack size exceeded" errors, especially on mobile Safari.

### Real-Time Features (Marketplace App)

**LiveKit** provides WebRTC-based live video streaming, utilizing `@livekit/components-react` for UI. **Socket.IO** manages bidirectional event-based communication for dynamic features like auctions and viewer counts. **Firebase** is used for persistent chat message storage and real-time synchronization, leveraging the strengths of both services.

### Styling Architecture

Both applications use CSS custom properties for theming, incorporating Shadcn/ui design tokens and custom tokens for marketplace-specific features. **Tailwind CSS** is used for utility-first styling, including custom utility classes and responsive breakpoints.

### Build System

**Vite** serves as the build tool and development server, configured with a React plugin and path aliases for efficient module resolution. TypeScript is used purely for type checking, with Vite handling compilation. A smart Zod resolution addresses module import paths in different environments.

### Mobile Optimization

Significant effort was directed at optimizing the Marketplace App for mobile Safari. This involved a strategic decomposition of large components into smaller, independent modules, prioritizing direct imports over dynamic lazy loading for improved performance and stability.

### Feature Specifications

*   **Help Center System**: A public-facing help center has been added to the marketplace app, accessible at `/help-center` and `/help-center/:slug`. It features a hero section, breadcrumbs, client-side search, category filters, and a responsive grid of article cards. Articles are stored in MongoDB.
*   **Rally/Raid Feature**: Allows a host to "raid" another live show, redirecting their viewers. This involves a dialog for selecting a target show, socket events (`rally`, `rally-in`), and Firebase for chat announcements. Race conditions related to source show ID capture, `useEffect` cleanup, navigation timing, and socket auto-rejoin have been addressed.
*   **User Badge System**: Implemented `badgeTier` property for users (`rising`, `verified`, `icona`). These badges are displayed via a reusable `UserBadge` component across various user-facing parts of the application (e.g., profile, show cards, rally dialog, chat).
*   **Featured Shows Page**: A dedicated page at `/featured/shows` displays all featured shows, similar to the existing `/trending/products` page.

## External Dependencies

### UI & Styling
- **@radix-ui/\*** (Accessible component primitives)
- **tailwindcss** (Utility-first CSS framework)
- **class-variance-authority** (Component variant management)
- **lucide-react** (Icon library)

### Data Fetching & State
- **@tanstack/react-query** (Server state management)
- **wouter** (Lightweight routing library)

### Forms & Validation
- **react-hook-form** (Form state management)
- **@hookform/resolvers** (Validation schema integration)
- **zod** (Runtime type validation)

### Live Streaming (Marketplace App)
- **@livekit/components-react** (Video streaming UI components)
- **@livekit/components-styles** (Pre-built styling for LiveKit)
- **LiveKit Cloud** (Backend video infrastructure)

### Real-Time Communication (Marketplace App)
- **socket.io-client** (Real-time bidirectional events)
- **Firebase** (Chat persistence and real-time database)

### Payment Processing (Marketplace App)
- **@stripe/stripe-js** (Stripe JavaScript SDK)
- **@stripe/react-stripe-js** (React components for Stripe)
- **Stripe API** (Payment processing)

### Email (Marketplace App)
- **@sendgrid/mail** (Transactional email service)
- **nodemailer** (SMTP email client)
- **SendGrid API** (Email delivery)

### Build & Development
- **vite** (Build tool and dev server)
- **@vitejs/plugin-react** (Vite plugin for React)
- **esbuild** (JavaScript bundler)
- **typescript** (Type checking)
- **tsx** (TypeScript execution)

### Backend Runtime (Marketplace App)
- **express** (Web server framework)
- **dotenv** (Environment variable management)
- **Node.js** (Server runtime)

### Media Handling (Marketplace App)
- **multer** (File upload middleware)