"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BlurFade } from "@/components/ui/blur-fade";
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
  } | null | undefined;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  period: 'hour' | 'day' | 'week' | 'month';
  price?: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  type: 'as-owner' | 'as-renter';
}

export default function BookingsTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "as-owner" | "as-renter">("all");

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/bookings?userId=${userId}&type=${filter}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      if (result.success) {
        // Убеждаемся, что renterId всегда имеет правильную структуру и price существует
        const processedBookings = (result.data || []).map((booking: Booking) => ({
          ...booking,
          renterId: booking.renterId || { _id: "", name: "Неизвестно", email: "" },
          price: booking.price || 0,
        }));
        setBookings(processedBookings);
      } else {
        console.error("Error loading bookings:", result.message);
        setBookings([]);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
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

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    return booking.type === filter;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center items-center space-x-2">
          <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-color-medium rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="mt-4 text-color-medium">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === "all"
              ? "bg-color-medium text-white"
              : "bg-color-lightest text-color-dark hover:bg-color-light"
          }`}
        >
          Все
        </button>
        <button
          onClick={() => setFilter("as-renter")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === "as-renter"
              ? "bg-color-medium text-white"
              : "bg-color-lightest text-color-dark hover:bg-color-light"
          }`}
        >
          Мои бронирования
        </button>
        <button
          onClick={() => setFilter("as-owner")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === "as-owner"
              ? "bg-color-medium text-white"
              : "bg-color-lightest text-color-dark hover:bg-color-light"
          }`}
        >
          Бронирования моих объявлений
        </button>
      </div>

      {/* Bookings list */}
      {filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((booking, index) => (
            <BlurFade key={booking._id} inView={true} delay={0.1 * index} direction="up">
              <Link
                href={`/bookings/${booking._id}`}
                className="block bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-6 hover:shadow-xl transition-all"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Image */}
                  <div className="w-full sm:w-32 h-32 rounded-lg overflow-hidden bg-color-lightest flex-shrink-0">
                    {booking.adId.images && booking.adId.images.length > 0 ? (
                      <img
                        src={getImageUrl(booking.adId.images[0])}
                        alt={booking.adId.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🎵
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-color-dark line-clamp-2">
                        {booking.adId.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                    <p className="text-sm text-color-medium mb-2">{booking.adId.location}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-color-medium mb-2">
                      <span>
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </span>
                      {booking.startTime && booking.endTime && (
                        <span>
                          {new Date(booking.startTime).toLocaleTimeString("ru-RU", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })} - {new Date(booking.endTime).toLocaleTimeString("ru-RU", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-color-medium">
                        {booking.price ? booking.price.toLocaleString() : "0"} ₸
                      </span>
                      <span className="text-sm text-color-medium">
                        {booking.type === "as-owner" ? "Арендатор" : "Владелец"}: {booking.renterId?.name || "Неизвестно"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </BlurFade>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-color-medium text-lg mb-4">
            {filter === "all"
              ? "У вас пока нет бронирований"
              : filter === "as-renter"
              ? "Вы еще не бронировали ничего"
              : "На ваши объявления еще не было бронирований"}
          </p>
        </div>
      )}
    </div>
  );
}

