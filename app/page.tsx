"use client";

import { useEffect } from "react";
import HeroSection from "./components/HeroSection";

export default function Home() {
  useEffect(() => {
    // Отключаем скролл на главной странице для больших экранов
    const disableScroll = () => {
      if (window.innerWidth >= 1024) {
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }
    };

    disableScroll();
    window.addEventListener("resize", disableScroll);

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.removeEventListener("resize", disableScroll);
    };
  }, []);

  return (
    <div className="relative bg-color-lightest h-screen overflow-hidden">
      <HeroSection />
    </div>
  );
}
