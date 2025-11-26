"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BlurFade } from "@/components/ui/blur-fade";
import { useMetadata } from "@/app/hooks/useMetadata";
import { getImageUrl } from "@/lib/utils";

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

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get("location") || "Казахстан");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [sortBy, setSortBy] = useState("newest");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const categories = [
    { 
      icon: "🎸", 
      name: "Инструменты",
      subcategories: ["Гитары", "Барабаны", "Скрипки", "Духовые", "Ударные"]
    },
    { 
      icon: "🔊", 
      name: "Аудио",
      subcategories: ["Колонки", "Усилители", "Микшерные пульты", "Наушники"]
    },
    { 
      icon: "🎙️", 
      name: "Студии",
      subcategories: ["Звукозаписывающие", "Репетиционные", "Концертные"]
    },
    { 
      icon: "🎧", 
      name: "DJ оборудование",
      subcategories: ["Проигрыватели", "Контроллеры", "Диджейские столы"]
    },
  ];

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.name === category);
    return cat?.icon || "🎵";
  };

  useEffect(() => {
    loadAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedSubcategory, selectedLocation, searchQuery, sortBy]);

  // Обновляем метаданные страницы
  const pageTitle = searchQuery 
    ? `Поиск: ${searchQuery} | Auen`
    : selectedCategory
    ? `Категория: ${selectedCategory} | Auen`
    : "Поиск музыкального оборудования | Auen";
    
  const pageDescription = searchQuery
    ? `Результаты поиска по запросу "${searchQuery}" на платформе Auen. Найдите нужное музыкальное оборудование для аренды в Казахстане.`
    : "Найдите и арендуйте музыкальное оборудование, студии звукозаписи, инструменты и DJ-оборудование в Казахстане.";

  useMetadata(pageTitle, pageDescription);

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
  }, [locationSearchQuery, isLocationOpen, cities]);

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

  const loadAds = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (selectedLocation && selectedLocation !== "Казахстан") params.append("location", selectedLocation);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedSubcategory) params.append("subcategory", selectedSubcategory);
      params.append("sort", sortBy);
      
      const response = await fetch(`/api/ads?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setAds(result.data || []);
        setError(null);
      } else {
        setError(result.message || "Ошибка при загрузке объявлений");
        setAds([]);
      }
    } catch (error) {
      console.error("Error loading ads:", error);
      setError("Ошибка подключения к серверу");
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  const renderCategoriesContent = (options?: { className?: string; onSelect?: () => void }) => (
    <div className={`bg-white rounded-xl sm:rounded-2xl border border-color-light p-4 sm:p-6 ${options?.className || ""}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-color-dark">Категории</h3>
        {(selectedCategory || selectedSubcategory) && (
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("");
              setSelectedSubcategory("");
              setOpenCategory(null);
              options?.onSelect?.();
            }}
            className="w-8 h-8 rounded-full bg-color-lightest text-color-dark flex items-center justify-center hover:bg-color-light transition-colors"
            title="Сбросить фильтры"
          >
            ✕
          </button>
        )}
      </div>
      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.name} className="space-y-2">
            <button
              onClick={() => {
                if (openCategory === category.name) {
                  setOpenCategory(null);
                } else {
                  setOpenCategory(category.name);
                  setSelectedCategory(category.name);
                }
              }}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-between gap-3 ${
                selectedCategory === category.name
                  ? "bg-color-medium text-white"
                  : "bg-color-lightest text-color-dark hover:bg-color-light"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </div>
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${
                  openCategory === category.name ? "rotate-180" : ""
                }`}
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
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                openCategory === category.name ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
              }`}
            >
              <div className="pl-4 space-y-1">
                {category.subcategories.map((subcategory, idx) => (
                  <BlurFade
                    key={subcategory}
                    inView={openCategory === category.name}
                    delay={idx * 0.05}
                    direction="up"
                  >
                    <button
                      onClick={() => {
                        setSelectedSubcategory(subcategory);
                        setSelectedCategory(category.name);
                        options?.onSelect?.();
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                        selectedSubcategory === subcategory
                          ? "bg-color-medium/20 text-color-medium font-semibold"
                          : "text-color-medium hover:bg-color-lightest"
                      }`}
                    >
                      {subcategory}
                    </button>
                  </BlurFade>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAds();
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedLocation && selectedLocation !== "Казахстан") params.set("location", selectedLocation);
    if (selectedCategory) params.set("category", selectedCategory);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-color-lightest">
      {/* Search Header */}
      <BlurFade inView={true} delay={0.1} direction="down">
        <div className="bg-white border-b border-color-light sticky top-16 z-30">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <form onSubmit={handleSearch}>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Search input */}
                <div className="flex-1 relative">
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
                    placeholder="Что ищете?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-base rounded-xl border border-color-light focus:border-color-medium focus:outline-none focus:ring-2 focus:ring-color-medium/20"
                  />
                </div>

                {/* Location selector + filters */}
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none" ref={locationRef}>
                  <button
                    type="button"
                    onClick={() => setIsLocationOpen(!isLocationOpen)}
                      className="flex items-center justify-center gap-2 px-4 py-3 text-base rounded-xl border border-color-light hover:border-color-medium transition-colors bg-transparent text-color-dark w-full min-w-[150px]"
                  >
                    <svg
                      className="w-5 h-5 text-color-medium"
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
                    <span className="truncate">{selectedLocation}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${isLocationOpen ? "rotate-180" : ""}`}
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
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className="sm:hidden flex-1 px-4 py-3 rounded-xl border border-color-light text-color-dark font-medium hover:border-color-medium transition-colors"
                  >
                    Фильтры
                  </button>
                </div>

                {/* Search button */}
                <button
                  type="submit"
                  className="bg-color-medium text-white px-6 py-3 rounded-xl font-semibold hover:bg-color-dark hover:shadow-lg hover:scale-[1.02] transition-all duration-200 whitespace-nowrap"
                >
                  Поиск
                </button>
              </div>
            </form>
          </div>
        </div>
      </BlurFade>

      {/* Main Content */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Categories Sidebar */}
          <aside className="lg:col-span-1 hidden lg:block">
            <BlurFade inView={true} delay={0.2} direction="up">
              {renderCategoriesContent({ className: "sticky top-32" })}
            </BlurFade>
          </aside>

          {/* Products Section */}
          <div className="lg:col-span-3">
            {/* Sort and Filters */}
            <BlurFade inView={true} delay={0.3} direction="up">
              <div className="bg-white rounded-xl sm:rounded-2xl border border-color-light p-3 sm:p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-color-dark w-full">
                  <span className="font-semibold">Найдено: </span>
                  <span className="text-color-medium">{ads.length} объявлений</span>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <label className="text-sm text-color-medium whitespace-nowrap">Сортировка:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-color-light focus:border-color-medium focus:outline-none focus:ring-2 focus:ring-color-medium/20 text-color-dark bg-white"
                  >
                    <option value="newest">Сначала новые</option>
                    <option value="oldest">Сначала старые</option>
                    <option value="price-low">Цена: по возрастанию</option>
                    <option value="price-high">Цена: по убыванию</option>
                    <option value="views">По популярности</option>
                  </select>
                </div>
              </div>
            </BlurFade>

            {/* Ads Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="flex justify-center items-center space-x-2">
                  <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <p className="mt-4 text-color-medium">Загрузка...</p>
              </div>
            ) : error ? (
              <BlurFade inView={true} delay={0.4} direction="up">
                <div className="bg-white rounded-2xl border border-color-light p-12 text-center">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 className="text-xl font-bold text-color-dark mb-2">Ошибка загрузки</h3>
                  <p className="text-color-medium mb-4">{error}</p>
                  <button
                    onClick={loadAds}
                    className="bg-color-medium text-white px-6 py-3 rounded-xl font-semibold hover:bg-color-dark hover:shadow-lg transition-all duration-200"
                  >
                    Попробовать снова
                  </button>
                </div>
              </BlurFade>
            ) : ads.length === 0 ? (
              <BlurFade inView={true} delay={0.4} direction="up">
                <div className="bg-white rounded-2xl border border-color-light p-12 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-color-dark mb-2">Ничего не найдено</h3>
                  <p className="text-color-medium">Попробуйте изменить параметры поиска</p>
                </div>
              </BlurFade>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 relative" style={{ zIndex: 1 }}>
                {ads.map((ad) => (
                  <a
                    key={ad._id}
                    href={`/ads/${ad._id}`}
                    onClick={(e) => {
                      // Разрешаем стандартное поведение ссылки
                      e.stopPropagation();
                    }}
                    className="bg-white rounded-xl sm:rounded-2xl border border-color-light overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block w-full h-full cursor-pointer relative"
                    style={{ boxShadow: '0 4px 20px rgba(63, 114, 175, 0.1)', zIndex: 2 }}
                  >
                    <div className="aspect-[3/4] bg-color-lightest flex items-center justify-center overflow-hidden relative">
                      {ad.images && ad.images.length > 0 && ad.images[0] ? (
                        <img
                          src={getImageUrl(ad.images[0])}
                          alt={ad.title}
                          className="w-full h-full object-cover pointer-events-none"
                          onError={(e) => {
                            // Если изображение не загрузилось, показываем эмодзи
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              const icon = document.createElement("div");
                              icon.className = "text-5xl sm:text-6xl pointer-events-none";
                              icon.textContent = getCategoryIcon(ad.category);
                              parent.appendChild(icon);
                            }
                          }}
                        />
                      ) : (
                        <div className="text-5xl sm:text-6xl pointer-events-none">{getCategoryIcon(ad.category)}</div>
                      )}
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="text-base sm:text-lg font-bold text-color-dark mb-1.5 sm:mb-2 line-clamp-2">
                        {ad.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-color-medium mb-2 sm:mb-3">{ad.location}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg sm:text-xl font-bold text-color-medium">{ad.price}</span>
                        <span className="text-xs text-color-medium">👁 {ad.views || 0}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          isMobileFiltersOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/40 transition-opacity duration-300"
          onClick={() => setIsMobileFiltersOpen(false)}
        />
        <div
          className={`absolute inset-x-0 bottom-0 w-full bg-white shadow-2xl rounded-t-3xl p-6 overflow-y-auto transition-transform duration-300 ${
            isMobileFiltersOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-color-dark">Фильтры</h3>
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(false)}
              className="w-10 h-10 rounded-full bg-color-lightest flex items-center justify-center text-color-dark"
            >
              ✕
            </button>
          </div>
          {renderCategoriesContent({
            onSelect: () => setIsMobileFiltersOpen(false),
            className: "border-none p-0",
          })}
        </div>
      </div>

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

export default function SearchPage() {
  return (
    <Suspense fallback={
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
    }>
      <SearchPageContent />
    </Suspense>
  );
}

