# TokShopLive - Comprehensive Knowledge Base

## Overview

**TokShopLive** is a live streaming e-commerce platform that enables sellers to host live video shows, showcase products in real-time, and process instant transactions while viewers watch, interact, and purchase. Think TikTok Shop meets QVC - a dynamic marketplace powered by live video streaming.

### Platform Architecture

TokShopLive consists of:

1. **TokShopLive Marketplace** (Web + Mobile)
   - React/TypeScript web version (port 5001)
   - Flutter mobile app (iOS and Android)
   - **Identical functionality across both platforms**
   - Same features, same user experience
   - All connect to the same backend API

2. **Seller Hub** (Web Only)
   - Advanced seller management tools
   - Product inventory dashboard
   - Analytics and reporting
   - Show scheduling

3. **Admin Dashboard** (Web Only - port 5000)
   - Platform management
   - User moderation
   - Content management
   - Settings configuration

**All platforms connect to the same external API backend** (`api.tokshop.com`) ensuring data consistency.

---

## Part 1: TokShopLive Marketplace

The marketplace works identically on web and mobile - buyers and sellers interact through live video shopping experiences.

---

### 1.1 User Roles

**Three primary user types:**

#### 👤 Buyers (Regular Users)
Available on web and mobile marketplace:
- Browse live shows and products
- Browse featured auctions on homepage
- Watch live streams
- Place bids on auction items (featured or show auctions)
- Enter giveaways during shows
- Purchase products
- Interact via live chat
- Manage their profile and orders

#### 🎥 Sellers (Show Owners)
Available on web and mobile marketplace:
- Host live streaming shows
- Create show auctions (tied to shows, short-term, real-time)
- Run giveaways tied to shows
- Display and sell products during streams
- Pin products to show (regular, auction, giveaway)
- Interact with viewers via chat

Additional features via **Seller Hub (Web Only)**:
- Create featured auctions (standalone, long-term, homepage visibility)
- Advanced inventory management
- Sales analytics and reporting
- Show scheduling and management

#### 👑 Admins
Access via **Admin Dashboard (Web Only)**:
- Full platform management
- User management
- Product approval/moderation
- Order oversight
- Platform settings configuration
- Content management

---

### 1.2 Authentication System

**Firebase Authentication** powers all user sign-up and login across web and mobile:

#### Available Sign-In Methods:
1. **Google Sign-In** - One-click authentication with Google account
2. **Facebook Sign-In** - One-click authentication with Facebook account
3. **Email/Password** - Traditional email registration and login

#### Authentication Flow:
1. User selects sign-in method
2. Firebase handles authentication
3. Backend creates/updates user profile
4. User gets access to marketplace features

---

### 1.3 Live Shows System

Live shows are the heart of TokShopLive - real-time video streams where sellers showcase and sell products.

#### Live Show Features:

**🎥 Video Streaming (LiveKit)**
- High-quality 1080p video streaming
- 3 Mbps bitrate for optimal quality
- Adaptive streaming with simulcast layers
- Low-latency real-time video
- Works on both web and mobile

**📱 Show Controls (Sellers)**
- Start/Stop live broadcast
- Camera and microphone controls
- Screen sharing capabilities
- Product pinning during stream
- Auction management in real-time

**👀 Viewer Experience**
- Watch live video streams
- Real-time chat participation
- Browse pinned products
- Place bids on live auctions
- See other viewers count
- Receive shipping estimates for products

**💬 Live Chat (Firebase)**
- Real-time messaging during shows (Firebase-powered)
- One-on-one live chat between users
- Show chat for all viewers
- See all viewer messages
- Seller can interact with audience
- Chat messages synced across all viewers
- Typing indicators
- Message persistence during show

---

### 1.4 Product System

Products can be sold in three ways: fixed-price, auction, or giveaway.

#### Product Types:

**1️⃣ Regular Products (Fixed Price)**
- Set price determined by seller
- Immediate purchase available
- Inventory tracking
- Can be featured in shows
- Can be pinned during live streams

