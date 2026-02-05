import { NavBar } from "@/app/components/nav-bar";
import { Hero } from "@/app/components/sections/hero";
import { ProductPipeline } from "@/app/components/sections/product-pipeline";
import { ProductProfiles } from "@/app/components/sections/product-profiles";
import { Stats } from "@/app/components/sections/stats";
import { LinkedInSection } from "@/app/components/sections/linkedin-section";
import { FeaturesGrid } from "@/app/components/sections/features-grid";
import { Testimonial } from "@/app/components/sections/testimonial";
import { FAQ } from "@/app/components/sections/faq";
import { CTASection } from "@/app/components/sections/cta-section";
import { Footer } from "@/app/components/sections/footer";

export default function Home() {
  return (
    <>
      <NavBar />
      <main>
        <Hero />
        <ProductPipeline />
        <ProductProfiles />
        <Stats />
        <LinkedInSection />
        <FeaturesGrid />
        <Testimonial />
        <FAQ />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}
