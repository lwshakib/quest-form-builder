/**
 * The Landing Page (Root Page) of the application.
 * It serves as the primary marketing page, showcasing features, pricing, and FAQs 
 * to anonymous and authenticated users before they enter the dashboard.
 */

import CTASection from "@/components/cta-section";
import FeaturesSection from "@/components/features-section";
import FaqSection from "@/components/faq-section";
import HowItWorksSection from "@/components/how-it-works-section";
import FooterSection from "@/components/footer";
import HeroSection from "@/components/hero-section";
import SimplePricing from "@/components/pricing";

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      {/* Primary attention-grabbing section with CTA */}
      <HeroSection />
      
      {/* Detailed breakdown of application capabilities */}
      <FeaturesSection />
      
      {/* Step-by-step guide on using the platform */}
      <HowItWorksSection />
      
      {/* Subscription plans and pricing tiers */}
      <SimplePricing />
      
      {/* Common questions and support information */}
      <FaqSection />
      
      {/* Final nudge for users to sign up or get started */}
      <CTASection />
      
      {/* Site-wide footer with navigation and social links */}
      <FooterSection />
    </div>
  );
}