**2️⃣ Auction Products**
- Starting bid price
- Real-time bidding (Socket.IO-powered)
- Autobid functionality
- Highest bidder wins
- Time-limited bidding windows
- Can be featured (standalone) or tied to shows

**3️⃣ Giveaway Products**
- Free items given away during shows
- Must be tied to a specific TokShow
- Viewers enter to win during the giveaway period
- **Runs for 5 minutes**
- **System automatically runs a draw** to determine the winner
- Winner announced when giveaway ends
- Promotes engagement during live streams

#### Product Information:
- Product name and description
- High-quality product images
- Price (fixed or starting bid)
- Category classification
- Stock/inventory levels
- Seller information
- Condition (new/used)
- Shipping details

#### Product Display Locations:
- Live show pinned products (regular, auction, giveaway)
- Homepage featured auctions (standalone long-term auctions)
- Category browsing pages
- Deals page
- Search results
- Seller's product listings

---

### 1.5 Auction System

**Auctions are a core feature** enabling competitive bidding in two distinct ways.

#### Auction Types:

**⭐ Featured Auctions (Standalone, Long-Term)**

Featured auctions run **independently from live shows** and are visible on the homepage.

**Key Characteristics:**
- **Not tied to any show** - Run on their own schedule
- **Long-term auctions** - Can last hours, days, or weeks
- **Homepage visibility** - Displayed as scheduled auctions on marketplace homepage
- **Absolute start/end times** - Pre-scheduled with exact timestamps
- **Independent bidding** - Users bid without watching a show
- **Multiple states** - Can be upcoming, running, or ended

**How They Work:**
1. Seller creates a featured auction with start/end times
2. Auction appears on homepage as scheduled
3. When start time arrives, auction goes live
4. Users can bid at any time (no show required)
5. When time lapses, highest bidder wins
6. Winner is notified and completes purchase

**Display States:**
- **Upcoming** - Shows countdown to start time
- **Running** - Active bidding, shows countdown to end time  
- **Ended** - Winner determined, bidding closed

---

**🔴 Show Auctions (Tied to Shows, Short-Term)**

Show auctions are **tied to specific live shows** and run during the stream.

**Key Characteristics:**
- **Tied to a show** - Only exist during a live stream
- **Short-term** - Last minutes during the show
- **Real-time excitement** - Created and run during broadcast
- **Seller controlled** - Host determines timing
- **Immediate bidding** - Viewers bid while watching live
- **Quick turnaround** - Fast-paced competitive bidding

**How They Work:**
1. Seller starts a live show
2. During stream, seller creates an auction
3. Item is showcased live on video
4. Viewers bid in real-time while watching
5. Seller closes auction when ready
6. Winner announced live on stream

#### Auction States:

1. **Upcoming** - Scheduled but not started
   - Shows countdown to start
   - Cannot place bids yet
   - Visible on deals page

2. **Active** - Currently accepting bids
   - Live bidding enabled
   - Real-time bid updates
   - Countdown to end time
   - Highest bidder shown

3. **Ended** - Auction completed
   - Winner determined
   - No more bids accepted
   - Purchase processing begins

#### Bidding Features:

**Manual Bidding:**
- Click to place bid
- Increment by minimum amount
- Instant bid confirmation
- Real-time bid updates via Socket.IO

**Autobid System:**
- Set maximum bid limit
- System auto-bids for you
- Increments minimally to maintain lead
- Alerts when limit exceeded
- Custom bid flag tracking

**Bid Tracking:**
- `currentUserBid` state management
- `custom_bid` flag inheritance
- Real-time updates via Socket.IO
- Persistent across page refreshes

**Required Before Bidding:**
- Valid payment method (Stripe)
- Shipping address on file
- System validates before allowing bids
- Prompts to add missing information

---

### 1.6 Shopping & Checkout

#### Shopping Cart:
- Add auction wins to cart
- Add fixed-price products to cart
- Quantity selection
- Cart total calculation
- Persistent cart storage

