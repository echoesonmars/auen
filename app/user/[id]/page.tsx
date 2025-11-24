"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";
import { useMetadata } from "@/app/hooks/useMetadata";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

interface Ad {
  _id: string;
  title: string;
  category: string;
  price: string;
  location: string;
  images: string[];
  views: number;
  createdAt: string;
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Обрабатываем params как Promise или обычный объект
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const id = resolvedParams.id;
  const [user, setUser] = useState<User | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, [id]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/${id}`);
      const result = await response.json();

      if (result.success) {
        setUser(result.data.user);
        setAds(result.data.ads || []);
      } else {
        setError(result.message || "Пользователь не найден");
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      setError("Ошибка при загрузке профиля пользователя");
    } finally {
      setLoading(false);
    }
  };

  useMetadata(
    user ? `Профиль ${user.name} | Auen` : "Профиль пользователя | Auen",
    user ? `Просмотр профиля пользователя ${user.name}. Все объявления пользователя на платформе Auen.` : "Просмотр профиля пользователя"
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

  if (error || !user) {
    return (
      <div className="min-h-screen bg-color-lightest flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-color-dark mb-4">
            {error || "Пользователь не найден"}
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

  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const isOwnProfile = currentUserId === user._id;

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
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-color-dark mb-8"
          >
            Профиль пользователя
          </TextAnimate>
        </BlurFade>

        {/* User Info */}
        <BlurFade inView={true} delay={0.2} direction="up">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-color-light flex items-center justify-center text-5xl sm:text-6xl">
                👤
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-color-dark mb-2">
                  {user.name}
                </h2>
                {user.phone && (
                  <p className="text-color-medium mb-1">📞 {user.phone}</p>
                )}
                <p className="text-color-medium mb-1">📧 {user.email}</p>
                <p className="text-sm text-color-medium">
                  На платформе с {new Date(user.createdAt).toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
              {isOwnProfile && (
                <Link
                  href="/profile"
                  className="px-4 py-2 bg-color-medium text-white rounded-lg font-medium hover:bg-color-dark transition-colors"
                >
                  Редактировать профиль
                </Link>
              )}
              {!isOwnProfile && (
                <Link
                  href={`/chat?userId=${user._id}`}
                  className="px-4 py-2 bg-color-medium text-white rounded-lg font-medium hover:bg-color-dark transition-colors flex items-center gap-2"
                >
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
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Написать сообщение
                </Link>
              )}
            </div>
          </div>
        </BlurFade>

        {/* User Ads */}
        <BlurFade inView={true} delay={0.3} direction="up">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-color-dark mb-6">
              Объявления пользователя ({ads.length})
            </h2>
            {ads.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {ads.map((ad, index) => (
                  <BlurFade key={ad._id} inView={true} delay={0.05 * index} direction="up">
                    <Link
                      href={`/ads/${ad._id}`}
                      className="bg-white rounded-xl shadow-lg border border-color-light overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex flex-col h-full"
                    >
                      <div className="aspect-video bg-color-lightest flex items-center justify-center">
                        {ad.images && ad.images.length > 0 ? (
                          <img
                            src={ad.images[0]}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-6xl">{getCategoryIcon(ad.category)}</div>
                        )}
                      </div>
                      <div className="p-4 sm:p-6 flex-1 flex flex-col">
                        <h3 className="text-lg sm:text-xl font-bold text-color-dark mb-2 line-clamp-2">
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
                        <div className="mt-auto flex items-center justify-between">
                          <span className="text-xl font-bold text-color-medium">
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
              <div className="bg-white rounded-xl shadow-lg border border-color-light p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-color-medium text-lg mb-4">
                  У пользователя пока нет объявлений
                </p>
              </div>
            )}
          </div>
        </BlurFade>
      </div>
    </div>
  );
}

