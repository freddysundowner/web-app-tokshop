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
  DollarSign,
  Gift,
  Smartphone,
  Globe,
  Lock,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage4() {
  const { settings } = useSettings();

  const liveShows = [
    {
      title: 'Rare Sneaker Auction',
      seller: 'SneakerKing',
      viewers: '3.2K',
      image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&h=400&fit=crop',
      category: 'Sneakers'
    },
    {
      title: 'Vintage Watch Collection',
      seller: 'TimepieceDeals',
      viewers: '1.8K',
      image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&h=400&fit=crop',
      category: 'Watches'
    },
    {
      title: 'Limited Edition Cards',
      seller: 'CardCollector',
      viewers: '5.1K',
      image: 'https://images.unsplash.com/photo-1611916656173-875e4277bea6?w=600&h=400&fit=crop',
      category: 'Collectibles'
    }
  ];

  const reasons = [
    {
      icon: Video,
      title: 'Live Video Shopping',
      description: 'Watch products showcased in real-time by sellers'
    },
    {
      icon: Zap,
      title: 'Lightning Deals',
      description: 'Flash sales with limited quantities at unbeatable prices'
    },
    {
      icon: Gift,
      title: 'Exclusive Giveaways',
      description: 'Win free products during live shows'
    },
    {
      icon: Shield,
      title: 'Buyer Protection',
      description: 'Shop with confidence with our money-back guarantee'
    },
    {
      icon: Globe,
      title: 'Global Marketplace',
      description: 'Connect with sellers and buyers worldwide'
    },
    {
      icon: Lock,
      title: 'Secure Checkout',
      description: 'Industry-standard encryption for all transactions'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Bold Split Hero */}
      <section className="min-h-screen grid lg:grid-cols-2">
        {/* Left - Content */}
        <div className="flex items-center justify-center p-8 lg:p-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-xl">
            <Badge className="mb-6 px-4 py-2" data-testid="badge-new">
              <Zap className="h-4 w-4 mr-2" />
              The Future of Shopping is Here
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
              <span className="text-foreground">Live.</span>
              <br />
              <span className="text-foreground">Social.</span>
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Shopping.
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Experience shopping reimagined. Join live shows, bid on exclusive items, and connect with a community of passionate buyers and sellers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link href="/login">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-bold px-10 h-16 text-lg w-full sm:w-auto group" data-testid="button-get-started">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-10 h-16 text-lg border-2 w-full sm:w-auto" data-testid="button-learn-more">
                Learn More
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">50K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">250+</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">4.9★</div>
                <div className="text-sm text-muted-foreground">User Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Live Shows Grid */}
        <div className="bg-muted/30 p-8 lg:p-16 flex items-center">
          <div className="w-full">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                <h3 className="text-2xl font-bold text-foreground">Live Now</h3>
              </div>
              <p className="text-muted-foreground">Join thousands watching</p>
            </div>

            <div className="space-y-4">
              {liveShows.map((show, index) => (
                <Card key={index} className="overflow-hidden hover-elevate cursor-pointer border-2 group">
                  <CardContent className="p-0">
                    <div className="grid sm:grid-cols-5 gap-4">
                      <div className="sm:col-span-2 relative">
                        <div className="aspect-video sm:aspect-square">
                          <img src={show.image} alt={show.title} className="w-full h-full object-cover" />
                        </div>
                        <Badge className="absolute top-2 left-2 bg-red-500 text-white border-0">
                          LIVE
                        </Badge>
                      </div>
                      <div className="sm:col-span-3 p-4 flex flex-col justify-center">
                        <Badge variant="outline" className="w-fit mb-2">{show.category}</Badge>
                        <h4 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {show.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">by {show.seller}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{show.viewers} watching</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link href="/login">
                <Button variant="ghost" className="group" data-testid="button-view-all-shows">
                  View All Live Shows
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Icon Grid */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-4">
              Why Choose {settings.app_name}?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for the ultimate shopping experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {reasons.map((reason, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 mb-4 group-hover:scale-110 transition-transform">
                  <reason.icon className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {reason.title}
                </h3>
                <p className="text-muted-foreground">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Bold Steps */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '1',
                title: 'Sign Up',
                description: 'Create your free account in seconds',
                icon: Smartphone
              },
              {
                step: '2',
                title: 'Browse Shows',
                description: 'Explore live streams and products',
                icon: Play
              },
              {
                step: '3',
                title: 'Shop & Win',
                description: 'Buy, bid, or win exclusive items',
                icon: ShoppingBag
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="text-8xl font-black text-primary/10 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4">
                    {item.step}
                  </div>
                  <div className="relative inline-flex p-6 rounded-2xl bg-card border-2 shadow-lg">
                    <item.icon className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-lg text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join our growing community of happy shoppers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote: "Best shopping experience I've ever had. The live shows make it so interactive and fun!",
                author: "Jessica M.",
                role: "Fashion Enthusiast",
                rating: 5
              },
              {
                quote: "Found incredible deals on sneakers I couldn't find anywhere else. Highly recommend!",
                author: "David L.",
                role: "Sneaker Collector",
                rating: 5
              },
              {
                quote: "The seller interaction is amazing. Feels like shopping with friends. Love it!",
                author: "Sarah K.",
                role: "Regular Shopper",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="border-2 hover-elevate">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-foreground mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                      {testimonial.author[0]}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Bold */}
      <section className="py-32 bg-gradient-to-br from-primary/20 via-purple-500/20 to-secondary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-5" />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground mb-8">
            Ready to Join?
          </h2>
          <p className="text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Start your live shopping journey today
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-bold px-16 h-20 text-xl group shadow-2xl" data-testid="button-join-final">
              Join {settings.app_name} Now
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
            </Button>
          </Link>

          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>Free to join</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>Cancel anytime</span>
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
