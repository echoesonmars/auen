"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { BlurFade } from "@/components/ui/blur-fade";
import { useToast } from "@/components/ui/toast";
import { getImageUrl } from "@/lib/utils";

interface Booking {
  _id: string;
  adId: {
    _id: string;
    title: string;
    images: string[];
    price: string;
    location: string;
  };
  renterId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  period: 'hour' | 'day' | 'week' | 'month';
  price: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const id = resolvedParams.id;
  
  const router = useRouter();
  const { showToast } = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      loadBooking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      if (!userId) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/bookings/${id}?userId=${userId}`);
      const result = await response.json();

      if (result.success) {
        setBooking(result.data);
        // Проверяем, является ли пользователь владельцем объявления
        const adOwnerId = result.data.adId?.userId?._id?.toString() || result.data.adId?.userId?.toString();
        setIsOwner(userId === adOwnerId);
      } else {
        setError(result.message || "Бронирование не найдено");
      }
    } catch (error) {
      console.error("Error loading booking:", error);
      setError("Ошибка при загрузке бронирования");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'approved' | 'rejected' | 'cancelled') => {
    if (!booking) return;

    setIsUpdating(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(
          newStatus === 'approved' ? "Бронирование одобрено" :
          newStatus === 'rejected' ? "Бронирование отклонено" :
          "Бронирование отменено",
          "success"
        );
        loadBooking();
      } else {
        showToast(result.message || "Ошибка при обновлении статуса", "error");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      showToast("Ошибка при обновлении статуса", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Одобрено';
      case 'rejected':
        return 'Отклонено';
      case 'cancelled':
        return 'Отменено';
      default:
        return 'Ожидает подтверждения';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-color-lightest pt-20 pb-10">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-color-medium border-t-transparent"></div>
            <p className="mt-4 text-color-medium">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-color-lightest pt-20 pb-10">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <BlurFade inView={true} delay={0.1} direction="up">
            <div className="bg-white rounded-2xl border border-color-light p-12 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-color-dark mb-2">Ошибка</h3>
              <p className="text-color-medium mb-4">{error || "Бронирование не найдено"}</p>
              <Link
                href="/profile"
                className="inline-block bg-color-medium text-white px-6 py-3 rounded-xl font-semibold hover:bg-color-dark hover:shadow-lg transition-all duration-200"
              >
                Вернуться в профиль
              </Link>
            </div>
          </BlurFade>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-color-lightest pt-20 pb-10">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <BlurFade inView={true} delay={0.1} direction="up">
          <div className="mb-6">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 text-color-medium hover:text-color-dark transition-colors mb-4"
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
              Назад к профилю
            </Link>
            <h1 className="text-3xl font-bold text-color-dark">Детали бронирования</h1>
          </div>
        </BlurFade>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Info */}
            <BlurFade inView={true} delay={0.2} direction="up">
              <div className="bg-white rounded-2xl border border-color-light p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-color-dark">Информация о бронировании</h2>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-color-medium mb-1">Период аренды</p>
                    <p className="text-lg font-semibold text-color-dark">
                      {booking.period === 'hour' ? 'Почасово' :
                       booking.period === 'day' ? 'По дням' :
                       booking.period === 'week' ? 'По неделям' :
                       'По месяцам'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-color-medium mb-1">Дата начала</p>
                      <p className="text-lg font-semibold text-color-dark">{formatDate(booking.startDate)}</p>
                      {booking.startTime && (
                        <p className="text-sm text-color-medium">{formatTime(booking.startTime)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-color-medium mb-1">Дата окончания</p>
                      <p className="text-lg font-semibold text-color-dark">{formatDate(booking.endDate)}</p>
                      {booking.endTime && (
                        <p className="text-sm text-color-medium">{formatTime(booking.endTime)}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-color-medium mb-1">Стоимость</p>
                    <p className="text-2xl font-bold text-color-medium">{booking.price.toLocaleString()} ₸</p>
                  </div>

                  <div>
                    <p className="text-sm text-color-medium mb-1">Создано</p>
                    <p className="text-color-dark">{formatDate(booking.createdAt)}</p>
                  </div>
                </div>
              </div>
            </BlurFade>

            {/* Ad Info */}
            <BlurFade inView={true} delay={0.3} direction="up">
              <div className="bg-white rounded-2xl border border-color-light p-6">
                <h2 className="text-2xl font-bold text-color-dark mb-4">Объявление</h2>
                <Link
                  href={`/ads/${booking.adId._id}`}
                  className="block hover:opacity-80 transition-opacity"
                >
                  <div className="flex gap-4">
                    {booking.adId.images && booking.adId.images.length > 0 ? (
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-color-lightest flex-shrink-0">
                        <img
                          src={getImageUrl(booking.adId.images[0])}
                          alt={booking.adId.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-color-lightest flex items-center justify-center text-3xl flex-shrink-0">
                        🎵
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-color-dark mb-1 line-clamp-2">
                        {booking.adId.title}
                      </h3>
                      <p className="text-sm text-color-medium mb-1">{booking.adId.location}</p>
                      <p className="text-lg font-semibold text-color-medium">{booking.adId.price}</p>
                    </div>
                  </div>
                </Link>
              </div>
            </BlurFade>

            {/* User Info */}
            <BlurFade inView={true} delay={0.4} direction="up">
              <div className="bg-white rounded-2xl border border-color-light p-6">
                <h2 className="text-2xl font-bold text-color-dark mb-4">
                  {isOwner ? "Арендатор" : "Владелец"}
                </h2>
                <div className="space-y-2">
                  <p className="text-color-dark">
                    <span className="font-semibold">Имя:</span> {booking.renterId.name}
                  </p>
                  <p className="text-color-dark">
                    <span className="font-semibold">Email:</span> {booking.renterId.email}
                  </p>
                  {booking.renterId.phone && (
                    <p className="text-color-dark">
                      <span className="font-semibold">Телефон:</span> {booking.renterId.phone}
                    </p>
                  )}
                </div>
              </div>
            </BlurFade>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <BlurFade inView={true} delay={0.3} direction="up">
              <div className="bg-white rounded-2xl border border-color-light p-6 sticky top-24">
                {isOwner && booking.status === 'pending' && (
                  <div className="space-y-3 mb-6">
                    <button
                      onClick={() => handleStatusUpdate('approved')}
                      disabled={isUpdating}
                      className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Одобрить
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('rejected')}
                      disabled={isUpdating}
                      className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Отклонить
                    </button>
                  </div>
                )}

                {!isOwner && booking.status === 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={isUpdating}
                    className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                  >
                    Отменить бронирование
                  </button>
                )}

                <Link
                  href={`/ads/${booking.adId._id}`}
                  className="block w-full bg-color-medium text-white py-3 rounded-lg font-semibold hover:bg-color-dark transition-all text-center"
                >
                  Посмотреть объявление
                </Link>
              </div>
            </BlurFade>
          </div>
        </div>
      </div>
    </div>
  );
}

