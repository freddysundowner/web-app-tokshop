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

## Bidding System

### Bid Types and Logic

#### 1. Quick Bid (Default)
- User clicks preset bid button (e.g., "Bid: $50")
- Places immediate bid at the displayed amount
- No autobid protection

#### 2. Custom Bid without Autobid
- User enters custom amount (e.g., $100) with autobid toggle OFF
- Places immediate bid at exactly $100
- No autobid protection

#### 3. Custom Bid with Autobid (First Time)
- User enters max amount (e.g., $100) with autobid toggle ON
- **Has no existing bid**: Places immediate bid at next minimum amount (e.g., $2)
- Sets autobid max to $100
- System will auto-bid incrementally up to $100 as others bid

#### 4. Custom Bid with Autobid (Update Max - User Winning)
- User already has autobid enabled and is currently winning
- User updates max bid (e.g., from $50 to $100)
- **No immediate bid placed** - just updates max in database
- Emits: `update-bid` socket event
- Receives: `user-bid-updated` event to sync state

#### 5. Custom Bid with Autobid (Update Max - User Losing)
- User already has autobid enabled but is currently losing
- User updates max bid (e.g., from $50 to $100)
- **Immediately places bid** at next minimum amount to reclaim lead
- Updates max to $100 for future autobid protection
- Emits: `place-bid` socket event

### Self-Bidding Prevention
- Users cannot bid against themselves when already winning
- Bid buttons show current bid amount but are disabled when user is highest bidder
- No toast notification - silent prevention
- Once another user bids higher, original user can bid again

### Socket Events

#### Placing/Updating Bids
- **place-bid**: Places immediate bid (with optional autobid setup)
- **update-bid**: Updates max autobid amount without placing new bid (when user is winning)

#### Receiving Updates
- **bid-updated**: Auction-wide bid update (all bids, new base price, winner)
- **user-bid-updated**: Individual user's bid updated (when max autobid changed while winning)

### State Management
- `activeAuction`: Current auction data with all bids
- `currentUserBid`: Current user's bid object (for reliable winning status)
- `isUserWinning`: Computed flag - true if user is highest bidder
- Winner recalculation happens on every bid update

## Important Notes
- ShowView uses direct import (not lazy) to prevent iPhone crashes
- All socket code is functional (was temporarily commented during debugging)
- Components are designed to be independently testable on iPhone
