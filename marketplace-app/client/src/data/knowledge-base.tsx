import { 
  BookOpen, 
  Layout, 
  Users, 
  ShoppingBag, 
  Gavel, 
  Gift, 
  CreditCard, 
  Package, 
  Settings, 
  BarChart3, 
  Shield, 
  Zap, 
  Globe,
  Smartphone,
  Video,
  MessageSquare,
  TrendingUp,
  Clock,
  DollarSign,
  Star,
  Mail,
  Database,
  Truck,
  Printer,
  FileText,
  type LucideIcon
} from "lucide-react";

export interface KnowledgeBaseSection {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  content: {
    title: string;
    body: string | React.ReactNode;
  }[];
}

export const getKnowledgeBaseSections = (appName: string = 'TokshopLive'): KnowledgeBaseSection[] => [
  {
    id: "overview",
    title: `What is ${appName}?`,
    icon: BookOpen,
    description: "Introduction to the platform",
    content: [
      {
        title: "Welcome to Live Shopping",
        body: `${appName} is a live streaming shopping platform where you can watch exciting live shows, interact with sellers in real-time, and purchase products instantly. It's like watching your favorite shopping channel, but interactive - you can chat, ask questions, and buy products with just a few taps. Whether you're looking for great deals, unique items, or just entertainment, ${appName} brings the shopping mall experience to your screen.`
      },
      {
        title: "How It Works",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">{appName} connects buyers and sellers through live video streaming:</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Video className="h-8 w-8 text-primary" />
                <h5 className="font-semibold">Watch Live Shows</h5>
                <p className="text-sm text-muted-foreground">Sellers host live video shows demonstrating products, answering questions, and offering special deals in real-time.</p>
              </div>
              <div className="space-y-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                <h5 className="font-semibold">Chat & Interact</h5>
                <p className="text-sm text-muted-foreground">Ask questions, chat with other viewers, and get instant responses from sellers during the show.</p>
              </div>
              <div className="space-y-2">
                <ShoppingBag className="h-8 w-8 text-primary" />
                <h5 className="font-semibold">Buy Instantly</h5>
                <p className="text-sm text-muted-foreground">Purchase products with one click, participate in auctions, or enter giveaways - all while watching the show.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Available on Web and Mobile",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Shop anywhere, anytime:</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="border rounded-lg p-4">
                <Globe className="h-6 w-6 text-primary mb-2" />
                <h5 className="font-semibold text-sm mb-1">Web Browser</h5>
                <p className="text-xs text-muted-foreground">Access the full platform from any computer or laptop browser. Great for browsing products and managing seller tools.</p>
              </div>
              <div className="border rounded-lg p-4">
                <Smartphone className="h-6 w-6 text-primary mb-2" />
                <h5 className="font-semibold text-sm mb-1">Mobile Apps</h5>
                <p className="text-xs text-muted-foreground">Download our iOS and Android apps for shopping on the go. Perfect for watching live shows anywhere.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        title: `Why Shop on ${appName}?`,
        body: (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Exclusive Deals</p>
                  <p className="text-sm text-muted-foreground">Get special prices and limited-time offers only available during live shows</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Video className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">See Before You Buy</p>
                  <p className="text-sm text-muted-foreground">Watch products demonstrated live - see how they work and look in real-time</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Ask Questions</p>
                  <p className="text-sm text-muted-foreground">Get instant answers from sellers - no waiting for email responses</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Gavel className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Win Auctions</p>
                  <p className="text-sm text-muted-foreground">Bid on unique items and score great deals through exciting auctions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Gift className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Free Giveaways</p>
                  <p className="text-sm text-muted-foreground">Enter to win free products during live shows - no purchase necessary</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Secure Shopping</p>
                  <p className="text-sm text-muted-foreground">Your payments and personal information are protected</p>
                </div>
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: "getting-started-buyers",
    title: "Getting Started as a Buyer",
    icon: ShoppingBag,
    description: "How to shop and participate",
    content: [
      {
        title: "Creating Your Account",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Getting started is easy:</p>
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span>Click "Sign Up" on the homepage</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span>Choose to sign up with Google, Facebook, or email</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span>Complete your profile with a photo and display name</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span>Start browsing shows and products!</span>
              </li>
            </ol>
          </div>
        )
      },
      {
        title: "Browsing Live Shows",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Find shows that interest you:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>For You Page:</strong> See recommended shows based on your interests</li>
              <li><strong>Categories:</strong> Browse by Fashion, Electronics, Beauty, Home & Garden, and more</li>
              <li><strong>Search:</strong> Look for specific products or sellers</li>
              <li><strong>Trending:</strong> Check out the most popular shows happening now</li>
              <li><strong>Following:</strong> See shows from sellers you follow</li>
            </ul>
          </div>
        )
      },
      {
        title: "Watching a Live Show",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">Once you join a show, you can:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Video className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">Watch in High Quality</p>
                  <p className="text-sm text-muted-foreground">Enjoy smooth, high-definition video streaming that adjusts to your internet speed</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">Chat with Everyone</p>
                  <p className="text-sm text-muted-foreground">Send messages visible to all viewers and the seller - ask questions or share excitement</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShoppingBag className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">View Featured Products</p>
                  <p className="text-sm text-muted-foreground">See which products the seller is currently showing - click to view details and purchase</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">React and Engage</p>
                  <p className="text-sm text-muted-foreground">Send reactions and emojis to show appreciation for products you love</p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Making Your First Purchase",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">Buying is quick and easy:</p>
            <ol className="space-y-3 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <div className="space-y-1">
                  <p><strong>Add Payment Method</strong></p>
                  <p className="text-xs">Go to your profile and add a credit or debit card - your information is stored securely</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <div className="space-y-1">
                  <p><strong>Add Shipping Address</strong></p>
                  <p className="text-xs">Save your delivery address so you're ready to check out quickly</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <div className="space-y-1">
                  <p><strong>Buy a Product</strong></p>
                  <p className="text-xs">Click "Buy Now" or "Add to Cart" on any product - during a show or while browsing</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <div className="space-y-1">
                  <p><strong>Complete Checkout</strong></p>
                  <p className="text-xs">Review your order and confirm - you'll receive an email confirmation instantly</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                <div className="space-y-1">
                  <p><strong>Track Your Order</strong></p>
                  <p className="text-xs">Check your order status anytime in "My Orders" - get updates when it ships</p>
                </div>
              </li>
            </ol>
          </div>
        )
      }
    ]
  },
  {
    id: "auctions",
    title: "How Auctions Work",
    icon: Gavel,
    description: "Bidding and winning items",
    content: [
      {
        title: "What are Auctions?",
        body: "Auctions let you compete with other buyers to win products at potentially lower prices. You place bids (offers to pay a certain amount), and whoever has the highest bid when the auction ends wins the item and pays their final bid amount. It's exciting because you might get a great deal, but you'll need to bid strategically to win!"
      },
      {
        title: "Two Types of Auctions",
        body: (
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h5 className="font-semibold mb-2">Featured Auctions (Long-Term)</h5>
              <p className="text-sm text-muted-foreground mb-2">These are special auctions that run for hours, days, or even weeks:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Displayed prominently on the homepage</li>
                <li>• Perfect for high-value or rare items</li>
                <li>• You can bid anytime before the auction ends</li>
                <li>• Great if you can't watch a live show but still want to bid</li>
              </ul>
            </div>
            <div className="border-l-4 border-red-500 pl-4">
              <h5 className="font-semibold mb-2">Show Auctions (Fast & Exciting)</h5>
              <p className="text-sm text-muted-foreground mb-2">These happen during live shows and last just a few minutes:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• The seller demonstrates the product live on camera</li>
                <li>• Bidding is fast-paced and exciting</li>
                <li>• You compete in real-time with other viewers</li>
                <li>• Winner announced immediately when auction ends</li>
                <li>• Creates a fun, competitive atmosphere</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        title: "How to Place a Bid",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">Bidding is simple:</p>
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span><strong>Find an Active Auction:</strong> Look for items marked "Live Auction" on the homepage or during shows</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span><strong>Check Current Bid:</strong> See the current highest bid and minimum next bid amount</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span><strong>Enter Your Bid:</strong> Type in an amount equal to or higher than the minimum</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span><strong>Confirm Your Bid:</strong> Review and submit - remember, bids are binding commitments to buy</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                <span><strong>Watch the Auction:</strong> You'll see if someone outbids you - you can bid again if you want</span>
              </li>
            </ol>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-4">
              <p className="text-sm font-medium mb-1">💡 Important to Know:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• You must have a payment method and shipping address saved before bidding</li>
                <li>• If you win, you're required to purchase the item at your final bid price</li>
                <li>• You cannot cancel a bid once placed</li>
                <li>• Winning bidders are automatically charged when the auction ends</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        title: "Bidding Options",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">You have multiple ways to bid on auctions:</p>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h5 className="font-semibold mb-2">Quick Bid (Instant)</h5>
              <p className="text-sm text-muted-foreground mb-2">Click a preset bid button (e.g., "Bid: $50") to place an immediate bid at that exact amount. No autobid protection - you'll need to bid again if someone outbids you.</p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h5 className="font-semibold mb-2">Custom Bid without Autobid</h5>
              <p className="text-sm text-muted-foreground mb-2">Enter any amount you want (e.g., $100) and place an immediate bid at exactly that price. No autobid protection.</p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h5 className="font-semibold mb-2">Custom Bid with Autobid (Recommended)</h5>
              <p className="text-sm text-muted-foreground mb-2">Set a maximum amount you're willing to pay, and the system automatically bids for you up to that limit. This is the smartest way to bid!</p>
              
              <div className="mt-3 space-y-3 text-sm">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="font-medium mb-2">Scenario 1: First Time Using Autobid</p>
                  <p className="text-muted-foreground mb-1">You set max bid to $100 (current bid is $2)</p>
                  <p className="text-xs text-muted-foreground">✅ System immediately bids $2 for you + protects you up to $100</p>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="font-medium mb-2">Scenario 2: You're Winning, Increase Max Bid</p>
                  <p className="text-muted-foreground mb-1">You're winning at $50, update max from $100 to $150</p>
                  <p className="text-xs text-muted-foreground">✅ No new bid placed - just updates your max protection to $150</p>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <p className="font-medium mb-2">Scenario 3: You're Losing, Increase Max Bid</p>
                  <p className="text-muted-foreground mb-1">Someone bid $120 (you lose), you update max to $200</p>
                  <p className="text-xs text-muted-foreground">✅ System immediately bids $125 to reclaim lead + protects up to $200</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-4">
              <p className="text-sm font-medium mb-2">💡 Smart Bidding Tips:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• You cannot bid against yourself - if you're winning, bid buttons are disabled</li>
                <li>• When autobid is active, the system only bids the minimum needed to keep you in the lead</li>
                <li>• If someone exceeds your max, you'll get a notification to increase your limit</li>
                <li>• You can update your max bid anytime before the auction ends</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        title: "Winning an Auction",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">When the auction ends and you're the highest bidder:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>You'll see a celebration message confirming you won</li>
              <li>The item is automatically added to your orders</li>
              <li>Your payment method is charged for the final bid amount plus shipping</li>
              <li>You'll receive an email confirmation with order details</li>
              <li>Track your order in "My Orders" just like any other purchase</li>
            </ul>
          </div>
        )
      },
      {
        title: "Proof-of-Purchase Video Recording",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">For your protection, we automatically capture video evidence of every auction win:</p>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h5 className="font-semibold mb-2 flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                How It Works
              </h5>
              <p className="text-sm text-muted-foreground mb-3">
                When an auction ends with a winner, our system automatically captures the <strong>last 5-10 seconds</strong> of the live stream before the winning bid. This video clip is permanently attached to your order as proof of what you won.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Protection for Buyers</p>
                  <p className="text-sm text-muted-foreground">The video shows exactly what was displayed when you won - including the item's condition and the seller's description. If what arrives doesn't match what was shown, you have proof.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Protection for Sellers</p>
                  <p className="text-sm text-muted-foreground">Sellers are protected too - the video proves exactly what was shown and promised during the auction. It prevents false claims about item condition or description.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Always Accessible</p>
                  <p className="text-sm text-muted-foreground">Both buyers and sellers can view the proof-of-purchase video anytime in the order details. It's there whenever you need it for reference or dispute resolution.</p>
                </div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mt-4">
              <p className="text-sm font-medium mb-2">✨ Why This Matters:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Creates trust and transparency in every transaction</li>
                <li>• Eliminates "he said, she said" disputes</li>
                <li>• Provides peace of mind for high-value purchases</li>
                <li>• Makes returns and refunds fair for everyone</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: "giveaways",
    title: "Free Giveaways",
    icon: Gift,
    description: "Entering and winning free items",
    content: [
      {
        title: "What are Giveaways?",
        body: "Giveaways are completely free prizes that sellers offer during their live shows. You can enter for a chance to win without purchasing anything. It's a fun way to get free products and adds excitement to watching shows. Many sellers host giveaways to thank their followers and attract new viewers."
      },
      {
        title: "How to Enter a Giveaway",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">Entering is simple and free:</p>
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span><strong>Watch the Live Show:</strong> Giveaways only happen during live shows, so join a stream</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span><strong>Wait for Announcement:</strong> The seller will announce when a giveaway starts</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span><strong>Click "Enter Giveaway":</strong> A button will appear - click it to enter</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span><strong>Watch the Countdown:</strong> Giveaway entries close after 5 minutes</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                <span><strong>Winner Announced:</strong> One lucky person is randomly selected and announced live</span>
              </li>
            </ol>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mt-4">
              <p className="text-sm font-medium mb-2">✨ Giveaway Tips:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Enter quickly - you have 5 minutes before entries close</li>
                <li>• One entry per person per giveaway</li>
                <li>• Stay in the show to see if you won</li>
                <li>• Follow sellers who frequently host giveaways</li>
                <li>• Turn on notifications for your favorite sellers</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        title: "If You Win",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Congratulations! Here's what happens:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>You'll see a celebration animation on screen</li>
              <li>The seller announces your name in the show chat</li>
              <li>The product is automatically added to your orders</li>
              <li>Shipping is completely free - no charges at all</li>
              <li>You'll receive the item just like any other order</li>
              <li>No need to do anything else - just wait for delivery!</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: "live-shows",
    title: "Live Shows & Chat",
    icon: Video,
    description: "Watching and interacting",
    content: [
      {
        title: "Finding Shows to Watch",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Discover shows that match your interests:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Homepage Feed:</strong> Scroll through live and upcoming shows on the main page</li>
              <li><strong>Category Tabs:</strong> Filter by Fashion, Electronics, Beauty, Home & Garden, Sports, Toys, and more</li>
              <li><strong>Search Bar:</strong> Search for specific products, brands, or seller names</li>
              <li><strong>Trending Page:</strong> See the most popular shows with the most viewers</li>
              <li><strong>Following Tab:</strong> Quick access to shows from sellers you follow</li>
              <li><strong>Scheduled Shows:</strong> See upcoming shows and set reminders</li>
            </ul>
          </div>
        )
      },
      {
        title: "During the Show",
        body: (
          <div className="space-y-4">
            <div>
              <h5 className="font-semibold mb-2">Interacting with Chat</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>Send messages that all viewers can see</li>
                <li>Ask questions about products</li>
                <li>Chat with other viewers</li>
                <li>Use emojis and reactions</li>
                <li>See who else is watching</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2">Viewing Products</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>The seller "pins" products they're currently showing</li>
                <li>Pinned products appear in a sidebar or overlay</li>
                <li>Click any product to see full details</li>
                <li>Add to cart or buy instantly without leaving the show</li>
                <li>See prices, descriptions, and images</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2">Participating in Activities</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>Join auctions when the seller starts bidding</li>
                <li>Enter giveaways for free prizes</li>
                <li>Vote in polls and answer trivia</li>
                <li>React with emojis to show excitement</li>
                <li>Follow the seller to get notified of future shows</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        title: "Private Messaging",
        body: "Want to ask the seller a private question? Use the direct message feature to chat one-on-one with sellers. This is perfect for asking about custom orders, shipping details, or anything you don't want to share in the public chat. Sellers typically respond within a few hours."
      }
    ]
  },
  {
    id: "payments-shipping",
    title: "Payments & Shipping",
    icon: CreditCard,
    description: "Checkout and delivery",
    content: [
      {
        title: "Accepted Payment Methods",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">We accept all major credit and debit cards:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border rounded-lg p-3 text-center">
                <p className="font-medium text-sm">Visa</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="font-medium text-sm">Mastercard</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="font-medium text-sm">American Express</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="font-medium text-sm">Discover</p>
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-sm font-medium mb-1">🔒 Your payment information is secure</p>
              <p className="text-sm text-muted-foreground">We use industry-standard encryption to protect your card details. Your information is never shared with sellers.</p>
            </div>
          </div>
        )
      },
      {
        title: "How to Add a Payment Method",
        body: (
          <div className="space-y-3">
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span>Go to your profile by clicking your photo in the top right</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span>Click on "Payment Methods"</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span>Click "Add Payment Method"</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span>Enter your card number, expiration date, and security code</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                <span>Save the card for future purchases</span>
              </li>
            </ol>
            <p className="text-sm text-muted-foreground italic">You can save multiple cards and choose which one to use at checkout.</p>
          </div>
        )
      },
      {
        title: "Shipping Information",
        body: (
          <div className="space-y-4">
            <div>
              <h5 className="font-semibold mb-2">Delivery Times</h5>
              <p className="text-sm text-muted-foreground mb-2">Shipping times vary by seller and location:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>Standard shipping: 5-7 business days</li>
                <li>Expedited shipping: 2-3 business days (if offered)</li>
                <li>International orders: 10-20 business days</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">Exact shipping costs and times are shown during checkout before you purchase.</p>
            </div>
            <div>
              <h5 className="font-semibold mb-2">Tracking Your Order</h5>
              <ol className="space-y-2 text-sm text-muted-foreground ml-4">
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                  <span>Go to "My Orders" in your profile</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                  <span>Find your order and click "Track Package"</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                  <span>See real-time updates as your package moves</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                  <span>Get email notifications when it ships and delivers</span>
                </li>
              </ol>
            </div>
          </div>
        )
      },
      {
        title: "Returns & Refunds",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Not satisfied with your purchase? Here's how returns work:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Most sellers accept returns within 30 days of delivery</li>
              <li>Items must be unused and in original packaging</li>
              <li>Contact the seller through "My Orders" to request a return</li>
              <li>The seller will provide return instructions</li>
              <li>Refunds are processed within 5-7 business days after the seller receives the return</li>
              <li>Money is returned to your original payment method</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3"><strong>Note:</strong> Return policies may vary by seller. Check the product page for specific details before purchasing.</p>
          </div>
        )
      }
    ]
  },
  {
    id: "becoming-seller",
    title: "Becoming a Seller",
    icon: Users,
    description: `Start selling on ${appName}`,
    content: [
      {
        title: "Who Can Become a Seller?",
        body: `Anyone with products to sell can apply to become a seller on ${appName}! Whether you're a small business owner, artist, craftsperson, reseller, or just someone with things to sell, we welcome you. You'll need to be approved by our team before you can start hosting shows, but the application process is straightforward.`
      },
      {
        title: "How to Apply",
        body: (
          <div className="space-y-4">
            <ol className="space-y-3 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <div className="space-y-1">
                  <p><strong>Create an Account</strong></p>
                  <p className="text-xs">Sign up as a regular user first if you haven't already</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <div className="space-y-1">
                  <p><strong>Go to "Become a Seller"</strong></p>
                  <p className="text-xs">Find this option in your profile menu</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <div className="space-y-1">
                  <p><strong>Fill Out Application</strong></p>
                  <p className="text-xs">Provide business information (if applicable), contact details, and describe what you plan to sell</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <div className="space-y-1">
                  <p><strong>Wait for Approval</strong></p>
                  <p className="text-xs">Our team reviews applications within 1-3 business days</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                <div className="space-y-1">
                  <p><strong>Set Up Your Store</strong></p>
                  <p className="text-xs">Once approved, add products and schedule your first show!</p>
                </div>
              </li>
            </ol>
          </div>
        )
      },
      {
        title: "What You Can Do as a Seller",
        body: (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold text-sm mb-2">On Mobile & Web:</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Host live video shows</li>
                    <li>• Add products on the go</li>
                    <li>• Start quick auctions during shows</li>
                    <li>• Run 5-minute giveaways</li>
                    <li>• Chat with viewers</li>
                    <li>• Pin products during streams</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold text-sm mb-2">Web Only (Seller Hub):</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Create long-term featured auctions</li>
                    <li>• Bulk upload many products at once</li>
                    <li>• View detailed sales analytics</li>
                    <li>• Schedule shows in advance</li>
                    <li>• Manage all orders</li>
                    <li>• Set up shipping profiles</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Hosting Your First Live Show",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">Ready to go live? Here's a simple guide:</p>
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span><strong>Prepare Your Products:</strong> Have items ready to show on camera</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span><strong>Choose Good Lighting:</strong> Make sure viewers can see products clearly</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span><strong>Start Your Show:</strong> Click "Go Live" and select a category</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span><strong>Welcome Viewers:</strong> Greet people as they join your show</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                <span><strong>Demonstrate Products:</strong> Show items on camera, explain features, answer questions</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">6.</span>
                <span><strong>Pin Products:</strong> Make items available for purchase during the show</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">7.</span>
                <span><strong>Run Auctions/Giveaways:</strong> Create excitement with special offers</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">8.</span>
                <span><strong>End Gracefully:</strong> Thank viewers and announce your next show</span>
              </li>
            </ol>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
              <p className="text-sm font-medium mb-2">💡 Tips for Success:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Be energetic and enthusiastic</li>
                <li>• Respond to chat messages quickly</li>
                <li>• Demonstrate products thoroughly</li>
                <li>• Host shows regularly to build an audience</li>
                <li>• Offer special deals to your live viewers</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        title: "Seller Fees",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Understanding what you'll pay:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Commission:</strong> A small percentage of each sale goes to {appName} (typically 6-10%)</li>
              <li><strong>Payment Processing:</strong> Standard credit card processing fees apply</li>
              <li><strong>No Listing Fees:</strong> It's free to add products to your store</li>
              <li><strong>No Monthly Fees:</strong> You only pay when you make sales</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">Exact commission rates are shown in your seller dashboard. You'll see a breakdown of fees for each sale.</p>
          </div>
        )
      },
      {
        title: "Getting Paid",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">How seller payouts work:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Add your bank account information in seller settings</li>
              <li>Funds from sales are held for 2-3 days after delivery</li>
              <li>Payouts are sent to your bank account weekly</li>
              <li>View all transactions in your seller dashboard</li>
              <li>Track pending and completed payouts</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: "seller-features",
    title: "Seller Tools & Features",
    icon: BarChart3,
    description: "Managing your business",
    content: [
      {
        title: "Product Management",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Easily add and organize your inventory:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Add Products:</strong> Upload photos, write descriptions, set prices</li>
              <li><strong>Organize with Categories:</strong> Help buyers find your products</li>
              <li><strong>Track Inventory:</strong> System automatically updates stock levels</li>
              <li><strong>Create Variants:</strong> Offer different sizes, colors, or options</li>
              <li><strong>Bulk Upload:</strong> Add many products at once using spreadsheet (web only)</li>
              <li><strong>Edit Anytime:</strong> Update prices, descriptions, and photos easily</li>
            </ul>
          </div>
        )
      },
      {
        title: "Creating Featured Auctions",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Set up long-term auctions (web only):</p>
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span>Go to your Seller Hub on the website</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span>Click "Create Featured Auction"</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span>Select a product or create a new one</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span>Set the starting bid price</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                <span>Choose start and end dates/times</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">6.</span>
                <span>Submit and your auction will appear on the homepage</span>
              </li>
            </ol>
            <p className="text-sm text-muted-foreground italic mt-3">Featured auctions get prominent placement on the homepage, perfect for high-value items!</p>
          </div>
        )
      },
      {
        title: "Sales Analytics",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Track your performance (web only):</p>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="border rounded-lg p-3">
                <DollarSign className="h-6 w-6 text-primary mb-2" />
                <p className="font-semibold text-sm">Revenue Reports</p>
                <p className="text-xs text-muted-foreground mt-1">See total sales, average order value, and trends over time</p>
              </div>
              <div className="border rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-primary mb-2" />
                <p className="font-semibold text-sm">Top Products</p>
                <p className="text-xs text-muted-foreground mt-1">Identify which items sell best and generate most revenue</p>
              </div>
              <div className="border rounded-lg p-3">
                <Users className="h-6 w-6 text-primary mb-2" />
                <p className="font-semibold text-sm">Customer Insights</p>
                <p className="text-xs text-muted-foreground mt-1">Learn about your buyers and repeat customers</p>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Order Fulfillment",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Managing orders is straightforward:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Get Notified:</strong> Receive email and app notifications for new orders</li>
              <li><strong>View Order Details:</strong> See what was ordered, shipping address, and customer notes</li>
              <li><strong>Print Shipping Labels:</strong> Generate labels directly in the system</li>
              <li><strong>Mark as Shipped:</strong> Update order status and add tracking number</li>
              <li><strong>Customer Communication:</strong> Message buyers if you have questions</li>
              <li><strong>Track History:</strong> View all past orders and their status</li>
            </ul>
          </div>
        )
      },
      {
        title: "Advanced Shipping Management",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">{appName} offers powerful shipping tools to streamline your fulfillment process:</p>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h5 className="font-semibold mb-2 flex items-center gap-2">
                <Printer className="h-5 w-5 text-primary" />
                Bulk Label Printing
              </h5>
              <p className="text-sm text-muted-foreground mb-2">
                Print shipping labels for multiple orders at once instead of creating them one by one. This is a huge time-saver during busy periods!
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>How it works:</strong></p>
                <ol className="space-y-1 ml-4">
                  <li>1. Go to the Shipping Management page</li>
                  <li>2. Select multiple orders using checkboxes</li>
                  <li>3. Click "Bulk Label" button</li>
                  <li>4. All labels are generated and downloaded as a single PDF</li>
                  <li>5. Print them all at once and attach to packages</li>
                </ol>
                <p className="text-xs italic mt-2">💡 Tip: Filter by show or date to process all orders from a specific event together.</p>
              </div>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h5 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                USPS SCAN Forms
              </h5>
              <p className="text-sm text-muted-foreground mb-2">
                Save time at the post office by creating a USPS SCAN form - one barcode that represents all your packages. No need to scan each package individually!
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Benefits:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Drop off multiple packages with just one scan</li>
                  <li>Faster processing at USPS facilities</li>
                  <li>Immediate acceptance tracking for all packages</li>
                  <li>Professional appearance for your business</li>
                </ul>
                <p className="mt-2"><strong>How to use:</strong></p>
                <ol className="space-y-1 ml-4">
                  <li>1. Create shipping labels for your orders first</li>
                  <li>2. Go to Shipping Management and filter by "Marketplace" or specific show</li>
                  <li>3. Click "Generate SCAN Form"</li>
                  <li>4. Print the form and bring it with your packages to USPS</li>
                  <li>5. Hand the form to the postal worker - they'll scan just this one sheet!</li>
                </ol>
                <p className="text-xs italic mt-2">💡 You can view and reprint previous SCAN forms anytime using the "View SCAN Form" button.</p>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h5 className="font-semibold mb-2 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Bundling Shipments
              </h5>
              <p className="text-sm text-muted-foreground mb-2">
                Combine multiple orders going to the same buyer into one package to save on shipping costs.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>When to bundle:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Same buyer purchased multiple items from you</li>
                  <li>All items are ready to ship at the same time</li>
                  <li>Items can physically fit in one box together</li>
                  <li>Shipping destination is the same for all orders</li>
                </ul>
                <p className="mt-2"><strong>How to bundle:</strong></p>
                <ol className="space-y-1 ml-4">
                  <li>1. The system automatically detects orders that can be bundled together</li>
                  <li>2. You'll see suggested bundles in the Shipping Management page</li>
                  <li>3. Review the items and confirm the bundle</li>
                  <li>4. Create one shipping label for the combined package</li>
                  <li>5. Pack all items together and ship as one</li>
                </ol>
                <p className="text-xs italic mt-2">💡 Bundling saves you money on shipping and provides better service to your customers!</p>
              </div>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h5 className="font-semibold mb-2 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Unbundling Shipments
              </h5>
              <p className="text-sm text-muted-foreground mb-2">
                Need to split a previously bundled shipment? Sometimes you realize items should be shipped separately after bundling them.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Why unbundle:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>One item is out of stock or damaged</li>
                  <li>Items are too large to fit in one box</li>
                  <li>Customer requested separate shipment</li>
                  <li>Different shipping speeds needed</li>
                </ul>
                <p className="mt-2"><strong>How to unbundle:</strong></p>
                <ol className="space-y-1 ml-4">
                  <li>1. Find the bundled order in Shipping Management</li>
                  <li>2. Click the unbundle button (unlink icon)</li>
                  <li>3. Select which items to remove from the bundle</li>
                  <li>4. The items will become separate shipments</li>
                  <li>5. Create individual labels for each shipment</li>
                </ol>
                <p className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-xs mt-2">
                  <strong>⚠️ Important:</strong> If you've already created a label for the bundle, you may need to void it and create new labels after unbundling.
                </p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
              <h5 className="font-semibold mb-2">📦 Complete Shipping Workflow</h5>
              <p className="text-sm text-muted-foreground mb-3">Here's the recommended process for managing your shipments:</p>
              <ol className="text-sm text-muted-foreground space-y-2 ml-4">
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                  <span><strong>Review Orders:</strong> Check your unfulfilled orders and bundle any that can be combined</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                  <span><strong>Create Labels:</strong> Use bulk label printing to generate all labels at once</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                  <span><strong>Generate SCAN Form:</strong> Create one form for all your USPS packages</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                  <span><strong>Pack and Ship:</strong> Attach labels and drop everything off at USPS with your SCAN form</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                  <span><strong>Track Progress:</strong> Monitor delivery status and handle any issues that arise</span>
                </li>
              </ol>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: "safety-support",
    title: "Safety & Support",
    icon: Shield,
    description: "Staying safe and getting help",
    content: [
      {
        title: "Your Safety is Important",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">We're committed to keeping you safe:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Secure Payments:</strong> All transactions are encrypted and processed through secure payment providers</li>
              <li><strong>Privacy Protection:</strong> Your personal information is never shared with sellers without your permission</li>
              <li><strong>Buyer Protection:</strong> Report issues with orders and we'll help resolve them</li>
              <li><strong>Content Moderation:</strong> Our team monitors shows and products for inappropriate content</li>
              <li><strong>User Reporting:</strong> Report sellers, products, or chat messages that violate our policies</li>
            </ul>
          </div>
        )
      },
      {
        title: "How to Report a Problem",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">If you see something concerning:</p>
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span>Click the "Report" button on the show, product, or message</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span>Select the reason for reporting (scam, inappropriate content, etc.)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span>Provide any additional details that might help</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span>Submit the report - our team will review it promptly</span>
              </li>
            </ol>
            <p className="text-sm text-muted-foreground mt-3">Reports are confidential and help us maintain a safe community.</p>
          </div>
        )
      },
      {
        title: "Getting Help",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Need assistance? We're here to help:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Help Center:</strong> Browse FAQs and guides for common questions</li>
              <li><strong>Contact Support:</strong> Email us through the Contact page</li>
              <li><strong>Live Chat:</strong> Chat with support during business hours (coming soon)</li>
              <li><strong>Seller Support:</strong> Special support channels for seller-specific questions</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">We typically respond to support requests within 24 hours.</p>
          </div>
        )
      }
    ]
  },
  {
    id: "tips-tricks",
    title: "Tips & Best Practices",
    icon: Star,
    description: `Getting the most from ${appName}`,
    content: [
      {
        title: "For Buyers",
        body: (
          <div className="space-y-3">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Follow Your Favorite Sellers:</strong> Get notified when they go live</li>
              <li><strong>Set Bid Limits:</strong> Use autobid to avoid overspending on auctions</li>
              <li><strong>Ask Questions:</strong> Don't hesitate to ask about products in chat</li>
              <li><strong>Watch Regularly:</strong> Many sellers offer special deals to loyal viewers</li>
              <li><strong>Enable Notifications:</strong> Never miss a show from sellers you love</li>
              <li><strong>Check Show Schedules:</strong> Plan ahead for shows you don't want to miss</li>
            </ul>
          </div>
        )
      },
      {
        title: "For Sellers",
        body: (
          <div className="space-y-3">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Be Consistent:</strong> Host shows on a regular schedule so viewers know when to tune in</li>
              <li><strong>Engage with Chat:</strong> Respond to viewer messages - it builds loyalty</li>
              <li><strong>Good Lighting Matters:</strong> Make sure products are clearly visible</li>
              <li><strong>Demonstrate Thoroughly:</strong> Show products from all angles, demonstrate features</li>
              <li><strong>Offer Variety:</strong> Mix regular products, auctions, and giveaways to keep shows exciting</li>
              <li><strong>Promote Your Shows:</strong> Share your show schedule on social media</li>
              <li><strong>Price Competitively:</strong> Research similar products to set fair prices</li>
              <li><strong>Ship Quickly:</strong> Fast shipping leads to happy customers and good reviews</li>
            </ul>
          </div>
        )
      },
      {
        title: "Making the Most of Live Shows",
        body: (
          <div className="space-y-3">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Join Early:</strong> Get a good spot in chat and don't miss early deals</li>
              <li><strong>Stay Until the End:</strong> Best deals often come at the end of shows</li>
              <li><strong>Be Respectful:</strong> Treat sellers and other viewers with kindness</li>
              <li><strong>Have Fun:</strong> Live shows are entertainment - enjoy the experience!</li>
              <li><strong>Share Great Shows:</strong> Tell friends about sellers you love</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: "faq",
    title: "Common Questions",
    icon: MessageSquare,
    description: "Quick answers to frequent questions",
    content: [
      {
        title: "Account & Profile",
        body: (
          <div className="space-y-3">
            <div>
              <p className="font-medium text-sm mb-1">Q: How do I change my password?</p>
              <p className="text-sm text-muted-foreground">A: Go to your profile, click "Settings," then "Security." You can reset your password there.</p>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">Q: Can I use the same account on web and mobile?</p>
              <p className="text-sm text-muted-foreground">A: Yes! Your account works across all platforms. Just log in with the same email.</p>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">Q: How do I delete my account?</p>
              <p className="text-sm text-muted-foreground">A: Contact support through the Contact page to request account deletion.</p>
            </div>
          </div>
        )
      },
      {
        title: "Shopping & Payments",
        body: (
          <div className="space-y-3">
            <div>
              <p className="font-medium text-sm mb-1">Q: When will I be charged for an auction I won?</p>
              <p className="text-sm text-muted-foreground">A: Immediately when the auction ends. The payment is processed automatically.</p>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">Q: Can I cancel an order after placing it?</p>
              <p className="text-sm text-muted-foreground">A: Contact the seller as soon as possible. If it hasn't shipped yet, they may be able to cancel it.</p>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">Q: What if I never receive my order?</p>
              <p className="text-sm text-muted-foreground">A: First contact the seller. If they don't respond or resolve the issue, contact our support team.</p>
            </div>
          </div>
        )
      },
      {
        title: "Selling",
        body: (
          <div className="space-y-3">
            <div>
              <p className="font-medium text-sm mb-1">Q: How long does seller approval take?</p>
              <p className="text-sm text-muted-foreground">A: Usually 1-3 business days. You'll receive an email when your application is reviewed.</p>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">Q: Can I sell internationally?</p>
              <p className="text-sm text-muted-foreground">A: Yes, you can ship to any country you choose. Set your shipping zones in seller settings.</p>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">Q: What types of products can't I sell?</p>
              <p className="text-sm text-muted-foreground">A: Prohibited items include weapons, illegal substances, counterfeit goods, and adult content. See our full policy in seller terms.</p>
            </div>
          </div>
        )
      }
    ]
  }
];