#### Checkout Process:
1. **Review Cart** - See all items and totals
2. **Shipping Address** - Enter/confirm delivery address
3. **Payment Method** - Select/add Stripe payment method
4. **Place Order** - Confirm and complete purchase

#### Payment Integration (Stripe):
- Secure payment processing
- Credit/debit card support
- Save payment methods
- PCI compliant
- Instant payment confirmation

#### Shipping:
- Address validation
- Shipping cost calculation (Shippo API)
- Automatic shipping estimates
- Show owners excluded from estimates
- Tracking information provided

---

### 1.7 Order Management

**For Buyers:**
- View all orders
- Order status tracking
- Order details (items, shipping, payment)
- Order history
- Cancellation requests

**For Sellers:**
- View incoming orders
- Process orders
- Update shipping status
- Mark as shipped
- Provide tracking numbers
- Manage refunds/returns

**Order Statuses:**
- Pending - Order placed, awaiting processing
- Processing - Seller preparing shipment
- Shipped - Package in transit
- Delivered - Order completed
- Cancelled - Order cancelled

---

### 1.8 Browsing & Discovery

#### Live Shows Discovery:
- **Browse Active Shows** - See all currently live streams
- Thumbnail previews with viewer counts
- Category filtering
- Seller information
- Quick join to watch

#### Category Browsing:
- Organized product categories
- Filter by category
- Sort options (price, newest, popular)
- Category-specific layouts

#### Deals Page:
- **Featured Auctions** - Standalone long-term auctions running outside shows
- **Trending Products** - Popular items
- Time-sensitive offers
- Special promotions
- Giveaway listings

#### Search Functionality:
- Search products by name
- Search shows by seller
- Filter results
- Sort search results

---

### 1.9 User Profile & Settings

**Profile Information:**
- Profile photo (Avatar system)
- Full name
- Username
- Email address
- Phone number
- Bio/description
- Account creation date

**Shipping Addresses:**
- Add multiple addresses
- Default address selection
- Edit/delete addresses
- Address validation
- Used for shipping estimates

**Payment Methods:**
- Add Stripe payment methods
- Save multiple cards
- Default payment selection
- Secure storage
- Remove payment methods

**Order History:**
- Past purchases
- Order tracking
- Reorder functionality
- Download receipts

**For Sellers:**
- Seller dashboard
- Show management
- Product inventory
- Sales analytics
- Earnings overview

---

### 1.10 Seller Hub (Web Only)

**Advanced seller tools accessible via web browser.**

The Seller Hub provides sellers with professional management tools beyond what's available in the marketplace.

#### Hub Features:

**📊 Analytics & Overview:**
- Total sales revenue
- Active products count
- Completed orders
- Average order value
- Sales trends graphs
- Performance metrics

**🎥 Show Management:**
- Create new shows
- Schedule upcoming shows
- Manage active shows
- Show history
- Viewer analytics
- Stream performance data

**📦 Product Management:**
- Add new products (regular, auction, giveaway)
- Edit existing products
- Bulk inventory management
- Product performance metrics
- Featured product selection
- Image uploads and management

**🔨 Featured Auction Management:**
- Create featured auctions (standalone, long-term, homepage visibility)
- Set start/end times
- Configure starting bids
- Monitor active auctions
- Auction results and analytics

**Note:** Show auctions and giveaways are created directly during live shows via the marketplace app (web or mobile).

**📬 Order Fulfillment:**
- Incoming orders queue
- Process orders
- Bulk order management
- Update shipping status
- Print shipping labels
- Customer communication
- Order history and export

---

### 1.11 Real-Time Features (Socket.IO & Firebase)

**Live connectivity enables instant updates through two systems:**

#### Real-Time Chat (Firebase):
- Instant message delivery powered by Firebase
- One-on-one live chat between users
- Show chat for all viewers
- Message synchronization
- Typing indicators
- User join/leave notifications
- Chat history

