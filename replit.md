# TokShop - Live Shopping Marketplace Platform

## Overview

TokShop is a live streaming e-commerce platform that enables sellers to host live video shows, showcase products in real-time, and process instant transactions. The project is structured as a monorepo with two frontend applications (Admin Panel and Marketplace) sharing a common backend. In development, a unified server on port 5000 serves both apps simultaneously. For production, each app can be deployed independently.

The platform supports live video streaming, real-time auctions, flash sales, giveaways, chat, product management, order processing, and seller/buyer dashboards.

**Note:** The `Archivezipzip/` directory is an archived copy of the project — always work from the root-level files and directories.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure

```
/
├── server/index.ts              # Development dual-app server (serves both apps on port 5000)
├── shared/schema.ts             # Root-level Drizzle schema (minimal, used by root config)
├── admin-app/                   # Admin Panel frontend application
│   ├── client/                  # React frontend (Vite)
│   ├── server.ts                # Production entry point (port 5000)
│   ├── vite.config.ts           # Vite config with path aliases
│   └── package.json             # Independent dependencies
├── marketplace-app/             # Marketplace frontend application
│   ├── client/                  # React frontend (Vite)
│   ├── server.ts                # Production entry point (port 5001)
│   ├── vite.config.ts           # Vite config with path aliases
│   └── package.json             # Independent dependencies
├── shared-backend/              # Shared Express server & API routes
│   ├── server/                  # Express server, routes, services
│   │   ├── index.ts             # Main server setup (sessions, middleware)
│   │   ├── routes.ts            # Route registration hub
│   │   ├── vite.ts              # Vite dev server integration
│   │   ├── firebase-admin.ts    # Firebase Admin SDK (dynamic init)
│   │   └── routes/              # Route modules (auth, orders, shows, etc.)
│   └── shared/                  # Shared types, schemas, utilities
│       ├── schema.ts            # Zod validation schemas & TypeScript types
│       └── pricing.ts           # Order calculation utilities
├── drizzle.config.ts            # Root Drizzle config (PostgreSQL)
├── package.json                 # Root dependencies & dev scripts
├── vite.config.ts               # Root Vite config
└── Archivezipzip/               # Archived copy — ignore this directory
```

### Development vs Production

- **Development:** Run `npm run dev` from root. The `server/index.ts` dual-app server creates two Vite dev servers — marketplace at `/` and admin at `/admin/*` — both on port 5000. It loads `.env` from the admin-app directory.
- **Production:** Each app builds and runs independently. Admin on port 5000, Marketplace on port 5001. Each app's `server.ts` imports from `shared-backend/server/index.ts`.

### Frontend Architecture

- **Framework:** React with TypeScript
- **Build Tool:** Vite with React plugin and `@replit/vite-plugin-runtime-error-modal`
- **Routing:** Wouter (lightweight client-side router)
- **State Management:** TanStack React Query for server state; React Context for local state
- **UI Components:** Shadcn/ui (New York style) built on Radix UI primitives
- **Styling:** Tailwind CSS with CSS custom properties for theming (HSL color tokens)
- **Forms:** React Hook Form with Zod resolvers via `@hookform/resolvers`
- **Path Aliases:** `@/` → `client/src/`, `@shared/` → `shared-backend/shared/`, `@assets/` → `attached_assets/`
- **Zod Resolution:** Vite configs include smart zod path resolution checking local then root `node_modules`

### Backend Architecture

- **Runtime:** Node.js with Express
- **Language:** TypeScript compiled via `tsx` (dev) and `esbuild` (production build)
- **API Pattern:** The backend acts as a proxy/middleware layer — it forwards requests to an external API at `BASE_URL` (configured via environment variable). It is NOT a standalone API with its own database for core business data.
- **Session Management:** Express sessions with header-based restoration (`x-access-token`, `x-admin-token`, `x-user-data` headers)
- **Authentication:** Firebase Admin SDK for token verification (Google/Apple social auth), initialized dynamically from settings API
- **Real-time:** Socket.IO for bidirectional events (auctions, chat, flash sales); LiveKit for WebRTC live video streaming

### Database

- **ORM:** Drizzle ORM with `drizzle-kit` for schema management
- **Database:** PostgreSQL via `@neondatabase/serverless`
- **Schema Location:** Root `shared/schema.ts` has a minimal users table; the main application schemas live in `shared-backend/shared/schema.ts` as Zod validation schemas (not Drizzle tables)
- **Migrations:** Run `npm run db:push` from root to push schema changes

### Key Design Decisions

1. **Proxy Backend Pattern:** The Express server proxies requests to an external API (`BASE_URL`). Core business data (products, orders, shows) lives on the external API, not in the local PostgreSQL database. The local DB is primarily for session/user scaffolding.

2. **Shared Backend:** Both apps import the same backend code from `shared-backend/` to avoid duplication. Route modules are organized by domain (auth, orders, shows, products, etc.).

3. **Independent App Builds:** Each app has its own `package.json`, `vite.config.ts`, `tailwind.config.ts`, and `postcss.config.js`. This allows independent deployment as separate packages.

4. **Mobile Optimization:** The marketplace app is heavily optimized for mobile Safari, with component decomposition to prevent call stack overflows on iOS devices.

## External Dependencies

### Third-Party Services
- **Firebase:** Authentication (Google/Apple social auth), Firestore, Cloud Storage — initialized dynamically via Firebase Admin SDK
- **Stripe:** Payment processing via `@stripe/stripe-js` and `@stripe/react-stripe-js` (client), `stripe` (server)
- **SendGrid:** Email delivery via `@sendgrid/mail`
- **LiveKit:** WebRTC live video streaming via `@livekit/components-react` and `@livekit/components-styles`
- **External API:** Core business API at `BASE_URL` env variable — handles products, orders, shows, users, and all business logic

### Key Libraries
- **UI:** Radix UI primitives, Tailwind CSS, Shadcn/ui component system
- **Data Fetching:** TanStack React Query
- **Forms:** React Hook Form + Zod validation
- **Routing:** Wouter
- **Database:** Drizzle ORM + `@neondatabase/serverless` (PostgreSQL)
- **Real-time:** Socket.IO (events), LiveKit (video)
- **Build:** Vite (frontend), esbuild (server bundle), tsx (dev server)

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string (Neon)
- `BASE_URL` — External API server URL (required, validated on startup)
- `SESSION_SECRET` — Express session secret
- `FORCE_SECURE_COOKIES` — Set to `true` if behind HTTPS proxy
- Firebase, Stripe, and SendGrid credentials as needed