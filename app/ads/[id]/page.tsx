"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { BlurFade } from "@/components/ui/blur-fade";
import { useMetadata } from "@/app/hooks/useMetadata";
import { useToast } from "@/components/ui/toast";
import ImageGallery from "@/app/components/ImageGallery";
import BookingWidget from "@/app/components/BookingWidget";
import { getImageUrl } from "@/lib/utils";

interface Ad {
  _id: string;
  title: string;
  category: string;
  description: string;
  price: string;
  location: string;
  images: string[];
  views: number;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  createdAt: string;
  status: string;
}

export default function AdDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Обрабатываем params как Promise или обычный объект
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const id = resolvedParams.id;
  
  const router = useRouter();
  const { showToast } = useToast();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [bookings, setBookings] = useState<Array<{
    startDate: string | Date;
    endDate: string | Date;
    status: string;
  }>>([]);

  useEffect(() => {
    if (id) {
      loadAd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadAd = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ads/${id}`);
      const result = await response.json();

      if (result.success) {
        // Убеждаемся, что images - это массив
        const adData = {
          ...result.data,
          images: result.data.images || [],
        };
        setAd(adData);
        
        // Загружаем бронирования
        if (adData.bookings) {
          setBookings(adData.bookings);
        }
        
        // Проверяем, является ли текущий пользователь владельцем
        const userId = localStorage.getItem("userId");
        const adUserId = adData.userId?._id?.toString() || adData.userId?.toString();
        setIsOwner(userId === adUserId);
        
        console.log("Loaded ad:", adData);
        console.log("Ad images:", adData.images);
      } else {
        setError(result.message || "Объявление не найдено");
      }
    } catch (error) {
      console.error("Error loading ad:", error);
      setError("Ошибка при загрузке объявления");
    } finally {
      setLoading(false);
    }
  };

  useMetadata(
    ad ? `${ad.title} | Auen` : "Объявление | Auen",
    ad ? `${ad.description.substring(0, 160)}...` : "Просмотр объявления"
  );

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

  if (loading) {
    return (
      <div className="min-h-screen bg-color-lightest flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-color-medium mx-auto mb-4"></div>
          <p className="text-color-medium">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen bg-color-lightest flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-color-dark mb-4">
            {error || "Объявление не найдено"}
          </h1>
          <Link
            href="/search"
            className="text-color-medium hover:text-color-dark transition-colors underline"
          >
            Вернуться к поиску
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-color-lightest">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <BlurFade inView={true} delay={0.1} direction="up">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-color-medium hover:text-color-dark transition-colors mb-6"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Назад
          </button>
        </BlurFade>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <BlurFade inView={true} delay={0.2} direction="up">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light overflow-hidden">
                {ad.images && ad.images.length > 0 && ad.images[selectedImageIndex] ? (
                  <div className="relative">
                    <div className="aspect-[3/4] bg-color-lightest flex items-center justify-center overflow-hidden relative group cursor-pointer lg:max-w-md lg:mx-auto" onClick={() => setShowGallery(true)}>
                      <img
                        src={getImageUrl(ad.images[selectedImageIndex])}
                        alt={ad.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          // Если изображение не загрузилось, показываем эмодзи
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector(".fallback-icon")) {
                            const icon = document.createElement("div");
                            icon.className = "fallback-icon text-8xl";
                            icon.textContent = getCategoryIcon(ad.category);
                            parent.appendChild(icon);
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-full p-3">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-color-dark"
                          >
                            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                    {ad.images.length > 1 && (
                      <>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {ad.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                selectedImageIndex === index
                                  ? "bg-color-medium w-8"
                                  : "bg-white/50 hover:bg-white/75"
                              }`}
                              aria-label={`Image ${index + 1}`}
                            />
                          ))}
                        </div>
                        {ad.images.length > 1 && (
                          <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <button
                              onClick={() =>
                                setSelectedImageIndex(
                                  selectedImageIndex > 0
                                    ? selectedImageIndex - 1
                                    : ad.images.length - 1
                                )
                              }
                              className="bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                              </svg>
                            </button>
                          </div>
                        )}
                        {ad.images.length > 1 && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <button
                              onClick={() =>
                                setSelectedImageIndex(
                                  selectedImageIndex < ad.images.length - 1
                                    ? selectedImageIndex + 1
                                    : 0
                                )
                              }
                              className="bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M5 12h14M12 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[3/4] bg-color-lightest flex items-center justify-center lg:max-w-md lg:mx-auto">
                    <div className="text-8xl">{getCategoryIcon(ad.category)}</div>
                  </div>
                )}
                {ad.images && ad.images.length > 1 && (
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {ad.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index
                            ? "border-color-medium"
                            : "border-transparent hover:border-color-light"
                        }`}
                      >
                        <img
                          src={getImageUrl(image)}
                          alt={`${ad.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Если миниатюра не загрузилась, показываем placeholder
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-full bg-color-lightest flex items-center justify-center text-2xl">📷</div>';
                            }
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </BlurFade>

            {/* Ad Info */}
            <BlurFade inView={true} delay={0.3} direction="up">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-6 sm:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{getCategoryIcon(ad.category)}</div>
                    <div>
                      <span className="inline-block px-3 py-1 bg-color-lightest text-color-medium text-sm font-medium rounded-full mb-2">
                        {ad.category}
                      </span>
                      <h1 className="text-2xl sm:text-3xl font-bold text-color-dark">
                        {ad.title}
                      </h1>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-color-medium mb-6 pb-6 border-b border-color-light">
                  <div className="flex items-center gap-2">
                    <svg
                      width="18"
                      height="18"
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
                  <div className="flex items-center gap-2">
                    <svg
                      width="18"
                      height="18"
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
                    <span>{formatDate(ad.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span>{ad.views} просмотров</span>
                  </div>
                </div>

                <div className="prose prose-lg max-w-none">
                  <h2 className="text-xl font-bold text-color-dark mb-4">Описание</h2>
                  <div
                    className="text-color-dark whitespace-pre-wrap prose-headings:text-color-dark prose-p:text-color-dark prose-strong:text-color-dark prose-ul:text-color-dark prose-ol:text-color-dark"
                    style={{
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                    dangerouslySetInnerHTML={{ __html: ad.description || "Описание отсутствует" }}
                  />
                </div>
              </div>
            </BlurFade>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Booking Widget */}
            {!isOwner && (
              <BookingWidget
                price={ad.price}
                adId={ad._id}
                bookings={bookings}
                onBookingSuccess={() => {
                  loadAd(); // Перезагружаем объявление для обновления бронирований
                }}
              />
            )}
            {/* Price Card */}
            <BlurFade inView={true} delay={0.4} direction="up">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-6 sticky top-24">
                <div className="text-3xl sm:text-4xl font-bold text-color-medium mb-6">
                  {ad.price}
                </div>

                {/* Edit Button (only for owner) */}
                {isOwner && (
                  <div className="mb-6">
                    <Link
                      href={`/ads/${ad._id}/edit`}
                      className="w-full bg-color-light text-color-dark px-4 py-3 rounded-lg font-semibold hover:bg-color-lightest hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 border border-color-light"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Редактировать
                    </Link>
                  </div>
                )}

                {/* Contact Buttons */}
                {!isOwner && (
                  <div className="space-y-3 mb-6">
                    <button
                      onClick={async () => {
                        const userId = localStorage.getItem("userId");
                        if (!userId) {
                          showToast("Необходима авторизация", "warning");
                          setTimeout(() => router.push("/login"), 500);
                          return;
                        }
                        setIsCreatingChat(true);
                        try {
                          // Получаем receiverId - может быть строкой или объектом с _id
                          let receiverId: string | undefined;
                          if (ad.userId) {
                            if (typeof ad.userId === 'string') {
                              receiverId = ad.userId;
                            } else if (ad.userId._id) {
                              receiverId = typeof ad.userId._id === 'string' 
                                ? ad.userId._id 
                                : String(ad.userId._id);
                            } else {
                              receiverId = String(ad.userId);
                            }
                          }
                          
                          if (!receiverId) {
                            showToast("Ошибка: не удалось определить получателя", "error");
                            setIsCreatingChat(false);
                            return;
                          }

                          console.log("Creating chat:", { userId, receiverId });

                          // Создаем или находим чат
                          const chatResponse = await fetch("/api/chats", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              userId,
                              receiverId,
                            }),
                          });

                          console.log("Chat response status:", chatResponse.status);

                          if (!chatResponse.ok) {
                            const errorText = await chatResponse.text();
                            console.error("Chat API error:", errorText);
                            let errorData;
                            try {
                              errorData = JSON.parse(errorText);
                            } catch {
                              errorData = { message: "Ошибка сервера" };
                            }
                            showToast("Ошибка при создании чата: " + (errorData.message || "Неизвестная ошибка"), "error");
                            setIsCreatingChat(false);
                            return;
                          }

                          const chatResult = await chatResponse.json();
                          console.log("Chat result:", chatResult);

                          if (chatResult.success) {
                            showToast("Чат открыт", "success");
                            // Открываем чат с информацией о товаре
                            router.push(`/chat?chatId=${chatResult.data.chatId}&adId=${ad._id}&adTitle=${encodeURIComponent(ad.title)}`);
                          } else {
                            showToast("Ошибка при создании чата: " + (chatResult.message || "Неизвестная ошибка"), "error");
                          }
                        } catch (error) {
                          console.error("Error creating chat:", error);
                          showToast("Ошибка при создании чата. Попробуйте позже.", "error");
                        } finally {
                          setIsCreatingChat(false);
                        }
                      }}
                      disabled={isCreatingChat}
                      className="w-full bg-color-medium text-white px-4 py-3 rounded-lg font-semibold hover:bg-color-dark hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingChat ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>Открытие чата...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                          Написать арендодателю
                        </>
                      )}
                    </button>
                    {ad.userId.phone && (
                    <a
                      href={`tel:${ad.userId.phone}`}
                      className="w-full bg-color-lightest text-color-dark px-4 py-3 rounded-lg font-semibold hover:bg-color-light hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 border border-color-light"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      Позвонить
                    </a>
                    )}
                  </div>
                )}

                {/* Seller Info */}
                <div className="pt-6 border-t border-color-light">
                  <Link
                    href={`/user/${ad.userId._id}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
                  >
                    <div className="w-12 h-12 rounded-full bg-color-light flex items-center justify-center text-2xl group-hover:bg-color-medium transition-colors">
                      {ad.userId.avatar ? (
                        <img
                          src={ad.userId.avatar}
                          alt={ad.userId.name}
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) parent.innerHTML = "👤";
                          }}
                        />
                      ) : (
                        "👤"
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-color-dark group-hover:text-color-medium transition-colors">
                        {ad.userId.name}
                      </p>
                      <p className="text-sm text-color-medium">Продавец</p>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-color-medium group-hover:text-color-dark transition-colors"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </BlurFade>
          </div>
        </div>
      </div>

      {/* Image Gallery Fullscreen */}
      {showGallery && ad.images && ad.images.length > 0 && (
        <ImageGallery
          images={ad.images}
          initialIndex={selectedImageIndex}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
}

