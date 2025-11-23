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

export default function MainContentSection() {
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const categories = [
    { icon: "🎸", name: "Инструменты", color: "bg-white/10 hover:bg-white/20" },
    { icon: "🎙️", name: "Студии", color: "bg-white/10 hover:bg-white/20" },
    { icon: "🎧", name: "DJ оборудование", color: "bg-white/10 hover:bg-white/20" },
    { icon: "🎹", name: "Клавишные", color: "bg-white/10 hover:bg-white/20" },
    { icon: "🎤", name: "Микрофоны", color: "bg-white/10 hover:bg-white/20" },
    { icon: "🔊", name: "Аудио", color: "bg-white/10 hover:bg-white/20" },
  ];

  const features = [
    {
      icon: "⚡",
      title: "Быстро",
      description: "Найдите и забронируйте оборудование за минуты",
    },
    {
      icon: "💰",
      title: "Выгодно",
      description: "Экономьте деньги, арендуя вместо покупки",
    },
    {
      icon: "🛡️",
      title: "Безопасно",
      description: "Проверенные владельцы и защищенные сделки",
    },
    {
      icon: "⭐",
      title: "Надежно",
      description: "Система отзывов и рейтингов для вашего спокойствия",
    },
  ];

  const steps = [
    {
      icon: "🔍",
      title: "Найдите нужное",
      description: "Используйте поиск или выберите категорию, чтобы найти инструмент или студию",
    },
    {
      icon: "💬",
      title: "Свяжитесь с владельцем",
      description: "Напишите владельцу через встроенный мессенджер и обсудите детали",
    },
    {
      icon: "📅",
      title: "Забронируйте",
      description: "Договоритесь о времени и условиях аренды напрямую с владельцем",
    },
    {
      icon: "🎵",
      title: "Творите",
      description: "Получите доступ к инструменту или студии и создавайте свою музыку",
    },
  ];

  const getTransform = () => {
    if (isMobile) {
      return `translateY(${Math.max(0, -Math.max(0, scrollY - 200) * 0.1)}px)`;
    }
    const heroHeight = 700;
    const startScroll = heroHeight * 0.2;
    const scrollProgress = Math.max(0, scrollY - startScroll);
    const translateY = -40 - scrollProgress * 0.5;
    return `translateY(${translateY}px)`;
  };

  return (
    <div className="relative z-20">
      {/* Categories Section */}
      <section
        className="relative z-30 bg-color-medium w-full rounded-t-2xl sm:rounded-t-3xl md:rounded-t-[2rem] lg:rounded-t-[3rem] transition-transform duration-300 ease-out"
        style={{
          transform: getTransform(),
        }}
      >
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-10 pb-6 sm:pb-8">
          <TextAnimate
            as="h2"
            animation="slideUp"
            by="word"
            startOnView={true}
            delay={0.1}
            className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 sm:mb-5 md:mb-6 text-center"
          >
            Популярные категории
          </TextAnimate>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {categories.map((category, index) => (
              <BlurFade
                key={index}
                inView={true}
                delay={index * 0.05}
                direction="up"
                className="w-full"
              >
                <button
                  className={`${category.color} rounded-lg sm:rounded-xl p-2 sm:p-3 w-full aspect-square transition-all duration-200 flex flex-col items-center justify-center gap-1 sm:gap-1.5 group`}
                >
                  <div className="w-full h-6 sm:h-7 md:h-8 flex items-center justify-center">
                    <span className="text-xl sm:text-2xl md:text-3xl group-hover:scale-110 transition-transform block leading-none">
                      {category.icon}
                    </span>
                  </div>
                  <span className="text-white text-[9px] sm:text-[10px] md:text-xs font-medium text-center leading-tight line-clamp-2">
                    {category.name}
                  </span>
                </button>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-25 bg-color-medium w-full -mt-1">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
          <TextAnimate
            as="h2"
            animation="slideUp"
            by="word"
            startOnView={true}
            delay={0.1}
            className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-5 sm:mb-6 md:mb-8 text-center"
          >
            Почему выбирают нас
          </TextAnimate>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {features.map((feature, index) => (
              <BlurFade
                key={index}
                inView={true}
                delay={index * 0.1}
                direction="up"
                className="w-full"
              >
                <div className="bg-white/10 hover:bg-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-center transition-all duration-200 group">
                  <div className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-white text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/80 text-[10px] sm:text-xs md:text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Ads Section */}
      <section className="relative z-20 bg-color-lightest w-full rounded-t-2xl sm:rounded-t-3xl md:rounded-t-[2rem] lg:rounded-t-[3rem] -mt-1">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-10 md:pb-12">
          <BlurFade inView={true} delay={0.1} direction="up">
            <div className="flex items-center justify-between mb-5 sm:mb-6 md:mb-8">
              <TextAnimate
                as="h2"
                animation="slideUp"
                by="word"
                startOnView={true}
                delay={0.1}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-color-dark"
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

      {/* How It Works Section */}
      <section className="relative z-10 bg-white w-full rounded-t-2xl sm:rounded-t-3xl md:rounded-t-[2rem] lg:rounded-t-[3rem] -mt-1 rounded-b-2xl sm:rounded-b-3xl md:rounded-b-[2rem] lg:rounded-b-[3rem]">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 md:pt-12 pb-8 sm:pb-10 md:pb-12">
          <BlurFade inView={true} delay={0.1} direction="up">
            <TextAnimate
              as="h2"
              animation="slideUp"
              by="word"
              startOnView={true}
              delay={0.1}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-color-dark mb-3 sm:mb-4 md:mb-5 text-center"
            >
              Как это работает
            </TextAnimate>
            <TextAnimate
              as="p"
              animation="slideUp"
              by="word"
              startOnView={true}
              delay={0.2}
              className="text-sm sm:text-base md:text-lg text-color-medium mb-8 sm:mb-10 md:mb-12 text-center max-w-2xl mx-auto"
            >
              Простой и удобный способ арендовать музыкальное оборудование
            </TextAnimate>
          </BlurFade>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 md:gap-8">
            {steps.map((step, index) => (
              <BlurFade
                key={index}
                inView={true}
                delay={0.3 + index * 0.1}
                direction="up"
              >
                <div className="text-center relative">
                  <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-color-dark mb-2 sm:mb-3">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-color-medium leading-relaxed">
                    {step.description}
                  </p>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-color-light -z-10">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-color-medium rounded-full"></div>
                    </div>
                  )}
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

