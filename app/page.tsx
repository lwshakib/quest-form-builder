import FooterSection from "@/components/footer";
import HeroSection from "@/components/hero-section";
import SimplePricing from "@/components/pricing";

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <HeroSection />
      <SimplePricing />
      <FooterSection />
    </div>
  );
}
