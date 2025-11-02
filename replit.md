# Icona - Live Streaming Marketplace Platform

## Overview

Icona is a full-stack live streaming marketplace platform that connects sellers and buyers through interactive video commerce. The application enables sellers to broadcast live shows, showcase products in real-time, and process transactions while viewers can browse, purchase, and interact during live streams.

**Core Purpose**: Enable a marketplace ecosystem where sellers can conduct live shopping experiences and buyers can discover products through live video streams.

**Technology Stack**:
- Frontend: React with TypeScript, Vite build system
- Backend: Express.js (referenced but shared across apps)
- Database: PostgreSQL with Drizzle ORM
- Real-time: LiveKit for video streaming, Socket.IO for chat/interactions
- Styling: Tailwind CSS with shadcn/ui component library
- State Management: TanStack Query (React Query)
- Authentication: Firebase Auth with social providers
- Payments: Stripe integration

## Recent Changes

### Build System Fixes (November 2024)

**Critical Issues Resolved**:

1. **Marketplace App Build Failure**
   - **Problem**: `tailwind.config.ts` had syntax error preventing builds
   - **Solution**: Copied working configuration from admin-app
   - **Impact**: marketplace-app now builds successfully in all contexts

2. **PostCSS Configuration**
   - **Problem**: Apps were missing `postcss.config.js`, causing CSS processing issues
   - **Solution**: Created `postcss.config.js` at root and ensured it's copied to each app during packaging
   - **Files Modified**: `create-packages.sh` now copies postcss config to all apps

3. **Package Deployment Instructions**
   - **Problem**: README files instructed to run `npm install` at package root (no package.json exists there)
   - **Solution**: Updated both `DEPLOY-WEB-FULL-PLATFORM.md` and `DEPLOY-ADMIN-FOR-FLUTTER.md` with correct instructions
   - **Correct Flow**: Navigate to each app directory → run `npm install` → run `npm run build`

4. **Dependency Resolution**
   - **Problem**: Apps couldn't find dependencies when server changed to app directory
   - **Solution**: Created `node_modules` symlinks in each app pointing to root `node_modules/`
   - **Why Needed**: Express server uses `process.cwd()` which changes working directory

**Build Status**:
- ✅ admin-app builds successfully (root, web-full-platform, admin-for-flutter)
- ✅ marketplace-app builds successfully (root, web-full-platform)
- ✅ All deployment packages verified working

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure

**Decision**: Multi-app monorepo with deployment packaging system
- **Rationale**: Separate apps for different deployment scenarios - full web platform vs admin-only for Flutter mobile
- **Root Structure**:
  - `admin-app/` - Admin panel for platform management (port 5000)
  - `marketplace-app/` - Buyer/seller marketplace and seller dashboard (port 5001)  
  - `shared-backend/` - Shared Express API routes and business logic
  - `packages/` - Generated deployment packages (created by `create-packages.sh`)
- **Deployment Packages**:
  - `web-full-platform/` - Both admin + marketplace apps for complete web deployment
  - `admin-for-flutter/` - Admin panel only, pairs with Flutter mobile app
- **Dependency Management**:
  - All dependencies installed at root level (`node_modules/`)
  - Each app has `node_modules` symlink pointing to root
  - Required for Express server which changes to app directory via `process.cwd()`

### Frontend Architecture

**Decision**: Component-based React SPA with client-side routing
- **Rationale**: Provides interactive, app-like experience needed for live streaming features
- **Implementation**:
  - Wouter for lightweight routing
  - Route structure separates marketplace (buyer), seller, and account flows
  - Component library (shadcn/ui) provides 50+ pre-built UI components for consistent design

**Key Routes**:
- Marketplace: `/`, `/browse`, `/category/:id`, `/search`, `/show/:id`, `/product/:id`
- Seller: `/seller/inventory`, `/seller/live-shows`, `/seller/analytics`, `/seller/shipping`
- Account: `/profile`, `/settings`, `/payments`, `/addresses`, `/orders`
- Auth: `/login`, `/signup`, `/seller-login`

