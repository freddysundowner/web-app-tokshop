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
  Award,
  CheckCircle,
  Eye,
  DollarSign,
  MessageCircle,
  Heart,
  Gift,
  Package,
  Truck,
  Lock,
  ChevronRight,
  Bell,
  Target,
  Sparkles,
  BarChart3,
  Globe,
  Headphones
} from 'lucide-react';

export default function LandingPage7() {
  const { settings } = useSettings();

  const liveShows = [
    {
      title: 'Vintage Watch Auction',
      seller: 'TimepiecePro',
      viewers: '4.2K',
      image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500&h=300&fit=crop',
      category: 'Luxury'
    },
    {
      title: 'Sneaker Drop Live',
      seller: 'KicksDaily',
      viewers: '12.8K',
      image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500&h=300&fit=crop',
      category: 'Fashion'
    },
    {
      title: 'Electronics Flash Sale',
      seller: 'TechDeals247',
      viewers: '6.5K',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&h=300&fit=crop',
      category: 'Tech'
    }
  ];

  const features = [
    {
      icon: Video,
      title: 'Live Streaming',
      stat: '1000+',
      label: 'Daily Shows',
      description: 'Watch sellers showcase products in real-time with HD streaming quality'
    },
    {
      icon: Users,
      title: 'Active Community',
      stat: '50K+',
      label: 'Members',
      description: 'Join a vibrant community of passionate buyers and sellers'
    },
    {
      icon: ShoppingBag,
      title: 'Products',
      stat: '100K+',
      label: 'Listed',
      description: 'Thousands of products across 250+ categories to explore'
    },
    {
      icon: Shield,
      title: 'Protected',
      stat: '100%',
      label: 'Secure',
      description: 'Every purchase backed by our buyer protection guarantee'
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Instant Deals',
      description: 'Flash sales and limited-time offers you can\'t miss. Get notified when your favorite items go on sale.'
    },
    {
      icon: Shield,
      title: 'Buyer Protection',
      description: 'Every purchase backed by our guarantee. Full refund policy and hassle-free dispute resolution.'
    },
    {
      icon: Award,
      title: 'Verified Sellers',
      description: 'Shop with confidence from trusted, verified sellers. Detailed profiles and transaction history.'
    },
    {
      icon: DollarSign,
      title: 'Best Prices',
      description: 'Competitive pricing and exclusive member deals. Save up to 70% on select items.'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Ask questions in real-time during shows. Get instant answers from sellers and the community.'
    },
    {
      icon: Truck,
      title: 'Fast Shipping',
      description: 'Most items ship within 24 hours. Track your order every step of the way.'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Create Free Account',
      description: 'Sign up in seconds and set your shopping preferences. No credit card required.',
      icon: Users
    },
    {
      number: '02',
      title: 'Browse Live Shows',
      description: 'Explore hundreds of live shows across all categories. Filter by interests and get personalized recommendations.',
      icon: Video
    },
    {
      number: '03',
      title: 'Shop & Interact',
      description: 'Watch products in action, ask questions, and make purchases in real-time. Participate in auctions and win exclusive items.',
      icon: ShoppingBag
    },
    {
      number: '04',
      title: 'Enjoy & Share',
      description: 'Receive your purchases quickly with tracking. Share your finds with friends and earn rewards.',
      icon: Gift
    }
  ];

  const whyUs = [
    {
      icon: Bell,
      title: 'Smart Alerts',
      points: [
        'Get notified when sellers go live',
        'Price drop notifications',
        'Auction ending reminders',
        'Personalized recommendations'
      ]
    },
    {
      icon: Lock,
      title: 'Security First',
      points: [
        'Bank-level encryption',
        'Verified seller program',
        'Secure payment processing',
        'Fraud protection'
      ]
    },
    {
      icon: Target,
      title: 'Smart Shopping',
      points: [
        'AI-powered recommendations',
        'Price history tracking',
        'Wishlist management',
        'Compare similar items'
      ]
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      points: [
        'Live chat support',
        'Email assistance',
        'Help center resources',
        'Community forums'
      ]
    }
  ];

  const stats = [
    { value: '$2M+', label: 'Saved by Users', sublabel: 'In deals and discounts' },
    { value: '15K+', label: 'Live Shows Weekly', sublabel: 'New shows every day' },
    { value: '4.9★', label: 'Average Rating', sublabel: 'From verified buyers' },
    { value: '98%', label: 'Satisfaction Rate', sublabel: 'Happy customers' }
  ];

  const testimonials = [
    {
      name: 'Rachel Kim',
      role: 'Power Shopper',
      content: 'I\'ve saved thousands using this platform. The live auctions are so much fun and I love being able to see products up close before buying.',
      rating: 5,
      purchases: '142 items'
    },
    {
      name: 'Daniel Brown',
      role: 'Sneaker Enthusiast',
      content: 'Finally found authentic limited edition sneakers at reasonable prices. The seller verification process is excellent.',
      rating: 5,
      purchases: '67 items'
    },
    {
      name: 'Sophie Taylor',
      role: 'Home Decorator',
      content: 'The live shows make shopping so much more enjoyable. I discovered unique pieces I would never find elsewhere.',
      rating: 5,
      purchases: '89 items'
    }
  ];

  const faqs = [
    {
      question: 'How does live shopping work?',
      answer: 'Sellers host live video shows where they showcase products in real-time. You can watch, ask questions via chat, and make purchases instantly. Some shows feature auctions where you can bid on items.'
    },
    {
      question: 'Is there a membership fee?',
      answer: 'No! Joining and browsing is completely free. You only pay when you make a purchase. There are no hidden fees or monthly subscriptions required.'
    },
    {
      question: 'What if I don\'t like what I receive?',
      answer: 'We offer a 30-day return policy on most items. If you receive something that doesn\'t match the description or is damaged, we provide full refunds through our buyer protection program.'
    },
    {
      question: 'How do I know sellers are trustworthy?',
      answer: 'All sellers go through a verification process including identity verification and background checks. You can view seller ratings, reviews, and transaction history before making a purchase.'
    },
    {
      question: 'Can I sell on this platform?',
      answer: 'Yes! Anyone can apply to become a seller. You\'ll need to complete our verification process and agree to our seller terms. Once approved, you can start hosting live shows immediately.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and digital wallets. All transactions are secured with bank-level encryption and fraud protection.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Immersive Video Hero */}
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&h=1080&fit=crop"
            alt="Live shopping"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>

        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <Badge className="mb-8 px-5 py-2.5 bg-white/10 backdrop-blur-md text-white border-white/20" data-testid="badge-live">
                <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse mr-2" />
                12.5K watching now
              </Badge>
              
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white leading-[1.05] mb-8">
                Live Shopping
                <br />
                Reimagined
              </h1>
              
              <p className="text-2xl text-white/90 mb-12 max-w-2xl leading-relaxed">
                Experience the thrill of live auctions, exclusive drops, and real-time shopping like never before. Join thousands discovering incredible deals every day.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button size="lg" className="bg-white text-black hover:bg-white/90 px-12 h-16 text-lg font-bold group w-full sm:w-auto" data-testid="button-start">
                    Start Shopping
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="px-12 h-16 text-lg font-bold border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm w-full sm:w-auto" data-testid="button-watch">
                  <Play className="mr-2 h-6 w-6" />
                  Watch Shows
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-0 right-0">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-2">
                    <feature.icon className="h-5 w-5 text-white" />
                    <span className="text-white/80 text-sm font-medium">{feature.title}</span>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">{feature.stat}</div>
                  <div className="text-sm text-white/70">{feature.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live Shows Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-4">
                Trending Live Shows
              </h2>
              <p className="text-xl text-muted-foreground">
                Join thousands watching right now
              </p>
            </div>
            <Link href="/login">
              <Button variant="outline" className="hidden md:flex border-2" data-testid="button-view-all">
                View All
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {liveShows.map((show, index) => (
              <Card key={index} className="group overflow-hidden hover-elevate border-2 cursor-pointer">
                <CardContent className="p-0">
                  <div className="relative aspect-video">
                    <img src={show.image} alt={show.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <Badge className="absolute top-3 left-3 bg-red-500 text-white border-0 px-3 py-1">
                      <span className="h-2 w-2 bg-white rounded-full animate-pulse mr-2" />
                      LIVE
                    </Badge>

                    <Badge className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white border-0 px-3 py-1">
                      {show.category}
                    </Badge>

                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-lg mb-1">{show.title}</h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/80">by {show.seller}</span>
                        <div className="flex items-center gap-1 text-white/80">
                          <Eye className="h-4 w-4" />
                          <span>{show.viewers}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-20 border-y border-border bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-black text-foreground mb-2">{stat.value}</div>
                <div className="text-sm font-semibold text-foreground mb-1">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-8">
                Why Shoppers Love Us
              </h2>
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-4 p-6 rounded-xl hover-elevate bg-card border-2">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <benefit.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-border">
                <img
                  src="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&h=800&fit=crop"
                  alt="Shopping experience"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-card border-2 rounded-2xl p-6 shadow-xl max-w-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex -space-x-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-card" />
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-card" />
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 border-2 border-card" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">50K+ Active</div>
                    <div className="text-xs text-muted-foreground">Join the community</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
              </div>
            </div>
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
              Start shopping in four simple steps
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="border-2 hover-elevate">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-black text-black">{step.number}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-foreground mb-3">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-6">
              More Than Just Shopping
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced features designed for smart shoppers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {whyUs.map((item, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    {item.title}
                  </h3>
                  <ul className="space-y-2">
                    {item.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-6">
              What Our Community Says
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real stories from real shoppers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-foreground mb-8 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="pt-6 border-t">
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground mb-2">{testimonial.role}</div>
                    <Badge variant="outline" className="text-xs">
                      {testimonial.purchases}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-8">
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-foreground text-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl sm:text-6xl font-black mb-8">
            Start Your Journey Today
          </h2>
          <p className="text-xl opacity-90 mb-12 max-w-2xl mx-auto">
            Join thousands of shoppers discovering incredible deals every day. Sign up now and get access to exclusive member-only shows.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90 px-16 h-16 text-lg font-bold group" data-testid="button-cta-final">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 bg-foreground rounded-full flex items-center justify-center p-1.5">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-background">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                </div>
                <span className="text-xl font-bold text-foreground">{settings.app_name}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Transforming online shopping through live streaming and community engagement.
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
              <h4 className="font-semibold text-foreground mb-4">Discover</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/marketplace" className="hover:text-foreground transition-colors">Live Shows</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Categories</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Top Sellers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">New Arrivals</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Get Started</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-foreground transition-colors">Sign Up</Link></li>
                <li><Link href="/seller-login" className="hover:text-foreground transition-colors">Become a Seller</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Mobile App</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Seller Guide</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <p className="text-center text-sm text-muted-foreground">
              © 2025 {settings.app_name}. All rights reserved. Shop live, shop smart.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
