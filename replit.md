# Tokshop

## Overview

Tokshop is a monorepo containing two web applications:

1. **Main App** (`/client`) - A minimal web experience showcasing the "tokshop" brand
2. **Marketplace App** (`/marketplace-app`) - A live streaming marketplace platform with real-time video streaming, auctions, chat, and product sales

Both applications are built with React, TypeScript, and Vite, sharing similar UI component libraries (shadcn/ui) but serving different purposes. The marketplace app is a full-featured e-commerce platform with live streaming capabilities, while the main app is a simple landing page.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure

The project is organized as a monorepo with two independent frontends and a shared backend:

- **`/client`** - Minimal landing page application
- **`/marketplace-app`** - Full marketplace application with seller and buyer features
- **`/shared-backend`** - Shared server logic used by marketplace-app (referenced but not in provided files)

**Key Decision**: Separate applications instead of a unified codebase allows independent development and deployment of the simple landing page versus the complex marketplace features.

### Frontend Architecture

#### Routing
Both applications use **Wouter** for client-side routing instead of React Router.

**Rationale**: Wouter is a lightweight alternative to React Router, providing essential routing functionality with a smaller bundle size.

#### State Management
- **TanStack Query (React Query)** - Server state management and data fetching
- **React Context** - Local state management (Auth, Settings, Socket contexts in marketplace app)

**Key Pattern**: The marketplace app uses a centralized query client with custom fetch wrappers that handle authentication and error states consistently across the application.

#### UI Components
Both apps use **shadcn/ui** with **Radix UI** primitives and **Tailwind CSS** for styling.

**Design Decision**: The component library is duplicated between apps (not shared) to allow independent customization. The main app uses Space Grotesk font, while the marketplace uses Inter font.

#### Lazy Loading Strategy
The marketplace app initially used lazy loading for all routes but encountered critical issues on mobile Safari.

**Problem Solved**: Large lazy-loaded components caused "Maximum call stack size exceeded" errors on iPhone Safari. The solution was to refactor monolithic components into smaller, directly-imported modules and move lazy loading only to the route level.

**Architecture Pattern for Large Components**:
```
Main Orchestrator File
├── All state management
├── All data fetching
├── All event handlers
└── Renders independent UI components (directly imported, not lazy)
```

### Real-Time Features (Marketplace App)

#### Video Streaming
- **LiveKit** - WebRTC-based live video streaming platform
- **@livekit/components-react** - Pre-built React components for video players and controls

**Rationale**: LiveKit provides production-ready WebRTC infrastructure without managing TURN/STUN servers.

#### Real-Time Communication
- **Socket.IO** - Bidirectional event-based communication for auctions, chat, and live show updates
- **Firebase** - Chat message persistence and real-time synchronization

**Key Decision**: Use Socket.IO for ephemeral real-time events (bids, viewer counts) and Firebase for persistent chat history, leveraging each service's strengths.

### Styling Architecture

#### CSS Custom Properties
Both apps use CSS custom properties for theming with light mode defaults:
- Shadcn/ui design tokens (background, foreground, primary, etc.)
- Custom tokens for marketplace features (live indicator, auction timer)

#### Tailwind Configuration
- Shared plugin usage (autoprefixer)
- Custom utility classes for elevation effects ("hover-elevate", "active-elevate")
- Responsive breakpoints using Tailwind defaults

**Design Decision**: CSS variables enable runtime theme switching and consistent color management across components.

### Build System

#### Vite Configuration
- **React plugin** - Fast Refresh and JSX transformation
- **Path aliases** - `@/` for client src, `@shared/` for shared backend code
- **Smart Zod resolution** - Handles both local and root node_modules (Replit vs production)

**Problem Solved**: The marketplace app needs to import shared validation schemas from the backend. The Vite config uses dynamic resolution to check local node_modules first, then root, ensuring compatibility in both Replit and production environments.

#### TypeScript Configuration
- **Module resolution**: "bundler" mode for modern module patterns
- **Path mapping**: Matches Vite aliases for seamless imports
- **No emit**: TypeScript only for type checking, Vite handles compilation

### Mobile Optimization

The marketplace app faced significant mobile Safari compatibility issues that drove key architectural decisions:

