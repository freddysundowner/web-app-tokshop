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
  TrendingUp, 
  Zap, 
  Shield, 
  Video,
  ShoppingBag,
  Heart,
  Clock,
  Award,
  Sparkles,
  Check
} from 'lucide-react';

export default function LandingPage3() {
  const { settings } = useSettings();

  const categories = [
    { name: 'Fashion', icon: '👗', count: '12.5K+ items' },
    { name: 'Electronics', icon: '📱', count: '8.2K+ items' },
    { name: 'Collectibles', icon: '🎨', count: '15.3K+ items' },
    { name: 'Sneakers', icon: '👟', count: '9.8K+ items' },
    { name: 'Sports Cards', icon: '🏀', count: '11.1K+ items' },
    { name: 'Jewelry', icon: '💎', count: '6.7K+ items' },
  ];

  const benefits = [
    { icon: Clock, text: 'Real-time bidding & instant purchases' },
    { icon: Shield, text: 'Buyer protection on all orders' },
    { icon: Users, text: 'Connect with verified sellers' },
    { icon: Award, text: 'Win exclusive giveaways' },
    { icon: Sparkles, text: 'Discover unique finds daily' },
    { icon: TrendingUp, text: 'Track market trends' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Animated Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-purple-500/10" />
          <div className="absolute top-20 left-10 h-72 w-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 h-96 w-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              <Badge className="mb-6 px-4 py-2" data-testid="badge-trending">
                <TrendingUp className="h-4 w-4 mr-2" />
                #1 Live Shopping Platform
              </Badge>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                <span className="text-foreground">Shop</span>
                <br />
                <span className="bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent">
                  Like Never Before
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8">
                Join live shows, interact with sellers in real-time, and snag incredible deals on products you love.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link href="/login">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-semibold px-8 h-14 text-lg group w-full sm:w-auto" data-testid="button-join-now">
                    Join Now - It's Free
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="px-8 h-14 text-lg w-full sm:w-auto" data-testid="button-explore">
                  <Video className="mr-2 h-5 w-5" />
                  Explore Live Shows
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground">50K+ Active Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground">250+ Categories</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground">100K+ Products</span>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="relative z-10">
                {/* Main Card */}
                <Card className="overflow-hidden shadow-2xl border-2">
                  <CardContent className="p-0">
                    <div className="aspect-video relative">
                      <img
                        src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop"
                        alt="Live shopping"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Live Indicator */}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-red-500 text-white border-0 px-3 py-1">
                          <span className="h-2 w-2 bg-white rounded-full animate-pulse mr-2" />
                          LIVE
                        </Badge>
                      </div>

                      {/* Viewer Count */}
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-semibold">
                        <Users className="h-4 w-4 inline mr-1" />
                        12.5K watching
                      </div>

                      {/* Bottom Info */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary" />
                          <div>
                            <div className="text-white font-semibold">Premium Sneaker Drop</div>
                            <div className="text-white/70 text-sm">by SneakerKing</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Floating Cards */}
                <div className="absolute -right-4 top-1/4 animate-pulse">
                  <Card className="bg-card border-2 shadow-lg" style={{ animationDelay: '0.5s' }}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-sm">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-foreground">New Sale!</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="absolute -left-4 bottom-1/4 animate-pulse" style={{ animationDelay: '1s' }}>
                  <Card className="bg-card border-2 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Heart className="h-5 w-5 text-red-500" />
                        <span className="font-semibold text-foreground">+234 Likes</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Shop Your Passion
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore 250+ categories across fashion, electronics, collectibles, and more
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <Card key={index} className="hover-elevate cursor-pointer group border-2">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                    {category.icon}
                  </div>
                  <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{category.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8 h-12" data-testid="button-browse-all">
                Browse All Categories
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The complete live shopping experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4 p-6 rounded-xl hover-elevate bg-card border">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <benefit.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{benefit.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-purple-500/10 to-secondary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-5" />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2" data-testid="badge-limited">
              <Zap className="h-4 w-4 mr-2" />
              Limited Time Offer
            </Badge>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Start Your Live Shopping Journey Today
            </h2>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join now and get exclusive access to member-only deals and giveaways
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/login">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-semibold px-12 h-16 text-lg group w-full sm:w-auto" data-testid="button-create-account">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>50K+ Users</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors" data-testid="link-privacy">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:text-foreground transition-colors" data-testid="link-terms">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors" data-testid="link-contact">
                Contact
              </Link>
              <Link href="/faq" className="hover:text-foreground transition-colors" data-testid="link-faq">
                FAQ
              </Link>
              <Link href="/help-center" className="hover:text-foreground transition-colors" data-testid="link-help-center">
                Help Center
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-black rounded-full flex items-center justify-center p-1">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-primary">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                </div>
                <span className="font-semibold text-foreground">{settings.app_name}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © 2025 {settings.app_name}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
