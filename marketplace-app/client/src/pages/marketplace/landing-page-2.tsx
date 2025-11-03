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
  MessageCircle,
  DollarSign,
  ChevronRight
} from 'lucide-react';

export default function LandingPage2() {
  const { settings } = useSettings();

  const features = [
    {
      icon: Video,
      title: 'Live Streaming',
      description: 'Watch real-time product showcases from verified sellers',
      color: 'text-blue-500'
    },
    {
      icon: ShoppingBag,
      title: 'Instant Checkout',
      description: 'One-click purchasing during live shows for lightning-fast deals',
      color: 'text-green-500'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Interact with sellers and other shoppers in real-time',
      color: 'text-purple-500'
    },
    {
      icon: Shield,
      title: 'Buyer Protection',
      description: 'Secure transactions with money-back guarantee',
      color: 'text-orange-500'
    }
  ];

  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: '250+', label: 'Categories' },
    { value: '100K+', label: 'Products Sold' },
    { value: '4.9/5', label: 'Average Rating' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Video Style */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-10" />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2 text-sm" data-testid="badge-live">
              <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse mr-2" />
              Join 12.5K watching live now
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6">
              Shop Live.
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Buy Instantly.
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Experience the future of online shopping with live streaming, real-time auctions, and interactive shows from your favorite sellers.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/login">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-semibold px-10 h-14 text-lg group" data-testid="button-get-started">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-10 h-14 text-lg" data-testid="button-watch-live">
                <Play className="mr-2 h-5 w-5" />
                Watch Live Shows
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Why Shop Live?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need for an amazing shopping experience in one platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover-elevate cursor-pointer group">
                <CardContent className="p-6">
                  <div className={`inline-flex p-3 rounded-xl bg-muted mb-4 ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Modern Timeline */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Get Started in 3 Steps
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start shopping live in minutes
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {[
                {
                  step: '01',
                  title: 'Create Account',
                  description: 'Sign up for free in seconds with email or social login',
                  image: 'https://images.unsplash.com/photo-1633409361618-c73427e4e206?w=600&h=400&fit=crop'
                },
                {
                  step: '02',
                  title: 'Browse Live Shows',
                  description: 'Explore 250+ categories and join live streaming events',
                  image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&h=400&fit=crop'
                },
                {
                  step: '03',
                  title: 'Shop & Win',
                  description: 'Buy instantly, bid on auctions, or enter giveaways',
                  image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=400&fit=crop'
                }
              ].map((item, index) => (
                <div key={index} className="grid md:grid-cols-2 gap-8 items-center">
                  <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                    <div className="text-6xl font-bold text-primary/20 mb-2">{item.step}</div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">{item.title}</h3>
                    <p className="text-lg text-muted-foreground mb-6">{item.description}</p>
                    <Button variant="ghost" className="group" data-testid={`button-learn-step-${item.step}`}>
                      Learn more
                      <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                  <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                    <div className="aspect-[3/2] rounded-2xl overflow-hidden shadow-xl">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Loved by Shoppers Worldwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what our community has to say
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: 'Sarah Johnson',
                role: 'Sneaker Collector',
                content: 'Found rare sneakers I\'ve been searching for months! The live auctions are so exciting.',
                rating: 5
              },
              {
                name: 'Mike Chen',
                role: 'Tech Enthusiast',
                content: 'Amazing deals on electronics. Love the real-time interaction with sellers.',
                rating: 5
              },
              {
                name: 'Emma Davis',
                role: 'Fashion Lover',
                content: 'Best shopping experience ever! The live shows make it so much more fun.',
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-foreground mb-4 italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary" />
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Ready to Experience Live Shopping?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of shoppers discovering amazing deals every day
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-semibold px-12 h-16 text-lg group" data-testid="button-cta-final">
              Start Shopping Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
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