### Backend Architecture

**Decision**: Express.js server with shared backend pattern
- **Rationale**: Both apps import from `shared-backend/server/index` for API routes, avoiding code duplication
- **Port Configuration**: 
  - Admin app: port 5000
  - Marketplace app: port 5001
- **Build Process**: ESBuild bundles each app's server for production with external packages
- **Server Entry Points**:
  - Root `server/index.ts` changes to `admin-app/` directory and imports `admin-app/server.ts`
  - `admin-app/server.ts` and `marketplace-app/server.ts` each import shared backend
  - Vite configuration uses `process.cwd()` to determine which client folder to serve

### Database Layer

**Decision**: PostgreSQL with Drizzle ORM
- **Rationale**: Type-safe database access with Drizzle provides excellent TypeScript integration
- **Schema Location**: `shared/schema.ts` contains database schemas shared between client and server
- **Migration Strategy**: Drizzle Kit manages migrations in `./migrations` directory
- **Current Schema**: Basic user table with username/password authentication (extensible for marketplace entities)

**Drizzle Configuration**:
```typescript
dialect: "postgresql"
schema: "./shared/schema.ts"
migrations: "./migrations"
```

### Real-time Video Streaming

**Decision**: LiveKit integration for video infrastructure
- **Rationale**: LiveKit provides scalable, low-latency video streaming ideal for live shopping
- **Implementation**: `LiveKitVideoPlayer` component wraps LiveKit React SDK
- **Features**: 
  - Camera and screen share support
  - GPU-accelerated rendering
  - Room-based architecture for live shows
  - Audio rendering for viewers

### Authentication System

**Decision**: Multi-provider authentication with Firebase + custom backend
- **Rationale**: Firebase handles OAuth complexity while custom backend manages user profiles
- **Flow**:
  1. User authenticates via Firebase (social or email/password)
  2. Frontend sends auth token to backend
  3. Backend creates/updates user profile in PostgreSQL
  4. Session managed via cookies (`credentials: "include"`)
- **Social Auth Completion**: Custom form (`SocialAuthCompleteForm`) collects additional profile data after OAuth login

**User Schema**:
```typescript
users {
  id: uuid (auto-generated)
  username: text (unique)
  password: text
  // Extended via shared-backend with seller status, profile data, etc.
}
```

### Payment Processing

**Decision**: Stripe Elements integration for payment collection
- **Rationale**: PCI-compliant payment handling without storing card data
- **Implementation**:
  - `AddPaymentDialog` component wraps Stripe Elements
  - Backend creates Stripe customers and payment methods
  - Setup intents for card verification
- **Security**: Card data never touches application servers

### State Management & Data Fetching

**Decision**: TanStack Query for server state with custom fetch wrapper
- **Rationale**: Handles caching, invalidation, and loading states declaratively
- **Configuration**:
  - No automatic refetch on window focus
  - Infinite stale time (manual invalidation)
  - Custom `apiRequest` wrapper for authenticated requests
  - 401 handling with configurable behavior (throw or return null)

**Query Client Setup**:
```typescript
defaultOptions: {
  queries: {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    credentials: "include"
  }
}
```

### UI Component System

**Decision**: shadcn/ui component library with Tailwind CSS
- **Rationale**: Provides accessible, customizable components that can be modified directly in codebase
- **Theme System**:
  - CSS custom properties for theming (`--primary`, `--background`, etc.)
  - Light mode optimized with planned dark mode support
  - Responsive breakpoints (mobile: 768px)
- **Component Categories**:
  - Form controls (Input, Select, Checkbox, Switch)
  - Layout (Card, Sidebar, Sheet, Dialog)
  - Data display (Table, Badge, Avatar)
  - Feedback (Toast, Alert, Skeleton)

### Settings & Context Management

