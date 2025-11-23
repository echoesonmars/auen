import HeroSection from "./components/HeroSection";
import CategoriesSection from "./components/CategoriesSection";
import FeaturesSection from "./components/FeaturesSection";
import FAQSection from "./components/FAQSection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="relative bg-color-lightest">
      <HeroSection />
      <CategoriesSection />
      <FeaturesSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