#### Bid Management (Socket.IO):
- Instant bid notifications
- Real-time bid updates
- Highest bidder updates
- Autobid triggers
- Auction end notifications
- Bid synchronization across all viewers

#### Product Updates (Socket.IO):
- Pin/unpin notifications
- Product availability changes
- Price updates
- Inventory changes

#### Show Events (Socket.IO):
- Show start/stop notifications
- Viewer count updates
- Product showcasing alerts
- Auction start announcements

#### Image Storage (Firebase):
- Product images
- User profile photos
- Show thumbnails
- Giveaway item images

---

### 1.12 Dynamic Content Pages

**Marketplace includes customizable informational pages:**

#### Available Pages:
1. **Landing Page** - Homepage with hero, features, CTA
2. **FAQ** - Frequently asked questions
3. **About Us** - Company/platform information
4. **Privacy Policy** - Privacy terms and data handling
5. **Terms of Service** - Usage terms and conditions
6. **Contact Us** - Contact information and form

#### Content Features:
- Admin-managed content (edited via Admin Panel)
- Dynamic loading from Firestore
- Real-time updates when content changes
- Default fallback content if not configured
- SEO-optimized pages
- Mobile-responsive layouts

---

### 1.13 Platform Availability

**TokShopLive Marketplace works identically across all platforms:**

**TokShopLive Marketplace** - Available on:
- ✅ Web browser (React/TypeScript)
- ✅ iOS mobile app (Flutter)
- ✅ Android mobile app (Flutter)

**Features available on ALL platforms:**
- Live streaming shows
- Real-time bidding on auctions
- Giveaway participation
- Live chat (one-on-one and show chat)
- Product browsing and purchase
- Shopping cart and checkout
- Order tracking
- User profiles and settings
- Payment methods
- Shipping addresses

**Mobile-Specific Enhancements:**
- Native mobile performance
- Push notifications for bids
- Mobile-optimized video streaming
- Touch-friendly interface
- Native payment integration
- Offline order viewing

**Web-Only Additional Tools:**
- **Seller Hub** - Advanced seller management
- **Admin Dashboard** - Platform administration

---

## Part 2: Admin Dashboard (Web Only)

The Admin Dashboard is the command center for platform management, accessible only via web browser.

---

### 2.1 Dashboard Overview

**Access:** Admin users log in to the dashboard with their credentials via web browser only.

**Admin Dashboard URL:** `https://admin.yourdomain.com` (port 5000)

#### First-Time Setup:
1. Visit admin panel URL
2. Redirected to `/admin/setup` (one-time only)
3. Create super admin account:
   - Email (required)
   - Password (required, min 6 chars)
   - Full name (optional)
   - Username (optional)
4. Admin account created
5. Redirected to login page
6. Log in with credentials
7. Full admin access granted

---

### 2.2 Admin Dashboard

**Overview screen showing platform metrics:**

#### Key Metrics Displayed:
- Total users count
- Total products
- Total orders
- Total revenue
- Active live shows
- Pending approvals
- Recent activity feed

#### Quick Actions:
- Create new user
- Add product
- View recent orders
- Manage live shows
- Platform settings

---

### 2.3 User Management

**Full control over platform users:**

#### User List View:
- All registered users
- Search and filter users
- Sort by date, name, role
- Pagination for large user bases
- User status indicators

#### User Actions:
- **View Details** - Full user profile
- **Edit User** - Modify user information
- **Change Role** - Set as buyer/seller/admin
- **Suspend/Ban** - Disable user access
- **Delete User** - Remove from platform
- **Reset Password** - Force password reset

#### User Information Displayed:
- Profile photo
- Full name and username
- Email and phone
- Role (buyer/seller/admin)
- Registration date
- Last active date
- Total orders
- Total spent (buyers)
- Total sales (sellers)

---

### 2.4 Product Management

**Moderate and manage all platform products:**

#### Product List View:
- All products (from all sellers)
- Filter by category, status, seller
- Search products
- Sort options
- Approval status indicators

