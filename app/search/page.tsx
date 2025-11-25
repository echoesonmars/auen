"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BlurFade } from "@/components/ui/blur-fade";
import Link from "next/link";
import { useMetadata } from "@/app/hooks/useMetadata";

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
    <div className={`bg-white rounded-2xl border border-color-light p-6 ${options?.className || ""}`}>
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
        <div className="bg-white border-b border-color-light sticky top-16 z-40">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
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
                  {isLocationOpen && (
                    <div className="absolute top-full right-0 mt-2 w-full bg-white rounded-lg shadow-xl border border-color-light z-50 max-h-60 overflow-y-auto">
                      <button
                        type="button"
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
                          type="button"
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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
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
              <div className="bg-white rounded-2xl border border-color-light p-4 sm:p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-color-medium border-t-transparent"></div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {ads.map((ad, index) => (
                  <BlurFade key={ad._id} inView={true} delay={0.1 * (index % 6)} direction="up">
                    <Link
                      href={`/ads/${ad._id}`}
                      className="bg-white rounded-2xl border border-color-light overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block"
                      style={{ boxShadow: '0 4px 20px rgba(63, 114, 175, 0.1)' }}
                    >
                      <div className="aspect-video bg-color-lightest flex items-center justify-center overflow-hidden relative">
                        {ad.images && ad.images.length > 0 && ad.images[0] ? (
                          <img
                            src={ad.images[0]}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Если изображение не загрузилось, показываем эмодзи
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent) {
                                const icon = document.createElement("div");
                                icon.className = "text-6xl";
                                icon.textContent = getCategoryIcon(ad.category);
                                parent.appendChild(icon);
                              }
                            }}
                          />
                        ) : (
                          <div className="text-6xl">{getCategoryIcon(ad.category)}</div>
                        )}
                      </div>
                      <div className="p-4 sm:p-6">
                        <h3 className="text-lg font-bold text-color-dark mb-2 line-clamp-2">
                          {ad.title}
                        </h3>
                        <p className="text-sm text-color-medium mb-3">{ad.location}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-color-medium">{ad.price}</span>
                          <span className="text-xs text-color-medium">👁 {ad.views || 0}</span>
                        </div>
                      </div>
                    </Link>
                  </BlurFade>
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
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-color-lightest flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-color-medium mx-auto mb-4"></div>
          <p className="text-color-medium">Загрузка...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}

