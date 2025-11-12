import type { Express } from "express";
import { 
  landingContentSchema, 
  faqContentSchema,
  sectionBasedPageSchema,
  contactContentSchema,
  pageTypeEnum,
  type LandingContent,
  type FAQContent,
  type SectionBasedPage,
  type ContactContent,
  type PageType,
} from "../../shared/schema";
import { getAdminFirestore } from "../firebase-admin";

const COLLECTION_NAME = "app_content";

// Default content for each page type
const defaultLandingContent: LandingContent = {
  hero: {
    title: "The Live Shopping Marketplace",
    subtitle: "Shop, sell, and connect around the things you love. Join thousands of buyers and sellers in real-time.",
    primaryButtonText: "Get Started",
    primaryButtonLink: "/login",
    secondaryButtonText: "Watch Demo",
    heroImage: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop",
    heroImageAlt: "Live shopping experience",
    liveViewers: "12.5K watching",
  },
  howItWorks: {
    title: "How It Works",
    subtitle: "Join live shows, bid on items you love, and connect with passionate sellers",
    steps: [
      {
        icon: "Play",
        title: "Watch Live Shows",
        description: "Browse live streams across 250+ categories and discover unique items from trusted sellers",
      },
      {
        icon: "Zap",
        title: "Bid & Buy",
        description: "Participate in fast-paced auctions, flash sales, and buy-it-now deals in real-time",
      },
      {
        icon: "Shield",
        title: "Safe & Secure",
        description: "Protected purchases with buyer protection and secure checkout for peace of mind",
      },
    ],
  },
  joinFun: {
    title: "Join In the Fun",
    subtitle: "Take part in fast-paced auctions, incredible flash sales, live show giveaways, and so much more.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
    imageAlt: "Auction excitement",
    features: [
      {
        icon: "Star",
        title: "Live Auctions",
        description: "Bid in real-time and win amazing deals on items you love",
      },
      {
        icon: "Star",
        title: "Flash Sales",
        description: "Lightning-fast deals with limited quantities at unbeatable prices",
      },
      {
        icon: "Star",
        title: "Giveaways",
        description: "Win free items during live shows from generous sellers",
      },
    ],
    buttonText: "Get Started",
    buttonLink: "/login",
  },
  categories: {
    title: "We've Got It All",
    subtitle: "Explore 250+ categories, including fashion, coins, sports & Pokémon cards, sneakers, and more.",
    items: [
      { name: "Fashion", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=500&fit=crop" },
      { name: "Collectibles", image: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=400&h=500&fit=crop" },
      { name: "Sports Cards", image: "https://images.unsplash.com/photo-1611916656173-875e4277bea6?w=400&h=500&fit=crop" },
      { name: "Sneakers", image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=500&fit=crop" },
      { name: "Electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=500&fit=crop" },
      { name: "Jewelry", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=500&fit=crop" },
    ],
    buttonText: "Explore All Categories",
    buttonLink: "/login",
  },
  brands: {
    title: "Find Incredible Deals on Name Brands",
    subtitle: "From the brands you love, to hard-to-find specialty products. There's a deal on whatever you're looking for.",
    items: [
      { name: "Nike" },
      { name: "Adidas" },
      { name: "Supreme" },
      { name: "Pokémon" },
    ],
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
    imageAlt: "Brand products",
    buttonText: "Start Shopping",
    buttonLink: "/login",
  },
  finalCTA: {
    title: "Ready to Start Shopping?",
    subtitle: "Join thousands of buyers and sellers discovering amazing deals every day",
    buttonText: "Get Started Now",
    buttonLink: "/login",
  },
  footer: {
    copyrightText: "2025",
  },
};

const defaultFAQContent: FAQContent = {
  title: "Frequently Asked Questions",
  subtitle: "Find answers to common questions about our platform",
  faqs: [
    {
      question: "How do I create an account?",
      answer: "Click on the 'Get Started' button and follow the registration process. You can sign up using your email or social media accounts.",
    },
    {
      question: "Is it safe to shop here?",
      answer: "Yes! We provide buyer protection on all purchases and use secure payment processing to ensure your transactions are safe.",
    },
    {
      question: "How do live auctions work?",
      answer: "Join a live show, browse the items being showcased, and place your bids in real-time. The highest bidder wins when the auction closes.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and digital payment methods through our secure payment processor.",
    },
  ],
};

const defaultAboutContent: SectionBasedPage = {
  title: "About Us",
  subtitle: "Learn more about our mission and what makes us different",
  sections: [
    {
      title: "Our Story",
      content: "We started with a simple mission: to create the most engaging and trustworthy live shopping marketplace. Today, thousands of buyers and sellers connect on our platform every day to discover amazing deals and build lasting relationships.",
    },
    {
      title: "Our Mission",
      content: "We believe shopping should be fun, social, and exciting. That's why we've built a platform that combines the thrill of live auctions with the convenience of online shopping.",
    },
    {
      title: "Why Choose Us",
      content: "With buyer protection, secure payments, and a vibrant community of sellers, we're committed to providing the best live shopping experience possible.",
    },
  ],
};

const defaultPrivacyContent: SectionBasedPage = {
  title: "Privacy Policy",
  subtitle: "How we collect, use, and protect your information",
  sections: [
    {
      title: "Information We Collect",
      content: "We collect information you provide directly to us, such as when you create an account, make a purchase, or contact our support team.",
    },
    {
      title: "How We Use Your Information",
      content: "We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.",
    },
    {
      title: "Data Security",
      content: "We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure.",
    },
    {
      title: "Your Rights",
      content: "You have the right to access, update, or delete your personal information. Contact us if you'd like to exercise these rights.",
    },
  ],
};

const defaultTermsContent: SectionBasedPage = {
  title: "Terms of Service",
  subtitle: "Rules and guidelines for using our platform",
  sections: [
    {
      title: "Acceptance of Terms",
      content: "By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.",
    },
    {
      title: "User Accounts",
      content: "You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.",
    },
    {
      title: "Prohibited Activities",
      content: "You may not use our platform for any illegal purposes or to violate any laws. This includes but is not limited to fraud, harassment, or posting harmful content.",
    },
    {
      title: "Termination",
      content: "We reserve the right to terminate or suspend your account at any time for violations of these terms or for any other reason we deem necessary.",
    },
  ],
};

const defaultContactContent: ContactContent = {
  title: "Contact Us",
  subtitle: "Get in touch with our team",
  description: "Have a question or need help? We're here for you. Reach out and we'll respond as soon as possible.",
  contactInfo: {
    email: "support@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street, City, State 12345",
  },
  showContactForm: true,
  sections: [
    {
      title: "Customer Support",
      content: "Our support team is available Monday through Friday, 9am to 5pm EST. We aim to respond to all inquiries within 24 hours.",
    },
  ],
};

// Page configuration dispatcher
const pageConfig = {
  landing: {
    schema: landingContentSchema,
    defaultContent: defaultLandingContent,
    docId: "landing",
  },
  faq: {
    schema: faqContentSchema,
    defaultContent: defaultFAQContent,
    docId: "faq",
  },
  about: {
    schema: sectionBasedPageSchema,
    defaultContent: defaultAboutContent,
    docId: "about",
  },
  privacy: {
    schema: sectionBasedPageSchema,
    defaultContent: defaultPrivacyContent,
    docId: "privacy",
  },
  terms: {
    schema: sectionBasedPageSchema,
    defaultContent: defaultTermsContent,
    docId: "terms",
  },
  contact: {
    schema: contactContentSchema,
    defaultContent: defaultContactContent,
    docId: "contact",
  },
} as const;

export function registerContentRoutes(app: Express) {
  // Get page content (public endpoint) - /api/content/:pageType
  app.get("/api/content/:pageType", async (req, res) => {
    try {
      const pageTypeValidation = pageTypeEnum.safeParse(req.params.pageType);
      
      if (!pageTypeValidation.success) {
        return res.status(404).json({
          success: false,
          message: "Page not found",
        });
      }

      const pageType = pageTypeValidation.data as PageType;
      const config = pageConfig[pageType];

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore timeout')), 5000)
      );

      const fetchPromise = (async () => {
        const db = await getAdminFirestore();
        const docRef = db.collection(COLLECTION_NAME).doc(config.docId);
        const doc = await docRef.get();

        if (doc.exists) {
          const data = doc.data();
          // Validate data from Firestore before returning
          const validation = config.schema.safeParse(data);
          if (validation.success) {
            return validation.data;
          } else {
            console.error(`Invalid ${pageType} content in Firestore, using defaults:`, validation.error);
            return null;
          }
        }
        return null;
      })();

      const data = await Promise.race([fetchPromise, timeoutPromise]);

      if (data) {
        res.json({
          success: true,
          data,
        });
      } else {
        // Return default content if no custom content is set or validation failed
        res.json({
          success: true,
          data: config.defaultContent,
        });
      }
    } catch (error: any) {
      console.error(`Error fetching ${req.params.pageType} content:`, error.message || error);
      // Return default content on error
      const pageType = req.params.pageType as PageType;
      const config = pageConfig[pageType];
      res.json({
        success: true,
        data: config?.defaultContent || {},
      });
    }
  });

  // Update page content (admin endpoint) - /api/admin/content/:pageType
  app.put("/api/admin/content/:pageType", async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!(req.session as any)?.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!(req.session as any).user.admin) {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      const pageTypeValidation = pageTypeEnum.safeParse(req.params.pageType);
      
      if (!pageTypeValidation.success) {
        return res.status(404).json({
          success: false,
          message: "Page not found",
        });
      }

      const pageType = pageTypeValidation.data as PageType;
      const config = pageConfig[pageType];

      // Validate the request body against the schema
      const validationResult = config.schema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${pageType} content data`,
          errors: validationResult.error.errors,
        });
      }

      // Update the content in Firestore with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore timeout')), 5000)
      );

      const updatePromise = (async () => {
        const db = await getAdminFirestore();
        const docRef = db.collection(COLLECTION_NAME).doc(config.docId);
        await docRef.set(validationResult.data);
      })();

      await Promise.race([updatePromise, timeoutPromise]);

      res.json({
        success: true,
        message: `${pageType.charAt(0).toUpperCase() + pageType.slice(1)} content updated successfully`,
        data: validationResult.data,
      });
    } catch (error: any) {
      console.error(`Error updating ${req.params.pageType} content:`, error.message || error);
      res.status(500).json({
        success: false,
        message: `Failed to update ${req.params.pageType} content. Please try again.`,
        error: error.message,
      });
    }
  });

  // Reset page content to defaults (admin endpoint) - /api/admin/content/:pageType/reset
  app.post("/api/admin/content/:pageType/reset", async (req, res) => {
    try {
      // Check if user is authenticated and is an admin
      if (!(req.session as any)?.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!(req.session as any).user.admin) {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      const pageTypeValidation = pageTypeEnum.safeParse(req.params.pageType);
      
      if (!pageTypeValidation.success) {
        return res.status(404).json({
          success: false,
          message: "Page not found",
        });
      }

      const pageType = pageTypeValidation.data as PageType;
      const config = pageConfig[pageType];

      // Reset to default content in Firestore with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore timeout')), 5000)
      );

      const resetPromise = (async () => {
        const db = await getAdminFirestore();
        const docRef = db.collection(COLLECTION_NAME).doc(config.docId);
        await docRef.set(config.defaultContent);
      })();

      await Promise.race([resetPromise, timeoutPromise]);

      res.json({
        success: true,
        message: `${pageType.charAt(0).toUpperCase() + pageType.slice(1)} content reset to defaults successfully`,
        data: config.defaultContent,
      });
    } catch (error: any) {
      console.error(`Error resetting ${req.params.pageType} content:`, error.message || error);
      res.status(500).json({
        success: false,
        message: `Failed to reset ${req.params.pageType} content. Please try again.`,
        error: error.message,
      });
    }
  });
}
