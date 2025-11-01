# Overview

**Icona Live Shopping** is a comprehensive marketplace platform that combines live-streaming, auctions, and e-commerce. The platform consists of two separate applications that share a backend during development but are packaged and sold independently:

1. **Admin Application** - Administrative panel for platform management (sold with mobile app)
2. **Marketplace Application** - Complete seller dashboard + buyer marketplace (sold separately as web platform)

The project uses a modern full-stack architecture with React + TypeScript frontend, Express backend, Socket.IO for real-time features, and integrates with an external API (https://api.iconaapp.com) for core backend services.

## Recent Updates (November 1, 2025)

- **Payouts Page Enhancements:**
  - Removed Payout ID column, added Bank destination column showing bank name and last 4 digits
  - Added pagination (10 items per page) with server-side `has_more` support
  - Removed redundant Bank Account Information section at bottom
  - Added comprehensive filters: Status (Paid, Pending, In Transit, Canceled, Failed), Date Range (From/To)
  - Backend now passes filter parameters to external API endpoint `/stripe/transactions/all/payouts`
  - Backend returns `has_more` flag from API to indicate if additional pages exist
  - Pagination displays "10+" when more data is available, "Page 1+" when on first page with more data
  - Next button enabled when `has_more` is true
  - Reset filters button appears when filters are active

## Multi-App Architecture

**Development Structure:**
```
/
├── shared-backend/        # Shared server code (edited once, used by both apps)
│   ├── server/           # Express server, routes, Socket.IO  
│   ├── shared/           # Shared types and schemas
│   └── drizzle.config.ts
├── admin-app/            # Admin panel application
│   ├── client/           # React frontend (admin only)
│   └── server.ts         # Entry point that imports shared-backend
├── marketplace-app/      # Marketplace application
│   ├── client/           # React frontend (seller + buyer)
│   └── server.ts         # Entry point that imports shared-backend
├── run-admin.sh          # Run admin app on port 5000
├── run-marketplace.sh    # Run marketplace app on port 5001
├── run-both.sh           # Run both apps simultaneously
└── package-for-sale.sh   # Package each app with backend for distribution
```

**Key Architectural Decisions:**
- **Shared Backend**: During development, both apps use `shared-backend/` via their server.ts entry points
- **Symlinked Dependencies**: Both apps symlink to root node_modules due to Replit constraints
- **Independent Frontends**: Each app has completely separate React frontends with distinct routes
- **Packaging**: `package-for-sale.sh` creates standalone packages (admin-app-standalone, marketplace-app-standalone) each with backend included

## Admin Application Features

The admin application (`admin-app/`) provides platform management capabilities:

**Routes & Pages:**
- `/admin/login` - Admin authentication
- `/admin/dashboard` - Platform analytics and overview
- `/admin/users` - User management (buyers and sellers)
- `/admin/orders` - Order tracking and management
- `/admin/disputes` - Dispute resolution system
- `/admin/reported-cases` - User-reported content
- `/admin/shows` - Live show management
- `/admin/inventory` - Platform-wide inventory oversight
- `/admin/categories` - Category and subcategory management
- `/admin/settings` - Platform configuration
- `/admin/profile` - Admin profile with edit and password change capabilities

**Key Components:**
- Admin-only authentication system
- Analytics dashboards with charts and metrics
- Data tables with search, filter, sort
- Dispute management workflow
- User moderation tools
- Editable admin profile with password change functionality

## Marketplace Application Features

The marketplace application (`marketplace-app/`) serves both sellers and buyers:

**Seller Dashboard Routes:**
- `/seller/dashboard` - Sales analytics and overview
- `/seller/products` - Inventory management
- `/seller/live-show` - Live streaming controls
- `/seller/auctions` - Auction creation and management
- `/seller/orders` - Order fulfillment
- `/seller/profile` - Seller profile settings

**Buyer Marketplace Routes:**
- `/` - Homepage with featured products and live shows
- `/marketplace` - Browse all products
- `/live` - Current live shopping shows
- `/auctions` - Active auctions
- `/product/:id` - Product details
- `/profile` - User profile and settings
- `/orders` - Order history
- `/cart` - Shopping cart
- `/checkout` - Payment flow

**Real-Time Features:**
- Live video streaming (LiveKit integration)
- Live chat during shows (Socket.IO)
- Real-time auction bidding
- Viewer counts and reactions
- Instant notifications

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server, providing fast HMR and optimized production builds
- Wouter for lightweight client-side routing (replacing heavier alternatives like React Router)

**UI Component System:**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Component configuration uses "new-york" style variant
- Custom CSS variables for theming (light/dark mode support configured)
- Design system emphasizes minimalism with precise spacing (4, 8, 16px units)

**State Management:**
- TanStack Query (React Query) for server state management
- Custom query client configured with infinite stale time and disabled automatic refetching
- Toast notifications for user feedback via Radix UI Toast primitives

**Rationale:** The combination of Vite + React + shadcn/ui provides a modern developer experience with fast builds, reusable accessible components, and minimal bundle size. TanStack Query handles async state elegantly without requiring additional global state management.

## Backend Architecture

**Shared Backend Design:**
The backend (`shared-backend/`) is edited once and used by both applications:

- **Location**: `shared-backend/server/index.ts` - Main Express server
- **Entry Points**: Each app has `server.ts` that imports and starts the shared backend
- **Routes**: Comprehensive API in `shared-backend/server/routes.ts`
- **Real-Time**: Socket.IO configured in `shared-backend/server/socket.ts`

**Server Framework:**
- Express.js running on Node.js with TypeScript
- ESM module system throughout the codebase
- Socket.IO for real-time features (live chat, notifications, viewer counts)
- Custom middleware for request logging and JSON parsing

**External API Integration:**
- Primary backend: https://api.iconaapp.com
- Local server proxies requests and adds real-time capabilities
- Authentication tokens managed in localStorage
- API calls use axios with proper error handling

**Development vs Production:**
- Development: Vite dev server integrated as Express middleware for HMR
- Each app runs on different port (admin: 5000, marketplace: 5001)
- Production: Pre-built static assets served from `dist/public`

**API Structure:**
- RESTful API pattern with `/api` prefix
- Routes organized by domain: auth, products, orders, auctions, users, etc.
- Socket.IO events: chat, viewers, reactions, notifications
- File upload support via multer middleware

**Rationale:** The shared backend approach allows DRY development (edit once, both apps benefit) while maintaining the ability to package separately for sale. Express + Socket.IO provides robust real-time capabilities needed for live shopping features.

## Data Storage Solutions

**ORM & Database:**
- Drizzle ORM configured for PostgreSQL via `@neondatabase/serverless`
- Schema-first approach with TypeScript types generated from schema definitions
- Zod integration for runtime validation via `drizzle-zod`
- Migration system configured to output to `./migrations` directory

**Current Schema:**
- Users table with UUID primary keys, username, and password fields
- Username has unique constraint
- Uses PostgreSQL's `gen_random_uuid()` for ID generation

**Storage Abstraction:**
- `IStorage` interface defines CRUD operations (getUser, getUserByUsername, createUser)
- `MemStorage` implementation provides in-memory storage for development/testing
- Design allows swapping to database-backed storage without changing application code

**Rationale:** Drizzle ORM was chosen over Prisma or TypeORM for its lightweight nature, superior TypeScript inference, and SQL-like query builder. The storage abstraction pattern enables testing with in-memory storage while maintaining production-ready database code paths. Neon serverless allows edge deployment compatibility.

## External Dependencies

**Database Provider:**
- Configured for Neon Postgres (serverless PostgreSQL)
- Connection managed via `DATABASE_URL` environment variable
- Connection pooling handled by `@neondatabase/serverless` driver

**UI Component Libraries:**
- Radix UI primitives for accessible, unstyled component foundations (accordion, dialog, dropdown, etc.)
- Lucide React for consistent iconography
- Embla Carousel for any carousel implementations
- date-fns for date manipulation utilities

**Development Tools:**
- Replit-specific plugins for runtime error modal and dev banner
- Cartographer plugin for code navigation (development only)
- PostCSS with Tailwind CSS and Autoprefixer for styling pipeline

**Session Management:**
- `connect-pg-simple` configured for PostgreSQL-backed session storage
- Express session middleware (infrastructure ready, not yet implemented)

**Form Handling:**
- React Hook Form with Zod resolvers for type-safe form validation
- Integration with shadcn/ui form components

**Alternatives Considered:**
- Prisma was considered for ORM but Drizzle chosen for better TypeScript DX and lighter weight
- Redux/Zustand considered for state management but deemed unnecessary with TanStack Query handling server state

**Pros:**
- Comprehensive type safety across frontend and backend
- All dependencies are actively maintained and production-ready
- Minimal bundle size with tree-shaking support

**Cons:**
- Neon Postgres requires internet connectivity (no offline development without local Postgres)
- Large number of Radix UI packages increases dependency count (though tree-shaken in production)