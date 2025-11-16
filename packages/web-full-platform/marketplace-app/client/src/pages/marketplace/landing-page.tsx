import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/lib/settings-context';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, Play, Star, TrendingUp, Zap, Shield } from 'lucide-react';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Icon mapping for dynamic icon selection
const iconMap = {
  Play,
  Zap,
  Shield,
  Star,
  TrendingUp,
};

export default function LandingPage() {
  const { settings } = useSettings();
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch landing page content
  const { data: content, isLoading } = useQuery({
    queryKey: ['/api/content/landing'],
  });

  // Redirect authenticated users to appropriate page
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.admin) {
        setLocation('/admin');
      } else {
        setLocation('/marketplace');
      }
    }
  }, [isAuthenticated, user, setLocation]);

  // Show loading state while fetching content
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Validate content structure - check if it has actual content, not just empty object
  const hasValidContent = content?.data && 
    content.data.hero && 
    content.data.hero.title &&
    content.data.howItWorks &&
    content.data.joinFun &&
    content.data.categories &&
    content.data.brands &&
    content.data.finalCTA;

  if (!hasValidContent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-bold mb-4">Content Not Available</h2>
          <p className="text-muted-foreground mb-6">
            The landing page content hasn't been configured yet. Please contact the administrator to set up the page content.
          </p>
          <Link href="/marketplace">
            <Button>Go to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  const landingContent = content.data;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                {landingContent.hero.title}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                {landingContent.hero.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href={landingContent.hero.primaryButtonLink}>
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-semibold rounded-full text-lg px-8 h-12 w-full sm:w-auto" data-testid="button-download-hero">
                    {landingContent.hero.primaryButtonText} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="rounded-full text-lg px-8 h-12 w-full sm:w-auto" data-testid="button-watch-demo">
                  <Play className="mr-2 h-5 w-5" /> {landingContent.hero.secondaryButtonText}
                </Button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={landingContent.hero.heroImage}
                  alt={landingContent.hero.heroImageAlt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-3 bg-live/90 backdrop-blur-sm rounded-lg px-4 py-3 w-fit">
                    <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                    <span className="text-white font-bold text-sm">Live Now - {landingContent.hero.liveViewers}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {landingContent.howItWorks.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {landingContent.howItWorks.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {landingContent.howItWorks.steps.map((step, index) => {
              const Icon = iconMap[step.icon];
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 mb-6">
                    <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Join In the Fun Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                <img
                  src={landingContent.joinFun.image}
                  alt={landingContent.joinFun.imageAlt}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                {landingContent.joinFun.title}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {landingContent.joinFun.subtitle}
              </p>
              <ul className="space-y-4 mb-8">
                {landingContent.joinFun.features.map((feature, index) => {
                  const Icon = iconMap[feature.icon];
                  return (
                    <li key={index} className="flex items-start gap-3">
                      <Icon className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Link href={landingContent.joinFun.buttonLink}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-semibold rounded-full text-lg px-8 h-12" data-testid="button-join-fun">
                  {landingContent.joinFun.buttonText} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {landingContent.categories.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {landingContent.categories.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {landingContent.categories.items.map((category, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-lg mb-3">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-center font-semibold text-foreground">{category.name}</h3>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href={landingContent.categories.buttonLink}>
              <Button size="lg" variant="outline" className="rounded-full text-lg px-8 h-12" data-testid="button-explore-categories">
                {landingContent.categories.buttonText} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section id="brands" className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                {landingContent.brands.title}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {landingContent.brands.subtitle}
              </p>
              <div className="grid grid-cols-2 gap-6 mb-8">
                {landingContent.brands.items.map((brand, index) => (
                  <div key={index} className="bg-card rounded-lg p-6 flex items-center justify-center h-24 hover-elevate">
                    <span className="text-xl font-bold text-foreground">{brand.name}</span>
                  </div>
                ))}
              </div>
              <Link href={landingContent.brands.buttonLink}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-semibold rounded-full text-lg px-8 h-12" data-testid="button-shop-brands">
                  {landingContent.brands.buttonText} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Image */}
            <div>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                <img
                  src={landingContent.brands.image}
                  alt={landingContent.brands.imageAlt}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {landingContent.finalCTA.title}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {landingContent.finalCTA.subtitle}
          </p>
          <Link href={landingContent.finalCTA.buttonLink}>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-semibold rounded-full text-lg px-8 h-12" data-testid="button-final-cta">
              {landingContent.finalCTA.buttonText} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-8">
            {/* Footer Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors" data-testid="link-privacy-policy">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:text-foreground transition-colors" data-testid="link-terms-of-service">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors" data-testid="link-contact">
                Contact
              </Link>
            </div>

            {/* Bottom */}
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
                © {landingContent.footer.copyrightText} {settings.app_name}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