#### Product Moderation:
- **Approve Products** - Allow product to go live
- **Reject Products** - Deny product with reason
- **Edit Products** - Modify product details
- **Delete Products** - Remove from platform
- **Feature Products** - Highlight on platform

#### Product Categories:
- Create new categories
- Edit category names
- Delete categories
- Assign products to categories
- Category hierarchy management

---

### 2.5 Order Management

**Oversee all platform transactions:**

#### Order List View:
- All orders across platform
- Filter by status, date, seller, buyer
- Search by order ID
- Revenue totals
- Export order data

#### Order Details:
- Order ID and date
- Buyer information
- Seller information
- Products ordered
- Quantities and prices
- Shipping address
- Payment status
- Shipping status
- Order total

#### Order Actions:
- View full order details
- Update order status
- Process refunds
- Cancel orders
- Add notes
- Contact buyer/seller

---

### 2.6 Live Show Management

**Monitor and control live streaming activity:**

#### Show Overview:
- Currently live shows
- Scheduled upcoming shows
- Past show history
- Total viewers across shows
- Show duration statistics

#### Show Controls:
- **View Show** - Watch any live show
- **End Show** - Force stop a show
- **Ban Show** - Prevent show from going live
- **Show Details** - Viewer count, products, duration

#### Show Moderation:
- Monitor chat messages
- Remove inappropriate content
- Ban users from shows
- Flag violations
- Review reported shows

---

### 2.7 Platform Settings

**Configure the entire platform through 6 settings tabs:**

---

#### Tab 1: General Settings

**App Branding:**
- **App Name** - Platform name (e.g., "TokShopLive")
- **App Description** - Platform tagline/description
- **App Logo URL** - Platform logo image
- **Primary Color** - Brand primary color (hex)
- **Secondary Color** - Brand accent color (hex)

**Platform Configuration:**
- **Commission Rate** - Platform fee percentage on sales
- **Currency** - Default currency (USD, EUR, etc.)
- **Tax Rate** - Default tax percentage
- **Terms URL** - Link to terms of service
- **Privacy URL** - Link to privacy policy

**Theme Settings:**
- Colors dynamically applied via CSS variables
- Affects both web and mobile apps
- Real-time preview

---

#### Tab 2: Payment Settings

**Stripe Integration:**
- **Stripe Publishable Key** - Public API key
- **Stripe Secret Key** - Private API key
- **Stripe Webhook Secret** - Webhook endpoint secret

**Payment Configuration:**
- Enable/disable payment methods
- Supported currencies
- Payment processing fees
- Refund policies

**⚠️ Required for:**
- Processing customer payments
- Seller payouts
- Subscription management
- Auction payments

---

#### Tab 3: API Keys

**🔥 Firebase Configuration (MOST CRITICAL):**

**⚠️ WITHOUT FIREBASE, THE ENTIRE PLATFORM WILL NOT WORK!**

Firebase is required for all user authentication (sign up, login) on both web and mobile.

- **API Key** - Firebase API key
- **Auth Domain** - Firebase auth domain
- **Project ID** - Firebase project ID
- **Storage Bucket** - Firebase storage bucket
- **Messaging Sender ID** - FCM sender ID
- **App ID** - Firebase app ID
- **Measurement ID** - Google Analytics ID

**Email Service (SendGrid):**
- **SendGrid API Key** - Email delivery service
- **From Email** - Sender email address
- **From Name** - Sender display name

**Shipping API (Shippo):**
- **Shippo API Key** - Shipping rate calculation
- Used for real-time shipping estimates
- Required for checkout shipping costs

---

#### Tab 4: Integrations

**LiveKit Cloud (Video Streaming):**

**Required for live shows to work:**
- **API Key** - LiveKit API key
- **API Secret** - LiveKit secret key
- **WebSocket URL** - LiveKit server URL

**Video Quality Settings:**
- 1080p resolution
- 3 Mbps bitrate
- Simulcast enabled
- Adaptive quality

