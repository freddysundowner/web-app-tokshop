import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Eye, 
  CheckCircle, 
  Ban, 
  Clock, 
  ShoppingCart, 
  DollarSign,
  Video,
  TrendingUp,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { defaultTemplates } from "@/lib/email-template-defaults";

const DEFAULT_CONTENT_PAGES: Record<string, any> = {
  faq: {
    title: 'Frequently Asked Questions',
    subtitle: 'Find answers to common questions about our platform',
    faqs: [
      { question: 'How do I create an account?', answer: 'Click on the "Get Started" button and follow the registration process. You can sign up using your email or social media accounts.' },
      { question: 'Is it safe to shop here?', answer: 'Yes! We provide buyer protection on all purchases and use secure payment processing to ensure your transactions are safe.' },
      { question: 'How do live auctions work?', answer: 'Join a live show, browse the items being showcased, and place your bids in real-time. The highest bidder wins when the auction closes.' },
      { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, debit cards, and digital payment methods through our secure payment processor.' },
    ],
  },
  about: {
    title: 'About Us',
    subtitle: 'Learn more about our platform and mission',
    sections: [
      { title: 'Our Story', content: 'We started with a simple mission: to create the most engaging and trustworthy live shopping marketplace. Today, thousands of buyers and sellers connect on our platform every day to discover amazing deals and build lasting relationships.' },
      { title: 'Our Mission', content: "We believe shopping should be fun, social, and exciting. That's why we've built a platform that combines the thrill of live auctions with the convenience of online shopping." },
      { title: 'Why Choose Us', content: "With buyer protection, secure payments, and a vibrant community of sellers, we're committed to providing the best live shopping experience possible." },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How we collect, use, and protect your information',
    sections: [
      { title: 'Information We Collect', content: 'We collect information you provide directly to us, such as when you create an account, make a purchase, or contact our support team.' },
      { title: 'How We Use Your Information', content: 'We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.' },
      { title: 'Data Security', content: 'We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure.' },
      { title: 'Your Rights', content: "You have the right to access, update, or delete your personal information. Contact us if you'd like to exercise these rights." },
    ],
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'Rules and guidelines for using our platform',
    sections: [
      { title: 'Acceptance of Terms', content: 'By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.' },
      { title: 'User Accounts', content: 'You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.' },
      { title: 'Prohibited Activities', content: 'You may not use our platform for any illegal purposes or to violate any laws. This includes but is not limited to fraud, harassment, or posting harmful content.' },
      { title: 'Termination', content: 'We reserve the right to terminate or suspend your account at any time for violations of these terms or for any other reason we deem necessary.' },
    ],
  },
  contact: {
    title: 'Contact Us',
    subtitle: 'Get in touch with our team',
    description: "Have a question or need help? We're here for you. Reach out and we'll respond as soon as possible.",
    contactInfo: {
      email: 'support@example.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main Street, City, State 12345',
    },
    showContactForm: true,
    sections: [
      { title: 'Customer Support', content: 'Our support team is available Monday through Friday, 9am to 5pm EST. We aim to respond to all inquiries within 24 hours.' },
    ],
  },
};

const DEFAULT_LANDING_CONTENT = {
  hero: {
    title: 'The Live Shopping Marketplace',
    subtitle: 'Shop, sell, and connect around the things you love.',
    primaryButtonText: 'Get Started',
    primaryButtonLink: '/signup',
    secondaryButtonText: 'Browse Shows',
    secondaryButtonLink: '/marketplace',
    downloadText: 'Download',
    phoneImage1: '',
    phoneImage2: '',
    qrCodeImage: ''
  },
  joinFun: {
    title: 'Join In the Fun',
    subtitle: 'Take part in fast-paced auctions, incredible flash sales, live show giveaways, and so much more.',
    downloadText: 'Download',
    phoneImage: '',
    qrCodeImage: ''
  },
  gotItAll: {
    title: "We've Got It All",
    subtitle: "Search our marketplace to find the exact product you're looking for",
    downloadText: 'Download',
    phoneImage: '',
    qrCodeImage: ''
  },
  deals: {
    title: 'Find Incredible Deals on Name Brands',
    subtitle: "From the brands you love, to hard-to-find specialty products. There's a deal on whatever you're looking for.",
    buttonText: 'Start Shopping',
    buttonLink: '/signup',
    downloadText: 'Download',
    trustBadgeText: 'PEACE OF MIND',
    phoneImage: '',
    qrCodeImage: ''
  },
  footer: {
    copyrightText: '2025'
  }
};

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { settings } = useSettings();
  const currency = settings.currency || '$';
  const hasSeededRef = useRef(false);

  useEffect(() => {
    if (!user?.admin) {
      setLocation("/");
    }
  }, [user?.admin, setLocation]);

  useEffect(() => {
    if (!user?.admin || hasSeededRef.current) return;
    hasSeededRef.current = true;

    const seedMissingTemplates = async () => {
      try {
        const res = await fetch("/api/templates", { credentials: "include" });
        const data = await res.json();
        const existing: any[] = Array.isArray(data?.data) ? data.data : data?.data ? [data.data] : [];
        const existingSlugs = new Set(existing.map((t: any) => t.slug));
        const missing = defaultTemplates.filter(t => !existingSlugs.has(t.id));
        if (missing.length === 0) return;
        for (const template of missing) {
          await apiRequest("POST", "/api/templates", {
            name: template.name,
            slug: template.id,
            subject: template.subject,
            htmlContent: template.body,
            placeholders: template.variables.map((v: any) => v.name),
          });
        }
        queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      } catch (err) {
        console.warn("[Dashboard] Failed to seed email templates:", err);
      }
    };

    const seedLandingPage = async () => {
      try {
        const res = await fetch("/api/content/landing", { credentials: "include" });
        const data = await res.json();
        const existing = data?.data;
        const hasValidContent =
          existing?.hero && existing?.joinFun && existing?.gotItAll && existing?.deals && existing?.hero?.title;
        if (hasValidContent) return;
        await apiRequest("PUT", "/api/admin/content/landing", DEFAULT_LANDING_CONTENT);
        queryClient.invalidateQueries({ queryKey: ["/api/content/landing"] });
      } catch (err) {
        console.warn("[Dashboard] Failed to seed landing page:", err);
      }
    };

    const seedContentPages = async () => {
      await Promise.all(
        Object.entries(DEFAULT_CONTENT_PAGES).map(async ([pageType, defaultContent]) => {
          try {
            const res = await fetch(`/api/content/${pageType}`, { credentials: "include" });
            const data = await res.json();
            if (data?.data?.title) return;
            await apiRequest("PUT", `/api/admin/content/${pageType}`, defaultContent);
            queryClient.invalidateQueries({ queryKey: [`/api/content/${pageType}`] });
          } catch (err) {
            console.warn(`[Dashboard] Failed to seed ${pageType} page:`, err);
          }
        })
      );
    };

    seedMissingTemplates();
    seedLandingPage();
    seedContentPages();
  }, [user?.admin]);

  const { data: userStatsData } = useQuery<{
    success: boolean;
    data: any;
  }>({
    queryKey: ['/api/admin/users/stats/all'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users/stats/all', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      return await response.json();
    },
  });


  const { data: roomStatsData } = useQuery<{
    success: boolean;
    data: {
      total: number;
      live: number;
      upcoming: number;
    };
  }>({
    queryKey: ['/api/admin/rooms/stats/all'],
    queryFn: async () => {
      const response = await fetch('/api/admin/rooms/stats/all', {
        credentials: 'include',
      });
      if (!response.ok) {
        return { success: false, data: { total: 0, live: 0, upcoming: 0 } };
      }
      return await response.json();
    },
  });

  const { data: orderStatsData } = useQuery<{
    success: boolean;
    data: any;
  }>({
    queryKey: ['/api/admin/orders/stats/all'],
    queryFn: async () => {
      const response = await fetch('/api/admin/orders/stats/all', {
        credentials: 'include',
      });
      if (!response.ok) {
        return { success: false, data: {} };
      }
      return await response.json();
    },
  });

  const { data: usersData } = useQuery<{
    success: boolean;
    data: {
      users: any[];
    };
  }>({
    queryKey: ['/api/admin/users', 'dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users?limit=5', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return await response.json();
    },
  });

  const { data: disputesData } = useQuery<{
    success: boolean;
    data: any;
  }>({
    queryKey: ['/api/admin/disputes', 'dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/admin/disputes?page=1&limit=5', {
        credentials: 'include',
      });
      if (!response.ok) {
        return { success: false, data: { disputes: [] } };
      }
      return await response.json();
    },
  });

  const { data: ordersData } = useQuery<any>({
    queryKey: ['/api/orders/items/all?limit=5'],
  });

  const userStats = userStatsData?.data || {};
  const recentUsers = usersData?.data?.users || [];
  const disputes = disputesData?.data?.disputes || disputesData?.data || [];
  const recentOrders = ordersData?.items || [];
  
  const orderStats = orderStatsData?.data || {};
  const roomStatsRaw: any = roomStatsData?.data || {};
  const recentShows = roomStatsRaw.recentshows || roomStatsRaw.recentShows || [];
  const roomStats = Object.fromEntries(
    Object.entries(roomStatsRaw).filter(([key, value]) => 
      typeof value === 'number' || typeof value === 'string'
    )
  );

  const formatStatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
      .trim();
  };

  const getStatIcon = (key: string) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('live')) return { icon: Video, color: 'text-red-500', valueColor: 'text-red-600' };
    if (lowerKey.includes('upcoming') || lowerKey.includes('pending') || lowerKey.includes('scheduled')) return { icon: Clock, color: 'text-blue-500', valueColor: 'text-blue-600' };
    if (lowerKey.includes('active') || lowerKey.includes('approved')) return { icon: CheckCircle, color: 'text-green-500', valueColor: 'text-green-600' };
    if (lowerKey.includes('blocked') || lowerKey.includes('banned')) return { icon: Ban, color: 'text-red-500', valueColor: 'text-red-600' };
    if (lowerKey.includes('order')) return { icon: ShoppingCart, color: 'text-muted-foreground', valueColor: '' };
    if (lowerKey.includes('revenue') || lowerKey.includes('amount')) return { icon: DollarSign, color: 'text-green-500', valueColor: 'text-green-600' };
    if (lowerKey.includes('user') || lowerKey.includes('customer') || lowerKey.includes('seller')) return { icon: Users, color: 'text-muted-foreground', valueColor: '' };
    if (lowerKey.includes('show') || lowerKey.includes('room')) return { icon: Video, color: 'text-muted-foreground', valueColor: '' };
    if (lowerKey.includes('dispute')) return { icon: AlertCircle, color: 'text-orange-500', valueColor: 'text-orange-600' };
    return { icon: TrendingUp, color: 'text-muted-foreground', valueColor: '' };
  };

  const formatStatValue = (key: string, value: any): string => {
    const lowerKey = key.toLowerCase();
    const numValue = Number(value);
    if (lowerKey.includes('revenue') || lowerKey.includes('amount') || lowerKey.includes('price') || lowerKey.includes('value')) {
      return `${currency}${numValue.toFixed(2)}`;
    }
    return String(value ?? 0);
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your platform.</p>
        </div>

        {/* User Stats - Dynamic from API */}
        {Object.keys(userStats).length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Statistics
              </h2>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(userStats).map(([key, value]) => {
                const { icon: Icon, color, valueColor } = getStatIcon(key);
                return (
                  <Card key={key}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{formatStatLabel(key)}</CardTitle>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${valueColor}`}>
                        {formatStatValue(key, value)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Shows Stats - Dynamic from API */}
        {Object.keys(roomStats).length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Video className="h-5 w-5" />
                Show Statistics
              </h2>
              <Link href="/admin/shows">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(roomStats).map(([key, value]) => {
                const { icon: Icon, color, valueColor } = getStatIcon(key);
                return (
                  <Card key={key}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{formatStatLabel(key)}</CardTitle>
                      {key.toLowerCase() === 'live' ? (
                        <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                      ) : (
                        <Icon className={`h-4 w-4 ${color}`} />
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${valueColor}`}>
                        {formatStatValue(key, value)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Orders Stats - Dynamic from API */}
        {Object.keys(orderStats).length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order Statistics
              </h2>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(orderStats).map(([key, value]) => {
                const { icon: Icon, color, valueColor } = getStatIcon(key);
                return (
                  <Card key={key}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{formatStatLabel(key)}</CardTitle>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${valueColor}`}>
                        {formatStatValue(key, value)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Users</CardTitle>
                  <CardDescription>Latest registered users</CardDescription>
                </div>
                <Link href="/admin/users">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No users found</p>
              ) : (
                <div className="space-y-3">
                  {recentUsers.slice(0, 5).map((user: any) => (
                    <div key={user._id || user.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profilePhoto} />
                          <AvatarFallback>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.seller ? "default" : "secondary"} className="text-xs">
                          {user.seller ? "Seller" : "Customer"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/admin/users/${user._id || user.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Shows */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Shows</CardTitle>
                  <CardDescription>Latest live shows</CardDescription>
                </div>
                <Link href="/admin/shows">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentShows.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No shows found</p>
              ) : (
                <div className="space-y-3">
                  {recentShows.slice(0, 5).map((show: any) => (
                    <div key={show._id || show.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                          <Video className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{show.title || show.name || 'Untitled Show'}</p>
                          <p className="text-xs text-muted-foreground">
                            {show.owner?.userName || show.owner?.firstName || show.hostId?.userName || show.host?.userName || 'Unknown Host'}
                            {show.date && ` • ${format(new Date(show.date), 'MMM d, yyyy h:mm a')}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={show.status === 'live' ? "destructive" : show.status === 'upcoming' ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {show.status || (show.active ? "Live" : "Ended")}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/admin/shows/${show._id || show.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Recent Orders & Open Disputes */}
        <div className="grid grid-cols-1 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Orders</CardTitle>
                  <CardDescription>Latest customer orders</CardDescription>
                </div>
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No orders found</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.slice(0, 5).map((order: any) => (
                    <div key={order._id || order.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {order.productId?.images?.[0] ? (
                          <img 
                            src={order.productId.images[0]} 
                            alt={order.productId?.name || 'Product'} 
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium line-clamp-1">
                            {order.order_reference || order._id?.slice(-8) || 'Order'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.customer?.userName || order.customer?.firstName || 'Buyer'} → {order.seller?.userName || order.seller?.firstName || 'Seller'}
                            {order.quantity && ` • Qty: ${order.quantity}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={order.status === 'completed' || order.status === 'delivered' ? "default" : order.status === 'pending' ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {(order.status || 'Pending').replace(/_/g, ' ')}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/admin/orders/${order.orderId?._id || order.orderId}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open Disputes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Open Disputes</CardTitle>
                  <CardDescription>Disputes needing attention</CardDescription>
                </div>
                <Link href="/admin/disputes">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {(Array.isArray(disputes) ? disputes : []).length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No disputes found</p>
              ) : (
                <div className="space-y-3">
                  {(Array.isArray(disputes) ? disputes : []).slice(0, 5).map((dispute: any) => (
                    <div key={dispute._id || dispute.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-orange-100 rounded flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{dispute.reason || dispute.title || 'Dispute'}</p>
                          <p className="text-xs text-muted-foreground">
                            {dispute.createdAt ? format(new Date(dispute.createdAt), 'MMM d, yyyy') : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={dispute.status === 'open' || dispute.status === 'pending' ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {dispute.status || 'Open'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/admin/disputes/${dispute._id || dispute.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/admin/users">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span>Manage Users</span>
                </Button>
              </Link>
              <Link href="/admin/pending-approvals">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                  <Clock className="h-6 w-6" />
                  <span>Pending Approvals</span>
                </Button>
              </Link>
              <Link href="/admin/orders">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                  <ShoppingCart className="h-6 w-6" />
                  <span>View Orders</span>
                </Button>
              </Link>
              <Link href="/admin/disputes">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                  <AlertCircle className="h-6 w-6" />
                  <span>Resolve Disputes</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
