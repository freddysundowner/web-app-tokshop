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
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  MessageCircle,
  DollarSign,
  Globe,
  Smartphone,
  Heart,
  Gift,
  Package,
  Truck,
  CreditCard,
  BarChart3,
  Target,
  Headphones
} from 'lucide-react';

export default function LandingPage5() {
  const { settings } = useSettings();

  const features = [
    {
      icon: Video,
      title: 'Live Shopping Events',
      description: 'Watch real-time product showcases and interact with sellers instantly. Experience products before you buy through HD streaming.'
    },
    {
      icon: Zap,
      title: 'Flash Deals & Auctions',
      description: 'Lightning-fast auctions and flash sales with exclusive pricing. Get alerts for your favorite categories and never miss a deal.'
    },
    {
      icon: Shield,
      title: 'Buyer Protection',
      description: 'Protected payments and buyer guarantee on every purchase. Full refund policy and dispute resolution included.'
    },
    {
      icon: Award,
      title: 'Verified Sellers',
      description: 'Shop from verified sellers with high ratings and quality products. Detailed seller profiles and transaction history.'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Ask questions in real-time during live shows. Get instant answers from sellers and connect with the community.'
    },
    {
      icon: Gift,
      title: 'Member Rewards',
      description: 'Earn points with every purchase. Unlock exclusive deals, early access to shows, and special perks.'
    }
  ];

  const categories = [
    { name: 'Fashion & Accessories', count: '12.5K', icon: '👗' },
    { name: 'Electronics & Tech', count: '8.2K', icon: '📱' },
    { name: 'Home & Living', count: '15.3K', icon: '🏠' },
    { name: 'Beauty & Wellness', count: '9.7K', icon: '💄' },
    { name: 'Sports & Outdoors', count: '6.4K', icon: '⚽' },
    { name: 'Collectibles & Art', count: '4.8K', icon: '🎨' }
  ];

  const testimonials = [
    {
      name: 'Michael Torres',
      role: 'Sneaker Collector',
      content: 'The live shopping experience is incredible. I found rare limited editions I\'ve been searching for months. The authentication process gives me complete confidence.',
      rating: 5,
      avatar: 'MT',
      purchases: '47 items'
    },
    {
      name: 'Lisa Anderson',
      role: 'Fashion Enthusiast',
      content: 'Best platform for authentic designer items. The seller verification process is top-notch and I love being able to see products in detail during live shows.',
      rating: 5,
      avatar: 'LA',
      purchases: '63 items'
    },
    {
      name: 'James Chen',
      role: 'Tech Buyer',
      content: 'Love the interactive bidding and instant deals. Scored amazing discounts on electronics. The community is great and sellers are very responsive.',
      rating: 5,
      avatar: 'JC',
      purchases: '29 items'
    }
  ];

  const faqs = [
    {
      question: 'How does live shopping work?',
      answer: 'Sellers host live video shows where they showcase products in real-time. You can watch, ask questions, and make purchases instantly during the show or bid on auction items.'
    },
    {
      question: 'Is my purchase protected?',
      answer: 'Yes! Every purchase is covered by our buyer protection program. If you receive an item that doesn\'t match the description or is damaged, we offer full refunds within our return window.'
    },
    {
      question: 'How do I become a seller?',
      answer: 'Anyone can apply to become a seller. You\'ll need to verify your identity, provide business information, and go through our approval process. Once approved, you can start hosting live shows.'
    },
    {
      question: 'Are there any fees?',
      answer: 'Joining and browsing is completely free. Sellers pay a small commission on sales. There are no hidden fees for buyers - what you see is what you pay.'
    },
    {
      question: 'Can I return items?',
      answer: 'Yes, most items can be returned within 30 days of delivery if they\'re in original condition. Some categories have specific return policies which are clearly stated.'
    },
    {
      question: 'How do auctions work?',
      answer: 'During live shows, sellers can run auctions for specific items. Place your bid in real-time and compete with other viewers. The highest bidder when the timer ends wins the item.'
    }
  ];

  const stats = [
    { icon: Users, value: '50,000+', label: 'Active Members', sublabel: 'Join our growing community' },
    { icon: Video, value: '1,000+', label: 'Daily Shows', sublabel: 'Live streaming 24/7' },
    { icon: Package, value: '100K+', label: 'Products Listed', sublabel: 'Across 250+ categories' },
    { icon: Star, value: '4.9/5', label: 'Average Rating', sublabel: 'From verified buyers' }
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: 'Best Prices Guaranteed',
      description: 'Our competitive bidding system and flash sales ensure you always get the best deal available.'
    },
    {
      icon: Globe,
      title: 'Shop Anywhere',
      description: 'Access live shows from any device. Desktop, mobile, or tablet - shop on your terms.'
    },
    {
      icon: Truck,
      title: 'Fast Shipping',
      description: 'Most items ship within 24 hours. Track your order every step of the way.'
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Multiple payment options with bank-level encryption and fraud protection.'
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Our support team is always available to help with any questions or issues.'
    },
    {
      icon: Target,
      title: 'Personalized Feed',
      description: 'Smart recommendations based on your interests and browsing history.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-8 px-6 py-2 text-sm font-medium" variant="outline" data-testid="badge-platform">
              <Sparkles className="h-4 w-4 mr-2" />
              Premium Live Shopping Platform
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-8 leading-[1.1]">
              Discover, Shop,
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Win Together
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Experience the future of e-commerce with live streaming, real-time auctions, and a vibrant community of passionate buyers and sellers worldwide.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/login">
                <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 px-8 h-14 text-base font-medium group" data-testid="button-start">
                  Start Shopping Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-8 h-14 text-base font-medium border-2" data-testid="button-demo">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                </div>
                <span>Free to join</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                </div>
                <span>No hidden fees</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                </div>
                <span>Buyer protection</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <div className="max-w-5xl mx-auto">
            <Card className="overflow-hidden border-2 shadow-2xl">
              <CardContent className="p-0">
                <div className="aspect-[21/9] relative">
                  <img
                    src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&h=600&fit=crop"
                    alt="Live shopping platform"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  <div className="absolute top-6 left-6">
                    <Badge className="bg-red-500 text-white border-0 px-4 py-2">
                      <span className="h-2 w-2 bg-white rounded-full animate-pulse mr-2" />
                      LIVE NOW
                    </Badge>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                    <div>
                      <div className="text-white/90 text-sm mb-1">Exclusive Drop</div>
                      <div className="text-white font-bold text-xl">Premium Collection Launch</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 text-white text-sm font-medium">
                      <Users className="h-4 w-4 inline mr-1" />
                      15.2K watching
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-y border-border bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-6xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                  <stat.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="text-4xl sm:text-5xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-sm font-semibold text-foreground mb-1">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Everything You Need to Shop Smart
            </h2>
            <p className="text-xl text-muted-foreground">
              A complete platform designed for the modern shopper
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover-elevate">
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted mb-6">
                    <feature.icon className="h-7 w-7 text-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Shop by Category
            </h2>
            <p className="text-xl text-muted-foreground">
              Explore thousands of products across popular categories
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {categories.map((category, index) => (
              <Card key={index} className="hover-elevate cursor-pointer border-2">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{category.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {category.count} products
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Why Shop With Us?
            </h2>
            <p className="text-xl text-muted-foreground">
              We're committed to providing the best shopping experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4 p-6 rounded-xl hover-elevate bg-card border">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-muted-foreground">
              Join our community of happy shoppers
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
                  <div className="flex items-center gap-4 pt-6 border-t">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-foreground font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
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

      {/* FAQ Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about shopping with us
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-8">
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">Q</span>
                    </div>
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed pl-9">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-8">
              Ready to Start Shopping?
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Join thousands of shoppers discovering incredible deals every day. Sign up now and get exclusive access to member-only shows.
            </p>
            <Link href="/login">
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 px-12 h-16 text-lg font-medium group" data-testid="button-cta">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
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
                The premier live shopping platform connecting buyers and sellers worldwide. Shop smarter, shop live.
              </p>
              <div className="flex items-center gap-4">
                <Button size="icon" variant="outline" className="h-9 w-9">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </Button>
                <Button size="icon" variant="outline" className="h-9 w-9">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </Button>
                <Button size="icon" variant="outline" className="h-9 w-9">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Platform</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/marketplace" className="hover:text-foreground transition-colors">Browse Shows</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Sign Up</Link></li>
                <li><Link href="/seller-login" className="hover:text-foreground transition-colors">Become a Seller</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Mobile App</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/faq" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Buyer Protection</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Shipping Info</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Community Guidelines</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <p className="text-center text-sm text-muted-foreground">
              © 2025 {settings.app_name}. All rights reserved. Built for the future of shopping.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
