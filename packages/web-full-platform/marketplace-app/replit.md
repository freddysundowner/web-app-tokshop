# Tokshop Marketplace Application

## Project Overview
Live shopping marketplace application with real-time video streaming, auctions, chat, and product sales.

## Recent Changes

### 2025-11-05: Fixed iPhone "Maximum call stack size exceeded" Crash

**Problem:** The show-view page crashed on iPhone Safari with "Maximum call stack size exceeded" error.

**Root Cause:** Large monolithic ShowView component (4615 lines) with lazy loading caused stack overflow on iPhone Safari's JavaScript engine.

**Solution:** Refactored ShowView into independent, modular components:

#### Architecture Pattern
```
show-view.tsx (Main Orchestrator)
├── All state management
├── All data fetching (React Query)
├── All socket event handlers  
├── All business logic
└── Renders independent UI components ↓

Independent UI Components (Can be commented out individually):
├── ShowHeader (alerts, warnings)
├── ShowVideo (LiveKit player, controls)
├── ShowProducts (auction/buy now/giveaway tabs)
├── ShowChat (messages, input)
└── ShowViewers (viewer list)
```

#### Key Principles
1. **Main file = Brain**: All logic, state, handlers in show-view.tsx
2. **Components = UI only**: Pure presentational components
3. **Independence**: Each component can be commented out without breaking the page
4. **Lazy loading fix**: Changed from `lazy(() => import())` to direct import to avoid iPhone crash

#### Files Changed
- `client/src/pages/marketplace/show-view.tsx` - Main orchestrator
- `client/src/components/show-view/show-header.tsx` - Header component
- `client/src/components/show-view/show-info.tsx` - Info component  
- `client/src/components/show-view/show-video.tsx` - Video player component
- `client/src/App.tsx` - Changed ShowView from lazy to direct import

## Tech Stack
- **Frontend**: React, TypeScript, Wouter (routing), TanStack Query
- **Backend**: Express, Node.js
- **Real-time**: Socket.IO, LiveKit (video streaming), Firebase (chat)
- **UI**: Shadcn/ui, Tailwind CSS
- **Database**: PostgreSQL (via API proxy)

## Important Notes
- ShowView uses direct import (not lazy) to prevent iPhone crashes
- All socket code is functional (was temporarily commented during debugging)
- Components are designed to be independently testable on iPhone
