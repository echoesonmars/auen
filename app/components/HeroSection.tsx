"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { TextAnimate } from "@/components/ui/text-animate";
import { Highlighter } from "@/components/ui/highlighter";
import { BlurFade } from "@/components/ui/blur-fade";
import { getImageUrl } from "@/lib/utils";

export default function HeroSection() {
  const router = useRouter();
  const word = "МУЗЫКУ";
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("Казахстан");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const locationRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const categoryIcons: Record<string, string> = {
    "Инструменты": "🎸",
    "Студии": "🎙️",
    "DJ оборудование": "🎧",
    "Клавишные": "🎹",
    "Микрофоны": "🎤",
    "Аудио": "🔊",
  };

  const [featuredCards, setFeaturedCards] = useState<Array<{
    id: string;
    title: string;
    location: string;
    price: string;
    image: string;
    category?: string;
    adId?: string;
  }>>([
    {
      id: "1",
      title: "Гитара Fender",
      location: "Алматы",
      price: "5000₸/день",
      image: "🎸",
      category: "Инструменты",
    },
    {
      id: "2",
      title: "Студия звукозаписи",
      location: "Астана",
      price: "15000₸/час",
      image: "🎙️",
      category: "Студии",
    },
    {
      id: "3",
      title: "DJ оборудование",
      location: "Шымкент",
      price: "8000₸/день",
      image: "🎧",
      category: "DJ оборудование",
    },
    {
      id: "4",
      title: "Барабанная установка",
      location: "Караганда",
      price: "6000₸/день",
      image: "🥁",
      category: "Инструменты",
    },
  ]);

  // Загружаем featured объявления из базы данных
  useEffect(() => {
    const loadFeaturedAds = async () => {
      try {
        const response = await fetch("/api/ads?featured=true&limit=4");
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          
          const cards = result.data.map((ad: {
            _id: string;
            title: string;
            location: string;
            price: string;
            category: string;
            images?: string[];
          }) => {
            // Определяем изображение: если есть реальные изображения, используем первое, иначе эмодзи
            const firstImage = ad.images && ad.images.length > 0 ? ad.images[0] : null;
            const imageUrl = firstImage && (firstImage.startsWith('http') || firstImage.startsWith('/'))
              ? firstImage
              : null;
            
            return {
              id: ad._id,
              title: ad.title,
              location: ad.location,
              price: ad.price,
              category: ad.category,
              image: imageUrl || (categoryIcons[ad.category] || "🎵"),
              adId: ad._id,
            };
          });
          
          setFeaturedCards(cards);
        }
      } catch (error) {
        // Используем дефолтные карточки при ошибке
        if (process.env.NODE_ENV === 'development') {
          console.error("Error loading featured ads:", error);
        }
      }
    };
    
    loadFeaturedAds();
  }, []);

  const cities = [
    "Алматы",
    "Астана",
    "Нур-Султан",
    "Шымкент",
    "Караганда",
    "Актобе",
    "Тараз",
    "Павлодар",
    "Усть-Каменогорск",
    "Семей",
    "Атырау",
    "Костанай",
    "Кызылорда",
    "Уральск",
    "Петропавловск",
    "Актау",
    "Темиртау",
    "Туркестан",
    "Кокшетау",
    "Талдыкорган",
    "Экибастуз",
    "Жезказган",
    "Кентау",
    "Балхаш",
    "Рудный",
    "Сатпаев",
    "Каскелен",
    "Капшагай",
    "Риддер",
    "Эмба",
    "Жанаозен",
    "Аральск",
    "Аксу",
    "Степногорск",
    "Щучинск",
    "Жаркент",
    "Алтай",
    "Аягоз",
    "Зыряновск",
    "Ленгер",
    "Шардара",
    "Акколь",
    "Есик",
    "Текели",
    "Шалкар",
    "Житикара",
    "Атбасар",
    "Макинск",
    "Серебрянск",
    "Курчатов",
    "Приозерск",
    "Аксай",
    "Арыс",
    "Байконур",
    "Жанатас",
    "Каратау",
    "Кульсары",
    "Лисаковск",
    "Сарканд",
    "Тайынша",
    "Талгар",
    "Уштобе",
    "Хромтау",
    "Шахтинск",
    "Шу",
    "Алга",
    "Аркалык",
    "Булаево",
    "Державинск",
    "Ерейментау",
    "Зайсан",
    "Казалинск",
    "Кандыагаш",
    "Каражал",
    "Каркаралинск",
    "Качар",
    "Кызылжар",
    "Мамлютка",
    "Осакаровка",
    "Сарань",
    "Степняк",
    "Форт-Шевченко",
    "Чарск",
  ];

  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let cursorTimeout: NodeJS.Timeout;

    // Запускаем анимацию сразу при монтировании
    if (displayedText.length < word.length) {
      // Печатаем букву за буквой
      timeout = setTimeout(() => {
        setDisplayedText(word.slice(0, displayedText.length + 1));
      }, 100);
    } else {
      // После полного слова скрываем курсор через 1 секунду
      cursorTimeout = setTimeout(() => {
        setShowCursor(false);
      }, 1000);
    }

    return () => {
      clearTimeout(timeout);
      clearTimeout(cursorTimeout);
    };
  }, [displayedText, word]);

  // Запускаем анимацию сразу при монтировании компонента
  useEffect(() => {
    if (displayedText === "") {
      setDisplayedText(word.charAt(0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AI suggestions for location search
  useEffect(() => {
    if (locationSearchQuery.length > 2 && isLocationOpen) {
      const timeoutId = setTimeout(async () => {
        setIsLoadingSuggestions(true);
        try {
          const response = await fetch("/api/ai/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: `Предложи города Казахстана похожие на "${locationSearchQuery}". Верни только названия городов через запятую, без дополнительного текста.`,
            }),
          });

          const result = await response.json();
          if (result.success && result.data?.message) {
            const suggestions = result.data.message
              .split(/[,，]/)
              .map((s: string) => s.trim())
              .filter((s: string) => s.length > 0 && cities.some(city => city.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(city.toLowerCase())))
              .slice(0, 5);
            setAiSuggestions(suggestions);
          }
        } catch {
          // Ignore AI errors, just don't show suggestions
        } finally {
          setIsLoadingSuggestions(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setAiSuggestions([]);
    }
  }, [locationSearchQuery, isLocationOpen]);

  // Close location modal and prevent scrollbar shift
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isLocationOpen) {
        setIsLocationOpen(false);
        setLocationSearchQuery("");
      }
    };

    if (isLocationOpen) {
      // Calculate scrollbar width BEFORE hiding it
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Save original styles
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyPaddingRight = document.body.style.paddingRight;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalHtmlOverflowX = document.documentElement.style.overflowX;
      
      // Hide scrollbars
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.overflowX = 'hidden';
      
      // Compensate for scrollbar width - apply to body only (more reliable)
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      document.addEventListener("keydown", handleEscape);
      
      return () => {
        document.removeEventListener("keydown", handleEscape);
        
        // Restore original styles
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.paddingRight = originalBodyPaddingRight;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.documentElement.style.overflowX = originalHtmlOverflowX;
        
        setLocationSearchQuery("");
        setAiSuggestions([]);
      };
    }
  }, [isLocationOpen]);


  // Автоматическая смена карточек
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCardIndex((prev) => (prev + 1) % featuredCards.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [featuredCards.length]);

  return (
    <div ref={heroRef} className="min-h-screen bg-color-lightest relative flex flex-col">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 bg-color-light rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-color-medium rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center flex-1 py-4 sm:py-6 md:py-8 lg:min-h-[calc(100vh-4rem)] lg:justify-center lg:items-center">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 md:space-y-10 pb-8 sm:pb-12">
          {/* Content split into two parts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            {/* Left side - Main content */}
            <div className="space-y-4 sm:space-y-3 md:space-y-6 text-left order-1 flex flex-col justify-center">
              <h1 className="text-[4.3rem] sm:text-8xl md:text-[7rem] lg:text-6xl xl:text-7xl font-bold text-color-dark leading-[1.1] tracking-tight">
                <TextAnimate
                  as="span"
                  animation="slideUp" by="character"
                  delay={0.1}
                  startOnView={false}
                  className="block"
                >
                  Арендуй
                </TextAnimate>
                <span className="block min-h-[1.1em] sm:min-h-[1.2em]">
                  <span className="mt-3 inline-block text-color-medium font-bold font-kyiv text-[4.3rem] sm:text-8xl md:text-[7rem] lg:text-6xl xl:text-7xl">
                    {displayedText}
                    {showCursor && <span className="animate-pulse">|</span>}
                  </span>
                </span>
                <Highlighter
                  action="highlight"
                  color="#3F72AF"
                  strokeWidth={2}
                  animationDuration={1500}
                  isView={true}
                >
                  <TextAnimate
                    as="span"
                    by="character"
                    animation="fadeIn"
                    delay={0.3}
                    startOnView={false}
                    className="block text-white"
                  >
                    за минуты.
                  </TextAnimate>
                </Highlighter>
              </h1>
              
              {/* Subtitle */}
              <TextAnimate
                as="p"
                animation="slideUp" by="character"
                delay={0.5}
                startOnView={false}
                className="text-base sm:text-lg md:text-xl text-color-medium max-w-2xl leading-relaxed"
              >
                Играй, записывай, создавай — без лишней возни и переплат.
              </TextAnimate>
            </div>

            {/* Right side - Featured cards carousel */}
            <div className="hidden lg:flex order-2 items-center">
              <div className="relative w-full h-full min-h-[400px]">
                {featuredCards.map((card, index) => (
                  <BlurFade
                    key={card.id}
                    inView={true}
                    delay={index * 0.1}
                    className={`absolute inset-0 transition-all duration-500 ${
                      index === currentCardIndex
                        ? "opacity-100 translate-x-0 z-10"
                        : index < currentCardIndex
                        ? "opacity-0 -translate-x-full"
                        : "opacity-0 translate-x-full"
                    }`}
                  >
                    <Link
                      href={card.adId ? `/ads/${card.adId}` : '#'}
                      className="relative rounded-2xl border-2 border-white overflow-hidden h-full transition-all duration-300 hover:scale-[1.02] cursor-pointer block group"
                      style={{ boxShadow: '0 10px 40px rgba(63, 114, 175, 0.15)' }}
                      aria-label={`${card.title} в ${card.location}, ${card.price}`}
                    >
                      {card.image && typeof card.image === 'string' && (card.image.startsWith('http') || card.image.startsWith('/')) ? (
                        <>
                          <div className="relative w-full h-full">
                            <Image
                              src={getImageUrl(card.image)}
                              alt={card.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                              priority={index === 0}
                              onError={(e) => {
                                console.error("Featured image failed to load:", getImageUrl(card.image));
                                // Fallback to emoji
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector(".fallback-icon")) {
                                  const icon = document.createElement("div");
                                  icon.className = "fallback-icon w-full h-full bg-color-lightest flex items-center justify-center text-5xl absolute inset-0";
                                  icon.textContent = card.category ? (categoryIcons[card.category] || "🎵") : "🎵";
                                  parent.appendChild(icon);
                                }
                              }}
                            />
                          </div>
                          {/* Темный градиент снизу */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none transition-opacity duration-300 group-hover:opacity-90"></div>
                          {/* Текст поверх градиента */}
                          <div className="absolute bottom-0 left-0 right-0 p-6 text-white pointer-events-none">
                            <h3 className="text-xl font-bold mb-2 transition-transform duration-300 group-hover:translate-y-[-2px]">
                              {card.title}
                            </h3>
                            <p className="text-sm mb-2 opacity-90">{card.location}</p>
                            <div className="text-2xl font-bold">
                              {card.price}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-full h-full bg-color-lightest flex items-center justify-center">
                            <div className="text-5xl">{card.image || "🎵"}</div>
                          </div>
                          {/* Темный градиент снизу */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none transition-opacity duration-300 group-hover:opacity-90"></div>
                          {/* Текст поверх градиента */}
                          <div className="absolute bottom-0 left-0 right-0 p-6 text-white pointer-events-none">
                            <h3 className="text-xl font-bold mb-2 transition-transform duration-300 group-hover:translate-y-[-2px]">
                              {card.title}
                            </h3>
                            <p className="text-sm mb-2 opacity-90">{card.location}</p>
                            <div className="text-2xl font-bold">
                              {card.price}
                            </div>
                          </div>
                        </>
                      )}
                    </Link>
                  </BlurFade>
                ))}
                {/* Carousel indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {featuredCards.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentCardIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentCardIndex
                          ? "bg-color-medium w-6"
                          : "bg-color-light"
                      }`}
                      aria-label={`Go to card ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Search */}
          <BlurFade inView={true} delay={0.3} direction="up">
            <div className="mt-8 sm:mt-12 md:mt-16">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const params = new URLSearchParams();
                  if (searchQuery) params.set("q", searchQuery);
                  if (selectedLocation && selectedLocation !== "Казахстан") params.set("location", selectedLocation);
                  router.push(`/search?${params.toString()}`);
                }}
              >
                <div className="relative group">
                  <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-xl border border-color-light p-1 sm:p-1.5">
                  <div className="flex flex-row items-center gap-1.5 sm:gap-2">
                    {/* Search input */}
                    <div className="flex-1 relative min-w-0">
                      <svg
                        className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-color-medium"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <input
                        type="text"
                        placeholder="Что ищете?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Поиск объявлений"
                        className="w-full pl-8 sm:pl-10 pr-2 sm:pr-4 py-1.5 sm:py-2.5 text-xs sm:text-sm md:text-base rounded-lg sm:rounded-xl border-0 bg-transparent text-color-dark placeholder:text-color-medium focus:outline-none focus:ring-0"
                      />
                    </div>

                  {/* Location selector - только иконка на маленьких экранах */}
                  <div className="relative flex-shrink-0" ref={locationRef}>
                    <button
                      type="button"
                      onClick={() => setIsLocationOpen(!isLocationOpen)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setIsLocationOpen(!isLocationOpen);
                        }
                      }}
                      aria-expanded={isLocationOpen}
                      aria-haspopup="listbox"
                      aria-label="Выбрать локацию"
                      className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2.5 text-sm sm:text-base rounded-lg sm:rounded-xl border border-color-light hover:border-color-medium transition-colors bg-transparent text-color-dark focus:outline-none"
                    >
                      <svg
                        className="w-4 h-4 sm:w-4 sm:h-4 text-color-medium flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="hidden sm:inline truncate max-w-[100px] md:max-w-none">{selectedLocation}</span>
                      <svg
                        className={`hidden sm:block w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform flex-shrink-0 ${isLocationOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Search button */}
                  <button
                    type="submit"
                    aria-label="Выполнить поиск"
                    className="bg-color-medium text-white px-3 sm:px-5 md:px-6 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold hover:bg-color-dark hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-xs sm:text-sm md:text-base whitespace-nowrap flex-shrink-0 focus:outline-none"
                  >
                    Поиск
                  </button>
                </div>
                </div>
              </div>
              </form>
            </div>
          </BlurFade>

          {/* Quick Action Buttons */}
          <BlurFade inView={true} delay={0.4} direction="up">
            <div className="mt-6 sm:mt-8">
              <div className="flex flex-nowrap gap-2 sm:gap-3">
                <button
                  onClick={() => router.push("/locations")}
                  aria-label="Открыть список мест"
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 bg-white rounded-lg sm:rounded-xl border border-color-light hover:border-color-medium hover:shadow-lg transition-all duration-200 text-xs sm:text-sm font-medium text-color-dark hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap focus:outline-none"
                >
                  <svg
                    width="16"
                    height="16"
                    className="sm:w-5 sm:h-5 flex-shrink-0 text-color-medium"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span className="hidden sm:inline">Открыть список мест</span>
                  <span className="sm:hidden">Места</span>
                </button>

                <button
                  onClick={() => router.push("/search?nearby=true")}
                  aria-label="Найти ближайшую студию"
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 bg-white rounded-lg sm:rounded-xl border border-color-light hover:border-color-medium hover:shadow-lg transition-all duration-200 text-xs sm:text-sm font-medium text-color-dark hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap focus:outline-none"
                >
                  <svg
                    width="16"
                    height="16"
                    className="sm:w-5 sm:h-5 flex-shrink-0 text-color-medium"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                  <span className="hidden sm:inline">Найти ближайшую студию</span>
                  <span className="sm:hidden">Студия</span>
                </button>

                <button
                  onClick={() => router.push("/blog")}
                  aria-label="Открыть блог"
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 bg-white rounded-lg sm:rounded-xl border border-color-light hover:border-color-medium hover:shadow-lg transition-all duration-200 text-xs sm:text-sm font-medium text-color-dark hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap focus:outline-none"
                >
                  <svg
                    width="16"
                    height="16"
                    className="sm:w-5 sm:h-5 flex-shrink-0 text-color-medium"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                  <span>Блог</span>
                </button>
              </div>
            </div>
          </BlurFade>

          {/* Featured cards for mobile (shown below search) */}
          <BlurFade inView={true} delay={0.4} direction="up">
            <div className="lg:hidden mt-8">
              <div className="relative h-72 sm:h-80">
                {featuredCards.map((card, index) => (
                  <div
                    key={card.id}
                    className={`absolute inset-0 transition-all duration-500 ${
                      index === currentCardIndex
                        ? "opacity-100 translate-x-0 z-10"
                        : index < currentCardIndex
                        ? "opacity-0 -translate-x-full"
                        : "opacity-0 translate-x-full"
                    }`}
                  >
                    <Link
                      href={card.adId ? `/ads/${card.adId}` : '#'}
                      className="relative rounded-2xl border-2 border-white overflow-hidden h-full transition-all duration-300 hover:scale-[1.02] block group"
                      style={{ boxShadow: '0 10px 40px rgba(63, 114, 175, 0.15)' }}
                      aria-label={`${card.title} в ${card.location}, ${card.price}`}
                    >
                      {card.image && typeof card.image === 'string' && (card.image.startsWith('http') || card.image.startsWith('/')) ? (
                        <>
                          <div className="relative w-full h-full">
                            <Image
                              src={getImageUrl(card.image)}
                              alt={card.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                              priority={index === 0}
                              onError={(e) => {
                                console.error("Featured image failed to load:", getImageUrl(card.image));
                                // Fallback to emoji
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector(".fallback-icon")) {
                                  const icon = document.createElement("div");
                                  icon.className = "fallback-icon w-full h-full bg-color-lightest flex items-center justify-center text-5xl absolute inset-0";
                                  icon.textContent = card.category ? (categoryIcons[card.category] || "🎵") : "🎵";
                                  parent.appendChild(icon);
                                }
                              }}
                            />
                          </div>
                          {/* Темный градиент снизу */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none transition-opacity duration-300 group-hover:opacity-90"></div>
                          {/* Текст поверх градиента */}
                          <div className="absolute bottom-0 left-0 right-0 p-6 text-white pointer-events-none">
                            <h3 className="text-xl font-bold mb-2 transition-transform duration-300 group-hover:translate-y-[-2px]">
                              {card.title}
                            </h3>
                            <p className="text-sm mb-2 opacity-90">{card.location}</p>
                            <div className="text-2xl font-bold">
                              {card.price}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-full h-full bg-color-lightest flex items-center justify-center">
                            <div className="text-5xl">{card.image || "🎵"}</div>
                          </div>
                          {/* Темный градиент снизу */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none transition-opacity duration-300 group-hover:opacity-90"></div>
                          {/* Текст поверх градиента */}
                          <div className="absolute bottom-0 left-0 right-0 p-6 text-white pointer-events-none">
                            <h3 className="text-xl font-bold mb-2 transition-transform duration-300 group-hover:translate-y-[-2px]">
                              {card.title}
                            </h3>
                            <p className="text-sm mb-2 opacity-90">{card.location}</p>
                            <div className="text-2xl font-bold">
                              {card.price}
                            </div>
                          </div>
                        </>
                      )}
                    </Link>
                  </div>
                ))}
              {/* Carousel indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {featuredCards.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentCardIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentCardIndex
                        ? "bg-color-medium w-6"
                        : "bg-color-light"
                    }`}
                    aria-label={`Go to card ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
          </BlurFade>
        </div>
      </section>

      {/* Location Selection Modal */}
      <AnimatePresence>
        {isLocationOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              onClick={() => {
                setIsLocationOpen(false);
                setLocationSearchQuery("");
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
              style={{ left: 0, right: 0, top: 0, bottom: 0 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-6 border-b border-color-light">
                  <h2 className="text-2xl font-bold text-color-dark mb-2">Выберите город</h2>
                  <p className="text-sm text-color-medium">Найдите город или выберите из списка</p>
                </div>

                {/* Search Input */}
                <div className="p-4 border-b border-color-light">
                  <div className="relative">
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-color-medium"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Поиск города..."
                      value={locationSearchQuery}
                      onChange={(e) => setLocationSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none text-color-dark placeholder:text-color-medium"
                      autoFocus
                    />
                    {isLoadingSuggestions && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="flex justify-center items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Suggestions */}
                  {aiSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-1"
                    >
                      <p className="text-xs text-color-medium mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        AI подсказки:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              const matchedCity = cities.find(city => 
                                city.toLowerCase().includes(suggestion.toLowerCase()) || 
                                suggestion.toLowerCase().includes(city.toLowerCase())
                              );
                              if (matchedCity) {
                                setSelectedLocation(matchedCity);
                                setIsLocationOpen(false);
                                setLocationSearchQuery("");
                              }
                            }}
                            className="px-3 py-1.5 text-xs bg-color-lightest text-color-dark rounded-lg hover:bg-color-light transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Cities List */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                  <div className="p-2">
                    {/* Казахстан option */}
                    <button
                      role="option"
                      aria-selected={selectedLocation === "Казахстан"}
                      onClick={() => {
                        setSelectedLocation("Казахстан");
                        setIsLocationOpen(false);
                        setLocationSearchQuery("");
                      }}
                      className={`w-full px-4 py-3 text-left rounded-lg hover:bg-color-lightest transition-colors focus:outline-none ${
                        selectedLocation === "Казахстан" ? "bg-color-lightest font-semibold" : ""
                      } ${locationSearchQuery && !"Казахстан".toLowerCase().includes(locationSearchQuery.toLowerCase()) ? "hidden" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-color-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Казахстан</span>
                        {selectedLocation === "Казахстан" && (
                          <svg className="w-5 h-5 text-color-medium ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>

                    {/* Cities */}
                    {cities
                      .filter(city => 
                        !locationSearchQuery || 
                        city.toLowerCase().includes(locationSearchQuery.toLowerCase())
                      )
                      .map((city) => (
                        <button
                          key={city}
                          role="option"
                          aria-selected={selectedLocation === city}
                          onClick={() => {
                            setSelectedLocation(city);
                            setIsLocationOpen(false);
                            setLocationSearchQuery("");
                          }}
                          className={`w-full px-4 py-3 text-left rounded-lg hover:bg-color-lightest transition-colors focus:outline-none ${
                            selectedLocation === city ? "bg-color-lightest font-semibold" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-color-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{city}</span>
                            {selectedLocation === city && (
                              <svg className="w-5 h-5 text-color-medium ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-color-light flex justify-end">
                  <button
                    onClick={() => {
                      setIsLocationOpen(false);
                      setLocationSearchQuery("");
                    }}
                    className="px-6 py-2 text-color-dark hover:bg-color-lightest rounded-lg transition-colors focus:outline-none"
                  >
                    Закрыть
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