**Challenge**: 4615-line monolithic components crashed on iPhone Safari
**Solution**: Component decomposition with these principles:
1. Main files contain logic only (no UI)
2. UI components are pure and independent
3. Components can be individually disabled for debugging
4. Direct imports instead of dynamic lazy loading

## External Dependencies

### UI & Styling
- **@radix-ui/\*** - Accessible component primitives (accordion, dialog, dropdown, etc.)
- **tailwindcss** - Utility-first CSS framework
- **class-variance-authority** - Component variant management
- **lucide-react** - Icon library

### Data Fetching & State
- **@tanstack/react-query** - Server state management
- **wouter** - Lightweight routing library

### Forms & Validation
- **react-hook-form** - Form state management
- **@hookform/resolvers** - Validation schema integration
- **zod** - Runtime type validation (shared with backend)

### Live Streaming (Marketplace App)
- **@livekit/components-react** - Video streaming UI components
- **@livekit/components-styles** - Pre-built styling for LiveKit
- **LiveKit Cloud** - Backend video infrastructure (external service)

### Real-Time Communication (Marketplace App)
- **socket.io-client** - Real-time bidirectional events
- **Firebase** - Chat persistence and real-time database (external service)

### Payment Processing (Marketplace App)
- **@stripe/stripe-js** - Stripe JavaScript SDK
- **@stripe/react-stripe-js** - React components for Stripe
- **Stripe API** - Payment processing (external service)

### Email (Marketplace App)
- **@sendgrid/mail** - Transactional email service
- **nodemailer** - SMTP email client
- **SendGrid API** - Email delivery (external service)

**Email Features**:
- Multi-provider support (SendGrid, Mailgun, Resend, SMTP)
- Show analytics emails sent when shows end
- HTML email templates with fallback text versions
- Automatic email triggering via PUT /api/rooms/:id endpoint when `ended: true`

### Build & Development
- **vite** - Build tool and dev server
- **@vitejs/plugin-react** - Vite plugin for React
- **esbuild** - JavaScript bundler for production server
- **typescript** - Type checking
- **tsx** - TypeScript execution for development

### Development Tools (Replit-specific)
- **@replit/vite-plugin-runtime-error-modal** - Runtime error overlay
- **@replit/vite-plugin-cartographer** - Development tooling (conditional, only in Replit)

### Backend Runtime (Marketplace App)
- **express** - Web server framework
- **dotenv** - Environment variable management
- **Node.js** - Server runtime

### Media Handling (Marketplace App)
- **multer** - File upload middleware (referenced in types)

## Recent Changes (November 22, 2025)

### Help Center System

A public-facing help center has been added to the marketplace app with a Whatnot-style design:

**Location**: `/marketplace-app/client/src/pages/marketplace/`
- `help-center.tsx` - Main help center page with article grid
- `help-article.tsx` - Individual article detail page

**Routes**:
- `/help-center` - Public help center landing page
- `/help-center/:slug` - Individual article pages

**API Endpoints** (Public, no authentication required):
- `GET /api/articles/published` - Fetch all published articles
- `GET /api/articles/published/:slug` - Fetch single article by slug

**Features**:
- Hero section with gradient background and dark wash overlay
- Breadcrumb navigation (Home > Help Center > Category)
- Search bar for filtering articles (client-side)
- Category filter buttons
- 3-column responsive grid of article cards
- Individual article pages with formatted content
- Help footer with "Contact Support" and "View FAQ" links

**Design**:
- Matches Whatnot's help center aesthetic with hero section
- Uses shadcn/ui components throughout
- Fully responsive with mobile-first approach
- Articles stored in MongoDB via external API
- Category badges and excerpt previews on article cards

**Data Storage**:
- Help articles are stored in MongoDB (dynamic business data)
- Managed through admin panel at `/admin/help-articles`
- Separate from static content pages (which use Firebase)

**Important Note**: 
- The marketplace app runs independently from the admin app
- The admin app is currently served by the default workflow on port 5000
- To access the marketplace app help center, you need to either:
  1. Create a separate workflow to run the marketplace app
  2. Or manually navigate to the marketplace app URL if it's running
  3. Or switch the default workflow to serve the marketplace app instead