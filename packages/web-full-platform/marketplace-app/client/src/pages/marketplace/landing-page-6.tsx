import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/lib/settings-context';
import { 
  ArrowRight, 
  Play, 
  Star, 
  Users, 
  Shield, 
  Video,
  ShoppingBag,
  Zap,
  TrendingUp,
  Clock,
  MessageCircle,
  Heart,
  Gift,
  ChevronRight,
  Smartphone,
  Monitor,
  Tablet,
  Bell,
  Lock,
  RefreshCw,
  Sparkles,
  Award,
  Target,
  BarChart3,
  Globe,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage6() {
  const { settings } = useSettings();

  const benefits = [
    {
      icon: Video,
      title: 'Live Shows',
      description: 'Real-time product showcases with HD streaming quality',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'Flash Sales',
      description: 'Limited-time exclusive deals and member-only offers',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Instant seller interaction and community engagement',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Shield,
      title: 'Protection',
      description: 'Secure & guaranteed purchases with full refund policy',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const platforms = [
    { icon: Monitor, name: 'Desktop', description: 'Full experience on your computer' },
    { icon: Smartphone, name: 'Mobile', description: 'Shop on the go with our app' },
    { icon: Tablet, name: 'Tablet', description: 'Optimized for all screen sizes' }
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Create Your Account',
      description: 'Sign up for free in under 30 seconds. No credit card required. Set your preferences and start exploring.',
      icon: Users
    },
    {
      step: '2',
      title: 'Discover Live Shows',
      description: 'Browse hundreds of live shows daily. Filter by category, seller, or product type. Get notified about upcoming shows.',
      icon: Video
    },
    {
      step: '3',
      title: 'Shop & Interact',
      description: 'Watch live, ask questions, and make purchases in real-time. Participate in auctions and flash sales.',
      icon: ShoppingBag
    },
    {
      step: '4',
      title: 'Secure Checkout',
      description: 'Complete your purchase with our secure payment system. Track your order and receive it quickly.',
      icon: Lock
    }
  ];

  const features = [
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Get alerts when your favorite sellers go live or when items you want go on sale.'
    },
    {
      icon: Heart,
      title: 'Wishlist & Save',
      description: 'Save products to your wishlist and get notified when prices drop.'
    },
    {
      icon: RefreshCw,
      title: 'Easy Returns',
      description: '30-day return policy on most items. Hassle-free refunds and exchanges.'
    },
    {
      icon: Award,
      title: 'Verified Quality',
      description: 'All sellers undergo verification. Every product is checked for authenticity.'
    },
    {
      icon: Target,
      title: 'Personalized Feeds',
      description: 'AI-powered recommendations based on your interests and behavior.'
    },
    {
      icon: BarChart3,
      title: 'Price Tracking',
      description: 'Track price history and get alerts when items hit your target price.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Martinez',
      role: 'Home Decor Enthusiast',
      content: 'I\'ve completely changed how I shop online. The live shows make it so much more engaging and fun. I can see products from every angle and ask questions in real-time.',
      rating: 5,
      avatar: 'SM',
      verified: true
    },
    {
      name: 'David Park',
      role: 'Tech Collector',
      content: 'The auction feature is addictive in the best way. I\'ve scored incredible deals on electronics and the seller verification gives me complete peace of mind.',
      rating: 5,
      avatar: 'DP',
      verified: true
    },
    {
      name: 'Emma Williams',
      role: 'Fashion Blogger',
      content: 'As someone who shops a lot, this platform is revolutionary. The live interaction with sellers and other buyers creates a real shopping community. Love it!',
      rating: 5,
      avatar: 'EW',
      verified: true
    },
    {
      name: 'Marcus Johnson',
      role: 'Vintage Collector',
      content: 'Finding rare collectibles has never been easier. The live shows let me verify authenticity before buying, and the protection policy is excellent.',
      rating: 5,
      avatar: 'MJ',
      verified: true
    }
  ];

  const stats = [
    { value: '50,000+', label: 'Active Users', sublabel: 'Growing community' },
    { value: '1,000+', label: 'Daily Shows', sublabel: 'Live 24/7' },
    { value: '250+', label: 'Categories', sublabel: 'Something for everyone' },
    { value: '98%', label: 'Satisfaction', sublabel: 'Happy customers' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-secondary/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-8 px-5 py-2 text-sm bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20" data-testid="badge-trending">
                <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                #1 Live Shopping Platform
              </Badge>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] mb-8">
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Shop Live,
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent">
                  Buy Smart
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
                Join the revolution in online shopping. Watch live shows, bid on exclusive items, and connect with sellers in real-time. Experience shopping the way it should be.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/login">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-black font-bold px-10 h-14 text-lg group shadow-lg w-full sm:w-auto" data-testid="button-join">
                    Join Now
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="px-10 h-14 text-lg border-2 backdrop-blur-sm w-full sm:w-auto" data-testid="button-explore">
                  Explore Shows
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-8">
                {stats.slice(0, 3).map((stat, index) => (
                  <div key={index}>
                    <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <Card className="overflow-hidden border-2 shadow-2xl backdrop-blur-sm bg-card/95">
                  <CardContent className="p-0">
                    <div className="aspect-[4/5]">
                      <img
                        src="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&h=750&fit=crop"
                        alt="Live shopping"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      
                      <Badge className="absolute top-4 left-4 bg-red-500/90 text-white border-0 px-4 py-2 backdrop-blur-sm">
                        <span className="h-2 w-2 bg-white rounded-full animate-pulse mr-2" />
                        LIVE
                      </Badge>

                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary" />
                              <div>
                                <div className="text-white font-semibold">Limited Edition Drop</div>
                                <div className="text-white/70 text-sm">@PremiumDeals</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4 text-white/80">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>8.5K</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                <span>2.1K</span>
                              </div>
                            </div>
                            <Button size="sm" className="bg-white text-black hover:bg-white/90 h-8" data-testid="button-join-show">
                              Join
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="absolute -right-4 top-1/4 animate-pulse" style={{ animationDelay: '0.5s' }}>
                  <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-4 shadow-xl">
                    <ShoppingBag className="h-8 w-8 text-black" />
                  </div>
                </div>

                <div className="absolute -left-4 bottom-1/3 animate-pulse" style={{ animationDelay: '1s' }}>
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 shadow-xl">
                    <Gift className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid with Gradient Cards */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-6">
              Why Choose Us?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for an exceptional shopping experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="group hover-elevate border-2 overflow-hidden">
                <CardContent className="p-8 relative">
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${benefit.color}`} />
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${benefit.color} mb-6 group-hover:scale-110 transition-transform`}>
                    <benefit.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-6">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in four simple steps
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="flex items-start gap-6 group">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-black text-black">{step.step}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-card border-2 rounded-2xl p-8 hover-elevate">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 hidden sm:block">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                          <step.icon className="h-7 w-7 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                          {step.title}
                        </h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {index < howItWorks.length - 1 && (
                  <ChevronRight className="h-8 w-8 text-muted-foreground mt-6 group-hover:translate-x-1 transition-transform hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to shop smarter and save more
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-8 rounded-2xl hover-elevate bg-card border-2">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-Platform Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-6">
              Shop Anywhere, Anytime
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Seamless experience across all your devices
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {platforms.map((platform, index) => (
              <Card key={index} className="border-2 hover-elevate">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 mb-6">
                    <platform.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {platform.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {platform.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-6">
              What Our Users Say
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of satisfied shoppers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-foreground mb-8 leading-relaxed text-lg">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-4 pt-6 border-t">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-foreground font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-foreground">{testimonial.name}</div>
                        {testimonial.verified && (
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            <CheckCircle2 className="h-3 w-3 mr-1 text-primary" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA with Gradient */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-secondary/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/50 to-background" />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-8">
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Join the Future of Shopping
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Start discovering amazing deals and connect with sellers worldwide. Sign up now and get access to exclusive member benefits.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-gradient-to-r from-primary via-purple-500 to-secondary hover:opacity-90 text-white font-bold px-16 h-16 text-lg group shadow-2xl" data-testid="button-cta-final">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center p-1.5">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-white">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                </div>
                <span className="text-xl font-bold text-foreground">{settings.app_name}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                The future of online shopping. Live shows, real-time interaction, and a community that loves to shop.
              </p>
              <div className="flex items-center gap-4">
                <Button size="icon" variant="outline" className="h-9 w-9">
                  <Globe className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="h-9 w-9">
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="h-9 w-9">
                  <Video className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Shop</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/marketplace" className="hover:text-foreground transition-colors">Live Shows</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Categories</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Auctions</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Flash Sales</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
                <li><Link href="/seller-login" className="hover:text-foreground transition-colors">Sell With Us</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Press</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Help</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Support</Link></li>
                <li><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <p className="text-center text-sm text-muted-foreground">
              © 2025 {settings.app_name}. All rights reserved. Made with ❤️ for shoppers everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