**Other Integrations:**
- Analytics services
- Customer support chat
- Social media connections
- Third-party tools

---

#### Tab 5: App Versions

**Mobile App Version Management:**

**iOS App:**
- Current version number
- Minimum supported version
- Force update requirements
- Update messages
- App Store link

**Android App:**
- Current version number
- Minimum supported version
- Force update requirements
- Update messages
- Play Store link

**Version Checks:**
- Automatic version validation
- Update prompts for users
- Critical update enforcement

---

#### Tab 6: Translations

**Multi-Language Support:**

**Language Configuration:**
- Default language selection
- Available languages list
- Enable/disable languages

**Translation Management:**
- UI text translations
- Error message translations
- Email templates per language
- Content page translations

**Supported Languages:**
- English
- Spanish
- French
- German
- (Expandable to more)

---

### 2.8 Content Management System (CMS)

**Edit all informational pages from Admin Panel:**

**Access:** Admin Panel → **Pages** menu

#### Editable Pages:

**1. Landing Page**
- Hero section content
- Features sections
- Call-to-action buttons
- Testimonials
- Footer content

**2. FAQ Page**
- Question and answer pairs
- Categories
- Search functionality
- Rich text formatting

**3. About Us Page**
- Company story
- Team information
- Mission and values
- Contact information

**4. Privacy Policy**
- Data collection practices
- Data usage policies
- User rights
- Cookie policies
- GDPR compliance

**5. Terms of Service**
- User agreements
- Platform rules
- Liability terms
- Account policies
- Dispute resolution

**6. Contact Us**
- Contact form
- Email addresses
- Phone numbers
- Physical address
- Social media links

#### CMS Features:
- **Rich Text Editor** - Format content with headings, lists, links
- **Live Preview** - See changes before publishing
- **Save Changes** - Update content immediately
- **Reset to Default** - Restore original content
- **Version History** - Track content changes
- **Instant Publishing** - Changes go live immediately

#### Content Storage:
- Stored in Firestore `app_content` collection
- Loaded by marketplace with 5s timeout
- Falls back to defaults if not configured
- Synced across web and mobile
- Cached for performance

---

### 2.9 Analytics & Reports

**Platform performance insights:**

#### Available Reports:
- **Sales Reports** - Revenue, transactions, trends
- **User Reports** - Registrations, activity, retention
- **Product Reports** - Best sellers, inventory, performance
- **Show Reports** - Viewer counts, engagement, duration
- **Auction Reports** - Bids, winners, completion rates

#### Export Options:
- CSV export
- PDF reports
- Excel spreadsheets
- Date range selection
- Custom filters

---

## Part 3: Technical Architecture

### 3.1 System Architecture

**Platform Components:**

```
┌─────────────────────────────────────────────────────┐
│                 Users (Web & Mobile)                │
└─────────────────┬───────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌───────▼────────┐
│  Admin Panel   │  │  Marketplace   │
│   (Port 5000)  │  │  (Port 5001)   │
│   React/TS     │  │   React/TS     │
└───────┬────────┘  └───────┬────────┘
        │                   │
        └─────────┬─────────┘
                  │
         ┌────────▼─────────┐
         │  Express Proxy   │
         │  (API Routes)    │
         └────────┬─────────┘
                  │
    ┌─────────────┴─────────────┐
    │   External API Backend    │
    │   (api.tokshop.com)       │
    └─────────────┬─────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────┐  ┌──────────┐  ┌────▼─────┐
│Firebase│  │PostgreSQL│  │Firestore │
└────────┘  └──────────┘  └──────────┘
```

**External Services:**
- **Firebase** - Authentication, real-time chat (one-on-one & show chat), image storage
- **Socket.IO** - Real-time bid management, product updates, show events
- **Stripe** - Payments
- **LiveKit Cloud** - Video streaming
- **SendGrid** - Email delivery
- **Shippo** - Shipping rates

---

### 3.2 Data Flow

**Authentication Flow:**
```
User → Firebase Auth → Backend API → Create/Update User → Return Session
```

