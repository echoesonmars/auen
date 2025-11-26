"use client";

import { useState, useEffect } from "react";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";
import Link from "next/link";
import { useMetadata } from "@/app/hooks/useMetadata";

interface Location {
  _id: string;
  name: string;
  type: "city" | "category";
  icon?: string;
  adsCount: number;
}

export default function LocationsPage() {
  const [cities, setCities] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useMetadata(
    "Все места | Auen",
    "Найдите студии, репетиционные базы и музыкальные площадки в вашем городе. Студии звукозаписи, репетиционные базы, DJ-студии и концертные площадки в Казахстане."
  );

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      
      // Загружаем города
      const citiesResponse = await fetch("/api/locations?type=city", {
        cache: 'no-store'
      });
      const citiesResult = await citiesResponse.json();
      if (citiesResult.success) {
        setCities(citiesResult.data || []);
      }

      // Загружаем категории
      const categoriesResponse = await fetch("/api/locations?type=category", {
        cache: 'no-store'
      });
      const categoriesResult = await categoriesResponse.json();
      if (categoriesResult.success) {
        setCategories(categoriesResult.data || []);
      }
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Иконки для категорий по умолчанию
  const getCategoryIcon = (name: string) => {
    const iconMap: Record<string, string> = {
      "Инструменты": "🎸",
      "Студии": "🎙️",
      "DJ оборудование": "🎧",
      "Клавишные": "🎹",
      "Микрофоны": "🎤",
      "Аудио": "🔊",
    };
    return iconMap[name] || "🎵";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-color-lightest flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-color-medium">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-color-lightest">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-20">
        <BlurFade inView={true} delay={0.1} direction="up">
          <TextAnimate
            as="h1"
            animation="slideUp"
            by="word"
            startOnView={true}
            delay={0.1}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-color-dark mb-4"
          >
            Все места
          </TextAnimate>
          <TextAnimate
            as="p"
            animation="slideUp"
            by="word"
            startOnView={true}
            delay={0.2}
            className="text-lg sm:text-xl text-color-medium mb-8 sm:mb-12"
          >
            Найдите студии, репетиционные базы и музыкальные площадки в вашем городе
          </TextAnimate>
        </BlurFade>

        {/* Cities */}
        <BlurFade inView={true} delay={0.3} direction="up">
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-color-dark mb-6">
              Города
            </h2>
            {cities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {cities.map((city, index) => (
                  <BlurFade key={city._id || city.name} inView={true} delay={0.05 * index} direction="up">
                    <Link
                      href={`/search?location=${encodeURIComponent(city.name)}`}
                      className="bg-white rounded-xl border border-color-light p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] text-center"
                    >
                      <div className="text-4xl sm:text-5xl mb-3">{city.icon || "📍"}</div>
                      <h3 className="font-bold text-color-dark text-sm sm:text-base mb-1">
                        {city.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-color-medium">
                        {city.adsCount} мест
                      </p>
                    </Link>
                  </BlurFade>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-color-medium">Пока нет городов</p>
              </div>
            )}
          </div>
        </BlurFade>

        {/* Categories */}
        <BlurFade inView={true} delay={0.4} direction="up">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-color-dark mb-6">
              Категории
            </h2>
            {categories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {categories.map((category, index) => (
                  <BlurFade key={category._id || category.name} inView={true} delay={0.05 * index} direction="up">
                    <Link
                      href={`/search?category=${encodeURIComponent(category.name)}`}
                      className="bg-white rounded-xl border border-color-light p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center gap-4"
                    >
                      <div className="text-4xl flex-shrink-0">{category.icon || getCategoryIcon(category.name)}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-color-dark text-lg mb-1">
                          {category.name}
                        </h3>
                        <p className="text-sm text-color-medium">
                          {category.adsCount} мест
                        </p>
                      </div>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-color-medium flex-shrink-0"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </BlurFade>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-color-medium">Пока нет категорий</p>
              </div>
            )}
          </div>
        </BlurFade>
      </div>
    </div>
  );
}

