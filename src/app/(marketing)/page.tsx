export const dynamic = "force-dynamic";

import { Navbar } from "@/components/lp/Navbar";
import { HeroSection } from "@/components/lp/HeroSection";
import { ProblemSection } from "@/components/lp/ProblemSection";
import { FeaturesSection } from "@/components/lp/FeaturesSection";
import { SocialProofSection } from "@/components/lp/SocialProofSection";
import { PricingSection } from "@/components/lp/PricingSection";
import { FaqSection } from "@/components/lp/FaqSection";
import { CtaSection } from "@/components/lp/CtaSection";
import { Footer } from "@/components/lp/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <SocialProofSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