**Product Purchase Flow:**
```
Browse → Add to Cart → Checkout → Payment (Stripe) → Order Created → Seller Notified
```

**Live Show Flow:**
```
Seller Starts Show → LiveKit Room Created → Viewers Join → Chat (Firebase) + Bids (Socket.IO) → Show Ends → Analytics Saved
```

**Auction Bid Flow:**
```
User Places Bid → Validate Payment/Shipping → Socket.IO Broadcast → Update Highest Bid → Notify Other Bidders
```

---

### 3.3 Security Features

**Authentication & Authorization:**
- Firebase secure authentication
- Role-based access control (RBAC)
- Admin-only endpoints protected
- Session management
- CSRF protection

**Payment Security:**
- PCI-DSS compliant via Stripe
- No credit card storage
- Tokenized payments
- Secure webhook validation
- 3D Secure support

**Data Protection:**
- HTTPS/SSL encryption
- Secure API communication
- Input validation
- XSS prevention
- SQL injection prevention

---

### 3.4 Deployment Architecture

**Two Deployment Modes:**

**Mode 1: Full Platform (Admin + Web Marketplace + Mobile Apps)**
- Admin Dashboard on port 5000 (web only)
- TokShopLive Marketplace on port 5001 (web version)
- Seller Hub integrated with marketplace web
- Mobile apps (iOS/Android) connect to same backend
- All behind Nginx reverse proxy
- Separate domains (admin.domain.com, marketplace.domain.com)
- PM2 process management

**Mode 2: Admin + Mobile Only (No Web Marketplace)**
- Admin Dashboard on port 5000 (web only)
- Seller Hub accessible via admin dashboard
- Mobile apps (iOS/Android) handle all marketplace functions
- Single domain for admin
- Backend API serves both admin and mobile

---

## Part 4: Key User Workflows

### 4.1 Buyer Journey

**Discovery → Watch → Bid → Purchase → Receive**

1. **Browse Live Shows** - Find interesting shows
2. **Browse Featured Auctions** - Check homepage for long-term standalone auctions
3. **Watch Live Stream** - Join show and watch video
4. **Engage in Chat** - Ask questions, interact
5. **View Products** - See pinned products during show (regular, auction, giveaway)
6. **Place Bids** - Bid on auction items (featured auctions or show auctions)
7. **Enter Giveaways** - Register for free giveaway items (5-minute window, automatic draw)
8. **Add to Cart** - Add wins/products to cart
9. **Checkout** - Enter shipping, payment
10. **Complete Purchase** - Confirm order
11. **Track Order** - Monitor shipping status
12. **Receive Product** - Enjoy purchase!

---

### 4.2 Seller Journey

**Setup → Create → Stream → Sell → Fulfill**

1. **Become Seller** - Get seller privileges
2. **Add Products** - Upload inventory (regular, auction, giveaway)
3. **Create Featured Auctions** - Set up long-term standalone auctions for homepage
4. **Create Show** - Schedule live show
5. **Start Streaming** - Go live with video
6. **Showcase Products** - Pin products during stream
7. **Run Show Auctions** - Create short-term auctions during live stream
8. **Launch Giveaways** - Run 5-minute giveaways tied to show (system draws winner automatically)
9. **Engage Viewers** - Chat with audience
10. **Process Orders** - Manage incoming orders
11. **Ship Products** - Fulfill orders
12. **Track Earnings** - Monitor revenue

---

### 4.3 Admin Workflow

**Monitor → Moderate → Manage → Optimize**

1. **First-Time Setup** - Create admin account
2. **Configure Settings** - Set up Firebase, Stripe, LiveKit
3. **Customize Branding** - Set app name, colors, logo
4. **Manage Users** - Approve sellers, moderate users
5. **Moderate Products** - Approve/reject products
6. **Monitor Shows** - Oversee live streams
7. **Handle Orders** - Assist with order issues
8. **Edit Content** - Update CMS pages
9. **Review Analytics** - Monitor platform metrics
10. **Platform Optimization** - Adjust settings, improve UX

