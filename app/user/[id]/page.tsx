"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  adId: {
    _id: string;
    title: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Обрабатываем params как Promise или обычный объект
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const id = resolvedParams.id;
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedAdId, setSelectedAdId] = useState<string>("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userResponse = await fetch(`/api/user/${id}`);
      const userResult = await userResponse.json();

      if (userResult.success) {
        setUser(userResult.data.user);
        const userAds = userResult.data.ads || [];
        setAds(userAds);

        // Загружаем отзывы на объявления пользователя
        if (userAds.length > 0) {
          const adIds = userAds.map((ad: Ad) => ad._id).join(",");
          const reviewsResponse = await fetch(`/api/reviews?adIds=${adIds}`);
          const reviewsResult = await reviewsResponse.json();

          if (reviewsResult.success) {
            setReviews(reviewsResult.data.reviews || []);
            setAverageRating(reviewsResult.data.averageRating || 0);
          }
        } else {
          setReviews([]);
          setAverageRating(0);
        }
      } else {
        setError(userResult.message || "Пользователь не найден");
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      setError("Ошибка при загрузке профиля пользователя");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdId || reviewComment.trim().length < 10) {
      setReviewError("Выберите объявление и напишите отзыв (минимум 10 символов)");
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.push("/login");
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          adId: selectedAdId,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Перезагружаем отзывы
        await loadUserProfile();
        setShowReviewForm(false);
        setReviewComment("");
        setSelectedAdId("");
        setReviewRating(5);
      } else {
        setReviewError(result.message || "Ошибка при создании отзыва");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      setReviewError("Ошибка при отправке отзыва");
    } finally {
      setReviewSubmitting(false);
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

        {/* Reviews Section */}
        <BlurFade inView={true} delay={0.3} direction="up">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-6 sm:p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-color-dark mb-2">
                  Отзывы {reviews.length > 0 && `(${reviews.length})`}
                </h2>
                {averageRating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="text-2xl">
                          {star <= Math.round(averageRating) ? "⭐" : "☆"}
                        </span>
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-color-dark">
                      {averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              {!isOwnProfile && ads.length > 0 && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-4 py-2 bg-color-medium text-white rounded-lg font-medium hover:bg-color-dark transition-colors"
                >
                  {showReviewForm ? "Отмена" : "Оставить отзыв"}
                </button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && !isOwnProfile && ads.length > 0 && (
              <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-color-lightest rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-color-dark mb-2">
                      Выберите объявление
                    </label>
                    <select
                      value={selectedAdId}
                      onChange={(e) => setSelectedAdId(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none"
                      required
                    >
                      <option value="">Выберите объявление</option>
                      {ads.map((ad) => (
                        <option key={ad._id} value={ad._id}>
                          {ad.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-color-dark mb-2">
                      Рейтинг
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="text-3xl transition-transform hover:scale-110"
                        >
                          {star <= reviewRating ? "⭐" : "☆"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-color-dark mb-2">
                      Комментарий
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                      minLength={10}
                      maxLength={500}
                      placeholder="Напишите ваш отзыв (минимум 10 символов)"
                      className="w-full px-4 py-2 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none resize-none"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {reviewComment.length}/500 символов
                    </p>
                  </div>
                  {reviewError && (
                    <div className="text-red-500 text-sm">{reviewError}</div>
                  )}
                  <button
                    type="submit"
                    disabled={reviewSubmitting || !selectedAdId || reviewComment.trim().length < 10}
                    className="w-full bg-color-medium text-white px-4 py-2 rounded-lg font-medium hover:bg-color-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reviewSubmitting ? "Отправка..." : "Отправить отзыв"}
                  </button>
                </div>
              </form>
            )}

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    className="p-4 bg-color-lightest rounded-lg border border-color-light"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-color-light flex items-center justify-center">
                          {review.userId.avatar ? (
                            <img
                              src={review.userId.avatar}
                              alt={review.userId.name}
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
                        <div>
                          <p className="font-semibold text-color-dark">{review.userId.name}</p>
                          <Link
                            href={`/ads/${review.adId._id || review.adId}`}
                            className="text-sm text-color-medium hover:text-color-dark transition-colors"
                          >
                            {typeof review.adId === "object" ? review.adId.title : "Объявление"}
                          </Link>
                        </div>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-lg">
                            {star <= review.rating ? "⭐" : "☆"}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-color-dark mt-2">{review.comment}</p>
                    <p className="text-xs text-color-medium mt-2">
                      {new Date(review.createdAt).toLocaleDateString("ru-RU", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-color-medium">Пока нет отзывов</p>
              </div>
            )}
          </div>
        </BlurFade>

        {/* User Ads */}
        <BlurFade inView={true} delay={0.4} direction="up">
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

