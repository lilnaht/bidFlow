import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { BenefitsSection } from "@/components/home/BenefitsSection";
import { PortfolioPreviewSection } from "@/components/home/PortfolioPreviewSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { FAQSection } from "@/components/home/FAQSection";
import { CTASection } from "@/components/home/CTASection";

const Index = () => {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <BenefitsSection />
      <PortfolioPreviewSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </>
  );
};

export default Index;
