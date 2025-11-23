"use client";

import { useState, useEffect } from "react";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";
import Link from "next/link";

interface Ad {
  _id: string;
  title: string;
  category: string;
  price: string;
  location: string;
  images: string[];
  views: number;
  userId: {
    name: string;
  };
}

export default function PopularAdsSection() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const response = await fetch("/api/ads?limit=6");
      const result = await response.json();
      
      if (result.success) {
        setAds(result.data);
      }
    } catch (error) {
      console.error("Error loading ads:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      "Инструменты": "🎸",
      "Студии": "🎙️",
      "DJ оборудование": "🎧",
      "Клавишные": "🎹",
      "Микрофоны": "🎤",
      "Аудио": "🔊",
    };
    return icons[category] || "🎵";
  };

  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Показываем секцию раньше, чтобы уменьшить расстояние
    const heroHeight = 700;
    const categoriesHeight = 150;
    const threshold = heroHeight + categoriesHeight * 0.2;
    setIsVisible(scrollY > threshold);
  }, [scrollY]);

  return (
    <section 
      className={`pt-2 sm:pt-3 md:pt-4 pb-12 sm:pb-16 md:pb-20 bg-color-lightest relative z-20 rounded-t-2xl sm:rounded-t-3xl md:rounded-t-[2rem] lg:rounded-t-[3rem] -mt-1 transition-opacity duration-700 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <BlurFade inView={true} delay={0.1} direction="up">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <TextAnimate
              as="h2"
              animation="slideUp"
              by="word"
              startOnView={true}
              delay={0.1}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-color-dark"
            >
              Популярные объявления
            </TextAnimate>
            <Link
              href="/ads"
              className="text-color-medium hover:text-color-dark font-medium transition-colors text-sm sm:text-base"
            >
              Смотреть все →
            </Link>
          </div>
        </BlurFade>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-lg border border-color-light p-6 animate-pulse"
              >
                <div className="h-32 bg-color-light rounded-lg mb-4"></div>
                <div className="h-4 bg-color-light rounded mb-2"></div>
                <div className="h-4 bg-color-light rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : ads.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {ads.map((ad, index) => (
              <BlurFade
                key={ad._id}
                inView={true}
                delay={index * 0.1}
                direction="up"
              >
                <Link
                  href={`/ad/${ad._id}`}
                  className="bg-white rounded-xl shadow-lg border border-color-light p-6 hover:shadow-xl transition-all duration-200 flex flex-col h-full group"
                >
                  <div className="flex-1">
                    <div className="text-4xl sm:text-5xl mb-4 flex items-center justify-center h-24 bg-color-lightest rounded-lg group-hover:bg-color-light transition-colors">
                      {getCategoryIcon(ad.category)}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-color-dark mb-2 line-clamp-2 group-hover:text-color-medium transition-colors">
                      {ad.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-color-medium mb-3">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      <span>{ad.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl sm:text-2xl font-bold text-color-medium">
                        {ad.price}
                      </span>
                      <span className="text-xs text-color-medium">
                        {ad.views} просмотров
                      </span>
                    </div>
                  </div>
                </Link>
              </BlurFade>
            ))}
          </div>
        ) : (
          <BlurFade inView={true} delay={0.2} direction="up">
            <div className="text-center py-12">
              <p className="text-color-medium text-lg mb-4">
                Пока нет объявлений
              </p>
              <Link
                href="/create"
                className="inline-block bg-color-medium text-white px-6 py-3 rounded-lg font-semibold hover:bg-color-dark transition-colors"
              >
                Создать первое объявление
              </Link>
            </div>
          </BlurFade>
        )}
      </div>
    </section>
  );
}

