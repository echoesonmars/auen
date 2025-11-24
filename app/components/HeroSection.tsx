"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TextAnimate } from "@/components/ui/text-animate";
import { Highlighter } from "@/components/ui/highlighter";
import { BlurFade } from "@/components/ui/blur-fade";

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

  // Примерные карточки товаров с рекламой
  const featuredCards = [
    {
      id: 1,
      title: "Гитара Fender",
      location: "Алматы",
      price: "5000₸/день",
      image: "🎸",
    },
    {
      id: 2,
      title: "Студия звукозаписи",
      location: "Астана",
      price: "15000₸/час",
      image: "🎙️",
    },
    {
      id: 3,
      title: "DJ оборудование",
      location: "Шымкент",
      price: "8000₸/день",
      image: "🎧",
    },
    {
      id: 4,
      title: "Барабанная установка",
      location: "Караганда",
      price: "6000₸/день",
      image: "🥁",
    },
  ];

  const cities = [
    "Алматы",
    "Астана",
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
  ];

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

  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
    };

    if (isLocationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
                    <div className="bg-white rounded-2xl border border-color-light p-6 h-full flex flex-col justify-between transition-all duration-300 hover:scale-[1.02]" style={{ boxShadow: '0 10px 40px rgba(63, 114, 175, 0.15)' }}>
                      <div>
                        <div className="text-5xl mb-4 flex-shrink-0 leading-none" style={{ minHeight: '3rem' }}>{card.image}</div>
                        <h3 className="text-xl font-bold text-color-dark mb-2">
                          {card.title}
                        </h3>
                        <p className="text-color-medium text-sm mb-4">{card.location}</p>
                      </div>
                      <div className="text-2xl font-bold text-color-medium">
                        {card.price}
                      </div>
                    </div>
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
                        className="w-full pl-8 sm:pl-10 pr-2 sm:pr-4 py-1.5 sm:py-2.5 text-xs sm:text-sm md:text-base rounded-lg sm:rounded-xl border-0 bg-transparent text-color-dark placeholder:text-color-medium focus:outline-none focus:ring-0"
                      />
                    </div>

                  {/* Location selector - только иконка на маленьких экранах */}
                  <div className="relative flex-shrink-0" ref={locationRef}>
                    <button
                      type="button"
                      onClick={() => setIsLocationOpen(!isLocationOpen)}
                      className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2.5 text-sm sm:text-base rounded-lg sm:rounded-xl border border-color-light hover:border-color-medium transition-colors bg-transparent text-color-dark"
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
                    {isLocationOpen && (
                      <div className="absolute top-full right-0 sm:left-0 mt-2 w-48 sm:w-full bg-white rounded-lg shadow-xl border border-color-light z-50 max-h-60 overflow-y-auto">
                        <button
                          onClick={() => {
                            setSelectedLocation("Казахстан");
                            setIsLocationOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-color-lightest transition-colors ${
                            selectedLocation === "Казахстан" ? "bg-color-lightest font-semibold" : ""
                          }`}
                        >
                          Казахстан
                        </button>
                        {cities.map((city) => (
                          <button
                            key={city}
                            onClick={() => {
                              setSelectedLocation(city);
                              setIsLocationOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-color-lightest transition-colors ${
                              selectedLocation === city ? "bg-color-lightest font-semibold" : ""
                            }`}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Search button */}
                  <button
                    type="submit"
                    className="bg-color-medium text-white px-3 sm:px-5 md:px-6 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold hover:bg-color-dark hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-xs sm:text-sm md:text-base whitespace-nowrap flex-shrink-0"
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
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 bg-white rounded-lg sm:rounded-xl border border-color-light hover:border-color-medium hover:shadow-lg transition-all duration-200 text-xs sm:text-sm font-medium text-color-dark hover:scale-[1.02] whitespace-nowrap"
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
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 bg-white rounded-lg sm:rounded-xl border border-color-light hover:border-color-medium hover:shadow-lg transition-all duration-200 text-xs sm:text-sm font-medium text-color-dark hover:scale-[1.02] whitespace-nowrap"
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
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 bg-white rounded-lg sm:rounded-xl border border-color-light hover:border-color-medium hover:shadow-lg transition-all duration-200 text-xs sm:text-sm font-medium text-color-dark hover:scale-[1.02] whitespace-nowrap"
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
                    <div className="bg-white rounded-2xl border border-color-light p-6 h-full flex flex-col justify-between transition-all duration-300 hover:scale-[1.02]" style={{ boxShadow: '0 10px 40px rgba(63, 114, 175, 0.15)' }}>
                      <div>
                        <div className="text-5xl mb-4 flex-shrink-0 leading-none" style={{ minHeight: '3rem' }}>{card.image}</div>
                        <h3 className="text-xl font-bold text-color-dark mb-2">
                          {card.title}
                        </h3>
                        <p className="text-color-medium text-sm mb-4">{card.location}</p>
                      </div>
                      <div className="text-2xl font-bold text-color-medium">
                        {card.price}
                      </div>
                    </div>
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
    </div>
  );
}