---

## Part 5: Platform Features Summary

### Core Features Checklist

✅ **Live Video Streaming** (LiveKit)  
✅ **Real-Time Chat** (Firebase - one-on-one & show chat)  
✅ **Real-Time Bidding** (Socket.IO)  
✅ **Featured Auctions** (standalone, long-term, homepage)  
✅ **Show Auctions** (tied to shows, short-term, real-time)  
✅ **Autobid System** for competitive bidding  
✅ **Image Storage** (Firebase)  
✅ **Fixed-Price Products**  
✅ **Giveaways** (tied to shows)  
✅ **Shopping Cart & Checkout**  
✅ **Stripe Payment Processing**  
✅ **Order Management**  
✅ **User Profiles**  
✅ **Seller Dashboards**  
✅ **Admin Panel**  
✅ **Content Management System**  
✅ **Shipping Estimates** (Shippo)  
✅ **Email Notifications** (SendGrid)  
✅ **Firebase Authentication**  
✅ **Multi-Platform** (Web + Mobile)  
✅ **Dynamic Branding**  
✅ **Category Browsing**  
✅ **Search Functionality**  
✅ **Deals Page**  
✅ **Analytics & Reports**  

---

## Part 6: Best Practices

### For Admins:
1. **Configure Firebase FIRST** - Nothing works without it
2. **Set up Stripe early** - Required for payments
3. **Configure LiveKit** - Required for live shows
4. **Test all settings** - Verify each integration works
5. **Customize branding** - Make platform your own
6. **Monitor moderation** - Keep platform quality high
7. **Regular backups** - Protect platform data

### For Sellers:
1. **Quality products** - Use clear photos and descriptions
2. **Use featured auctions** - Create long-term auctions for homepage visibility
3. **Run giveaways** - Boost engagement by offering free items during shows
4. **Engage viewers** - Active chat increases sales
5. **Consistent streaming** - Regular shows build audience
6. **Fair pricing** - Competitive pricing attracts buyers
7. **Quick fulfillment** - Ship orders promptly
8. **Customer service** - Respond to buyer questions

### For Buyers:
1. **Add payment method** - Required before bidding
2. **Add shipping address** - Required for checkout
3. **Watch shows** - Engage with sellers
4. **Bid responsibly** - Honor winning bids
5. **Track orders** - Monitor shipping status

---

## Conclusion

TokShopLive is a comprehensive live streaming e-commerce platform that combines:

**Core Marketplace Features (Web + Mobile):**
- **Real-time video streaming** for product showcasing
- **Show auctions** (tied to shows, short-term, real-time excitement)
- **Giveaways** (tied to shows, 5-minute duration, automatic draw)
- **Fixed-price products** for instant purchases
- **Instant chat** for community engagement (one-on-one & show chat)
- **Seamless checkout** for quick purchases
- **Real-time bidding** via Socket.IO
- **Multi-platform support** (identical experience on web and mobile)

**Additional Web-Only Tools:**
- **Seller Hub** - Advanced seller management, featured auctions, analytics
- **Admin Dashboard** - Platform management and configuration

The platform creates an engaging shopping experience where entertainment meets commerce, enabling sellers to build authentic connections with buyers through live video while facilitating instant transactions. The TokShopLive marketplace works identically on web browsers and mobile apps, ensuring a consistent experience across all devices. Whether users are participating in fast-paced show auctions during live streams or browsing featured auctions on the homepage (created via Seller Hub), TokShopLive provides multiple ways to shop and engage.

Whether you're deploying the full platform with web marketplace and mobile apps, or using just the admin dashboard to support mobile-only users, TokShopLive provides all the tools needed to run a successful live streaming marketplace.

---

**For deployment instructions, see:**
- `README-DEPLOY-BOTH.md` - Deploy admin + marketplace web apps
- `README-DEPLOY-ADMIN.md` - Deploy admin only (for mobile app)
