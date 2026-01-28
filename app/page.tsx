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
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SimplePricing />
      <FaqSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
