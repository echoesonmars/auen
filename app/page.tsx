"use client";

import HeroSection from "./components/HeroSection";
import { useMetadata } from "./hooks/useMetadata";

export default function Home() {
  useMetadata(
    "Auen - Платформа для аренды музыкального оборудования",
    "Арендуйте и сдавайте в аренду музыкальное оборудование, студии звукозаписи, инструменты и DJ-оборудование в Казахстане. Надежная платформа для музыкантов."
  );

  return (
    <div className="relative bg-color-lightest min-h-screen">
      <HeroSection />
    </div>
  );
}
