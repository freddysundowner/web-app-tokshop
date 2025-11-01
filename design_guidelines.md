# Icona Live Shopping Admin Panel - Design Guidelines

## Design Approach
**System:** shadcn/ui with custom theme integration
**Philosophy:** Information-dense professional interface prioritizing clarity, efficiency, and data visualization. Drawing from enterprise-grade admin panels like Stripe Dashboard, Vercel Analytics, and Linear workspace.

## Typography System
**Font Family:** Inter via Google Fonts CDN (weights: 400, 500, 600, 700)

**Hierarchy:**
- Page Headers: text-3xl font-bold (30px)
- Section Headers: text-xl font-semibold (20px)
- Card Titles: text-lg font-semibold (18px)
- Body Text: text-sm font-medium (14px)
- Metadata/Labels: text-xs font-medium uppercase tracking-wide (12px)
- Table Content: text-sm font-normal (14px)

## Layout System
**Spacing Primitives:** Use Tailwind units of 2, 3, 4, 6, 8, 12, 16 exclusively

**Structure:**
- Sidebar Navigation: Fixed w-64, full-height with nested menu sections
- Main Content Area: Flexible flex-1 with max-w-screen-2xl container
- Content Padding: p-6 on mobile, p-8 on desktop
- Card Spacing: space-y-6 between major sections
- Grid Gaps: gap-6 for card grids, gap-4 for form fields

**Responsive Grid:**
- Stats Cards: grid-cols-1 md:grid-cols-2 xl:grid-cols-4
- Main Content: grid-cols-1 lg:grid-cols-3 (2:1 ratio for main:sidebar widgets)
- Table Containers: Full width with horizontal scroll on mobile

## Component Library

**Navigation:**
- Collapsible sidebar with icon-only mobile state
- Active state: bg-primary/10 with border-l-4 border-primary
- Nested submenus with indentation and subtle dividers
- Top bar: Search input, notifications bell, user avatar dropdown

**Dashboard Cards:**
- Stats Cards: Rounded-lg border with p-6 padding, icon in colored circle (bg-primary/10), large number display (text-3xl font-bold), percentage change indicator with arrow
- Data Tables: Sortable headers, row hover states, pagination controls, bulk action checkboxes, status badges (rounded-full px-3 py-1)
- Charts: Integrate recharts library - area charts for trends, bar charts for comparisons, donut charts for distribution

**Forms:**
- Form Fields: Stacked labels (text-sm font-medium mb-2), full-width inputs with focus rings
- Input Groups: Combine related fields with subtle background grouping
- File Uploads: Drag-and-drop zones with dashed borders
- Action Buttons: Primary (bg-primary), Secondary (outline), Destructive (red variant)
- Multi-step Forms: Progress indicator with numbered steps

**Data Display:**
- Product Cards: Image thumbnail, title, SKU, stock status, quick actions dropdown
- Order Timeline: Vertical timeline with status nodes and timestamps
- User Lists: Avatar + name + email in compact rows with action menus
- Live Shopping Sessions: Status indicator (live/scheduled/ended), viewer count, product showcase thumbnails

**Modals & Overlays:**
- Sheet Components: Slide-in panels for detailed views (w-full md:w-2/3 lg:w-1/2)
- Dialog Modals: Centered overlays for confirmations and quick actions
- Toast Notifications: Top-right positioned with auto-dismiss

**Special Components:**
- Live Stream Monitor: Video preview grid with participant count and chat preview
- Analytics Dashboard: Metric cards with sparkline trends, conversion funnels
- Inventory Management: Stock levels with visual indicators (progress bars)
- Commission Calculator: Interactive form with real-time calculations

## Dark/Light Mode Strategy
**Light Mode Foundations:**
- Background: white/slate-50 gradient
- Cards: white with border-slate-200
- Text: slate-900 (headings), slate-700 (body)

**Dark Mode Foundations:**
- Background: slate-950/slate-900 gradient
- Cards: slate-900 with border-slate-800
- Text: slate-50 (headings), slate-300 (body)

**Mode-Agnostic Elements:**
- Primary actions always use #FF5644 with white text
- Teal (#0D9488) for secondary actions and accents
- Status colors maintain WCAG AA contrast in both modes
- Shadows: Subtle in light (shadow-sm), pronounced in dark (shadow-lg with glow)

## Icons
**Library:** Heroicons via CDN (outline for navigation, solid for actions)
**Usage:** w-5 h-5 for standard UI, w-8 h-8 for stat card icons, w-12 h-12 for empty states

## Images
**No Hero Images:** Admin panels are utility-focused
**Image Usage:**
- Product thumbnails in tables/grids (square aspect ratio, 80x80px)
- User avatars (circular, 40x40px standard, 32x32px compact)
- Live stream previews (16:9 aspect ratio, 320x180px)
- Empty state illustrations (centered, max-w-xs)
- Brand logo in sidebar header (fixed height h-8)

## Accessibility
- All form inputs have associated labels with htmlFor
- Focus visible states with ring-2 ring-offset-2
- Color contrast meets WCAG AA for both modes
- Keyboard navigation for all interactive elements
- aria-labels for icon-only buttons

## Animation Principles
**Minimal Motion:** Only functional animations
- Page transitions: Fade opacity (150ms)
- Dropdown menus: Scale + fade (100ms)
- Modal overlays: Backdrop blur + fade (200ms)
- Loading states: Pulse animation on skeletons
- NO decorative scroll animations or parallax effects