**Decision**: React Context for global app state
- **Rationale**: Lightweight state sharing for auth, settings, and socket connections
- **Providers**:
  - `AuthProvider`: User session and authentication state
  - `SettingsProvider`: App configuration and user preferences
  - `SocketProvider`: Real-time connection management
  - `TooltipProvider`: UI component context

### Build & Development

**Decision**: Vite for frontend build with custom configuration
- **Rationale**: Fast HMR during development, optimized production builds
- **Path Aliases**:
  - `@/*` → `./client/src/*` (app code)
  - `@shared/*` → `../shared-backend/shared/*` (shared types)
  - `@assets/*` → `../attached_assets` (media files)
- **Plugins**:
  - React plugin for JSX transformation
  - Runtime error overlay for development
  - Cartographer for Replit integration (dev only)

**Output Structure**:
```
dist/
  public/     # Frontend build (Vite)
  server.js   # Backend bundle (ESBuild)
```

### Responsive Design Strategy

**Decision**: Mobile-first with progressive enhancement
- **Rationale**: Many users will access marketplace from mobile devices
- **Implementation**:
  - `useIsMobile` hook for responsive behavior (768px breakpoint)
  - Conditional rendering for mobile vs desktop layouts
  - Sheet/Dialog for mobile overlays vs Sidebar for desktop
  - Tailwind responsive modifiers (`sm:`, `md:`, `lg:`)

## External Dependencies

### Video Infrastructure
- **LiveKit Cloud**: Real-time video streaming service
  - Handles video encoding, routing, and delivery
  - Room-based architecture for live shows
  - Requires LiveKit server URL and API credentials

### Authentication Services
- **Firebase Authentication**: User identity management
  - Supports Google, Facebook, email/password providers
  - Provides OAuth token for backend verification
  - Frontend SDK: `@livekit/components-react`, `firebase` (implied)

### Payment Processing
- **Stripe**: Payment infrastructure
  - Card tokenization via Stripe Elements
  - Customer and payment method management
  - Webhook handling for payment events (in shared-backend)
  - Required: Stripe publishable key (frontend), secret key (backend)

### Database
- **Neon PostgreSQL**: Serverless Postgres hosting
  - Configured via `DATABASE_URL` environment variable
  - `@neondatabase/serverless` driver for edge-compatible queries
  - Connection pooling handled by Neon

### Email Services
- **SendGrid**: Transactional email delivery
  - Order confirmations, seller notifications
  - Package: `@sendgrid/mail`
  - Required: SendGrid API key

### Real-time Communication
- **Socket.IO**: WebSocket communication (implied by SocketProvider)
  - Live chat during streams
  - Real-time auction updates
  - Presence tracking

### Third-party UI Libraries
- **Radix UI**: Headless component primitives
  - All dialog, dropdown, popover components built on Radix
  - Provides accessibility and keyboard navigation
- **Lucide React**: Icon library
  - Consistent icon set across application
- **Recharts**: Data visualization for analytics
  - Seller dashboard charts and metrics

### Development Tools
- **Replit Platform**: Development environment integration
  - Cartographer plugin for code navigation
  - Runtime error overlay for debugging
  - Available only in development (`process.env.REPL_ID`)

### Build & Type Safety
- **TypeScript**: Static type checking
  - Shared types between frontend/backend via `@shared/*`
  - Strict mode enabled for type safety
- **Zod**: Runtime validation
  - Schema validation for forms and API requests
  - Used with Drizzle for insert schemas
- **ESLint/Prettier**: Code quality (implied by typical setup)

### State & Forms
- **React Hook Form**: Form state management
  - Integrated with Zod via `@hookform/resolvers`
  - Optimized re-renders and validation
- **TanStack Query**: Server state synchronization
  - Caching and background updates
  - Optimistic updates for better UX

### Styling System
- **Tailwind CSS**: Utility-first CSS framework
  - Custom design tokens via CSS variables
  - Component variants via `class-variance-authority`
  - Merge utilities via `tailwind-merge` and `clsx`