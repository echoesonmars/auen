"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";
import { useMetadata } from "@/app/hooks/useMetadata";
import { getImageUrl } from "@/lib/utils";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  instagram?: string;
  telegram?: string;
  vk?: string;
  youtube?: string;
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
  updatedAt?: string;
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
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingRating, setEditingRating] = useState(5);
  const [editingComment, setEditingComment] = useState("");

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
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-color-light flex items-center justify-center text-5xl sm:text-6xl overflow-hidden border-4 border-white shadow-lg">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
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
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-color-dark mb-2">
                  {user.name}
                </h2>
                {user.phone && (
                  <p className="text-color-medium mb-1">📞 {user.phone}</p>
                )}
                <p className="text-color-medium mb-1">📧 {user.email}</p>
                {user.bio && (
                  <p className="text-color-medium mb-3 mt-2 text-sm">{user.bio}</p>
                )}
                {/* Social Links */}
                {(user.website || user.instagram || user.telegram || user.vk || user.youtube) && (
                  <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start">
                    {user.website && (
                      <a
                        href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-color-lightest hover:bg-color-light transition-colors text-sm text-color-dark"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                        Сайт
                      </a>
                    )}
                    {user.instagram && (
                      <a
                        href={`https://instagram.com/${user.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-colors text-sm text-white"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="white"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="white" strokeWidth="2"></line>
                        </svg>
                        Instagram
                      </a>
                    )}
                    {user.telegram && (
                      <a
                        href={`https://t.me/${user.telegram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors text-sm text-white"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.169 0-.315.06-.45.151l-1.718 1.403-1.403 2.315c-.06.113-.113.225-.113.338 0 .151.075.302.188.377l1.5 1.125c.075.075.188.113.301.113.075 0 .15-.038.225-.075l2.25-.75c.113-.038.188-.15.188-.263l.375-2.25c.038-.113-.038-.225-.15-.263l-1.875-.75c-.038 0-.113-.038-.188-.038zm-5.25 3.375l-1.875 3.188c-.038.075-.113.113-.188.113-.075 0-.15-.038-.188-.113l-1.875-3.188c-.038-.075-.038-.15 0-.225l1.875-3.188c.038-.075.113-.113.188-.113.075 0 .15.038.188.113l1.875 3.188c.038.075.038.15 0 .225z"></path>
                        </svg>
                        Telegram
                      </a>
                    )}
                    {user.vk && (
                      <a
                        href={`https://vk.com/${user.vk}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-sm text-white"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.785 16.241s.287-.029.434-.174c.135-.135.131-.388.131-.388s-.02-1.126.577-1.292c.591-.17 1.35.895 2.152 1.29.604.295 1.062.23 1.062.23l2.15-.03s1.123-.072.59-.956c-.044-.072-.308-.64-1.583-1.81-1.339-1.24-1.16-1.04.453-3.188.984-1.31 1.377-2.11 1.253-2.451-.117-.32-.84-.235-.84-.235l-2.405.015s-.178-.025-.31.055c-.13.077-.214.257-.214.257s-.385 1.02-.897 1.889c-1.082 1.699-1.515 1.79-1.692 1.685-.41-.247-.308-1.001-.308-1.533 0-1.667.25-2.36-.49-2.54-.246-.06-.427-.1-1.057-.106-.81-.008-1.496.003-1.884.166-.259.11-.458.355-.337.369.15.018.49.028.67.46.23.55.226 1.78.226 1.78s.135 1.98-1.57 2.226c-.31.044-.54.08-.68.163-.35.21-.247.68-.247 1.19 0 1.36.404 1.58.404 1.58s.15.09.15.27c0 .28-.15.35-.15.35s-.15.09-.15.27c0 .28.15.35.15.35s.15.09.15.27c0 .28-.15.35-.15.35z"></path>
                        </svg>
                        VK
                      </a>
                    )}
                    {user.youtube && (
                      <a
                        href={`https://youtube.com/@${user.youtube}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-sm text-white"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path>
                        </svg>
                        YouTube
                      </a>
                    )}
                  </div>
                )}
                <p className="text-sm text-color-medium mt-3">
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
                <button
                  onClick={async () => {
                    const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
                    if (!currentUserId) {
                      router.push(`/login?redirect=/chat?userId=${user._id}`);
                      return;
                    }
                    // Переходим в чат, чат создастся автоматически
                    router.push(`/chat?userId=${user._id}`);
                  }}
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
                </button>
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
                {reviews.map((review) => {
                  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
                  const isReviewOwner = currentUserId === review.userId._id;
                  const isEditing = editingReviewId === review._id;

                  return (
                    <div
                      key={review._id}
                      className="p-4 bg-color-lightest rounded-lg border border-color-light"
                    >
                      {isEditing ? (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (editingComment.trim().length < 10) {
                              setReviewError("Отзыв должен содержать минимум 10 символов");
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
                              const response = await fetch(`/api/reviews/${review._id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  userId,
                                  rating: editingRating,
                                  comment: editingComment.trim(),
                                }),
                              });

                              const result = await response.json();

                              if (result.success) {
                                await loadUserProfile();
                                setEditingReviewId(null);
                                setEditingComment("");
                                setEditingRating(5);
                              } else {
                                setReviewError(result.message || "Ошибка при обновлении отзыва");
                              }
                            } catch (error) {
                              console.error("Error updating review:", error);
                              setReviewError("Ошибка при обновлении отзыва");
                            } finally {
                              setReviewSubmitting(false);
                            }
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-sm font-medium text-color-dark mb-2">
                              Рейтинг
                            </label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setEditingRating(star)}
                                  className="text-2xl transition-transform hover:scale-110"
                                >
                                  {star <= editingRating ? "⭐" : "☆"}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-color-dark mb-2">
                              Комментарий
                            </label>
                            <textarea
                              value={editingComment}
                              onChange={(e) => setEditingComment(e.target.value)}
                              rows={4}
                              minLength={10}
                              maxLength={500}
                              placeholder="Напишите ваш отзыв (минимум 10 символов)"
                              className="w-full px-4 py-2 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none resize-none"
                              required
                            />
                            <p className="text-xs text-color-medium mt-1">
                              {editingComment.length}/500 символов
                            </p>
                          </div>
                          {reviewError && (
                            <div className="text-red-500 text-sm">{reviewError}</div>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={reviewSubmitting || editingComment.trim().length < 10}
                              className="px-4 py-2 bg-color-medium text-white rounded-lg font-medium hover:bg-color-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {reviewSubmitting ? "Сохранение..." : "Сохранить"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingReviewId(null);
                                setEditingComment("");
                                setEditingRating(5);
                                setReviewError(null);
                              }}
                              className="px-4 py-2 bg-color-light text-color-dark rounded-lg font-medium hover:bg-color-lightest transition-colors"
                            >
                              Отмена
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
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
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span key={star} className="text-lg">
                                    {star <= review.rating ? "⭐" : "☆"}
                                  </span>
                                ))}
                              </div>
                              {isReviewOwner && (
                                <div className="flex gap-1 ml-2">
                                  <button
                                    onClick={() => {
                                      setEditingReviewId(review._id);
                                      setEditingRating(review.rating);
                                      setEditingComment(review.comment);
                                      setReviewError(null);
                                    }}
                                    className="p-1.5 rounded hover:bg-color-light transition-colors"
                                    title="Редактировать отзыв"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="text-color-medium"
                                    >
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm("Вы уверены, что хотите удалить этот отзыв?")) {
                                        return;
                                      }

                                      const userId = localStorage.getItem("userId");
                                      if (!userId) {
                                        router.push("/login");
                                        return;
                                      }

                                      try {
                                        const response = await fetch(`/api/reviews/${review._id}?userId=${userId}`, {
                                          method: "DELETE",
                                        });

                                        const result = await response.json();

                                        if (result.success) {
                                          await loadUserProfile();
                                        } else {
                                          alert(result.message || "Ошибка при удалении отзыва");
                                        }
                                      } catch (error) {
                                        console.error("Error deleting review:", error);
                                        alert("Ошибка при удалении отзыва");
                                      }
                                    }}
                                    className="p-1.5 rounded hover:bg-red-50 transition-colors"
                                    title="Удалить отзыв"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="text-red-600"
                                    >
                                      <polyline points="3 6 5 6 21 6"></polyline>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-color-dark mt-2">{review.comment}</p>
                          <p className="text-xs text-color-medium mt-2">
                            {new Date(review.createdAt).toLocaleDateString("ru-RU", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                            {review.updatedAt && review.updatedAt !== review.createdAt && (
                              <span className="ml-2">(отредактировано)</span>
                            )}
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}
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
                {ads.map((ad) => (
                  <a
                    key={ad._id}
                    href={`/ads/${ad._id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="bg-white rounded-xl shadow-lg border border-color-light overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex flex-col h-full cursor-pointer"
                  >
                      <div className="aspect-video bg-color-lightest flex items-center justify-center">
                        {ad.images && ad.images.length > 0 ? (
                          <img
                            src={getImageUrl(ad.images[0])}
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
                    </a>
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


