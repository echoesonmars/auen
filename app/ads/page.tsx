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
  createdAt: string;
}

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    "Инструменты",
    "Студии",
    "DJ оборудование",
    "Клавишные",
    "Микрофоны",
    "Аудио",
  ];

  const locations = [
    "Алматы",
    "Астана",
    "Шымкент",
    "Караганда",
    "Актобе",
    "Тараз",
  ];

  useEffect(() => {
    loadAds();
  }, [selectedCategory, selectedLocation, page]);

  const loadAds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedLocation) params.append("location", selectedLocation);
      params.append("page", page.toString());
      params.append("limit", "12");

      const response = await fetch(`/api/ads?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setAds(result.data);
        setTotalPages(result.pagination?.pages || 1);
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

  return (
    <div className="min-h-screen bg-color-lightest py-8 sm:py-12 md:py-20">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <BlurFade inView={true} delay={0.1} direction="up">
          <TextAnimate
            as="h1"
            animation="slideUp"
            by="word"
            startOnView={true}
            delay={0.1}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-color-dark mb-2"
          >
            Все объявления
          </TextAnimate>
          <TextAnimate
            as="p"
            animation="slideUp"
            by="word"
            startOnView={true}
            delay={0.2}
            className="text-base sm:text-lg text-color-medium mb-8 sm:mb-12"
          >
            Найдите нужное оборудование или студию для вашего проекта
          </TextAnimate>
        </BlurFade>

        {/* Filters */}
        <BlurFade inView={true} delay={0.3} direction="up">
          <div className="bg-white rounded-xl shadow-lg border border-color-light p-4 sm:p-6 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-color-dark mb-2">
                  Категория
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark bg-white"
                >
                  <option value="">Все категории</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-color-dark mb-2">
                  Локация
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none transition-all text-color-dark bg-white"
                >
                  <option value="">Все города</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </BlurFade>

        {/* Ads Grid */}
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {ads.map((ad, index) => (
                <BlurFade
                  key={ad._id}
                  inView={true}
                  delay={index * 0.05}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <BlurFade inView={true} delay={0.5} direction="up">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-color-light text-color-dark hover:bg-color-lightest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Назад
                  </button>
                  <span className="px-4 py-2 text-color-medium">
                    Страница {page} из {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg border border-color-light text-color-dark hover:bg-color-lightest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Вперед
                  </button>
                </div>
              </BlurFade>
            )}
          </>
        ) : (
          <BlurFade inView={true} delay={0.4} direction="up">
            <div className="text-center py-12">
              <p className="text-color-medium text-lg mb-4">
                Объявления не найдены
              </p>
              <Link
                href="/create"
                className="inline-block bg-color-medium text-white px-6 py-3 rounded-lg font-semibold hover:bg-color-dark transition-colors"
              >
                Создать объявление
              </Link>
            </div>
          </BlurFade>
        )}
      </div>
    </div>
  );
}

