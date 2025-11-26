"use client";

import { useState, useEffect } from "react";
import { BlurFade } from "@/components/ui/blur-fade";
import BookingCalendar from "./BookingCalendar";
import { useToast } from "@/components/ui/toast";
import dynamic from "next/dynamic";

// Динамический импорт для избежания SSR проблем с Leaflet
const RouteMapDynamic = dynamic(() => import("./RouteMap"), {
  ssr: false,
});

interface BookingWidgetProps {
  price: string;
  adId: string;
  bookings?: Array<{
    startDate: string | Date;
    endDate: string | Date;
    status: string;
  }>;
  onBookingSuccess?: () => void;
  adLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
}

export default function BookingWidget({
  price,
  adId,
  bookings = [],
  onBookingSuccess,
  adLocation,
}: BookingWidgetProps) {
  const { showToast } = useToast();
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [periodType, setPeriodType] = useState<"hour" | "day" | "week" | "month">("day");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("18:00");
  const [isBooking, setIsBooking] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "courier">("pickup");
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [courierDistance, setCourierDistance] = useState<number | null>(null);

  // Парсим цену из строки "5000 ₸/день"
  const parsePrice = () => {
    const match = price.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const basePrice = parsePrice();

  // Получаем местоположение пользователя для расчета расстояния курьера
  useEffect(() => {
    if (deliveryMethod === "courier" && adLocation?.latitude && adLocation?.longitude) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;
            
            // Рассчитываем расстояние через OSRM
            try {
              const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${userLon},${userLat};${adLocation.longitude},${adLocation.latitude}?overview=false`
              );
              const data = await response.json();
              if (data.code === "Ok" && data.routes && data.routes.length > 0) {
                // Расстояние в километрах
                const distanceKm = data.routes[0].distance / 1000;
                setCourierDistance(distanceKm);
              }
            } catch (error) {
              console.error("Error calculating distance:", error);
              // Fallback: используем формулу гаверсинуса для приблизительного расчета
              if (adLocation.latitude !== undefined && adLocation.longitude !== undefined) {
                const R = 6371; // Радиус Земли в км
                const dLat = ((adLocation.latitude - userLat) * Math.PI) / 180;
                const dLon = ((adLocation.longitude - userLon) * Math.PI) / 180;
                const a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos((userLat * Math.PI) / 180) *
                    Math.cos((adLocation.latitude * Math.PI) / 180) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distanceKm = R * c;
                setCourierDistance(distanceKm);
              }
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
            setCourierDistance(null);
          }
        );
      }
    } else {
      setCourierDistance(null);
    }
  }, [deliveryMethod, adLocation]);

  // Вычисляем стоимость
  const calculatePrice = (): number => {
    if (!selectedStartDate || !selectedEndDate) return 0;

    let periodCount = 0;

    if (periodType === "hour") {
      const start = new Date(selectedStartDate);
      const end = new Date(selectedEndDate);
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);
      start.setHours(startHour, startMin, 0, 0);
      end.setHours(endHour, endMin, 0, 0);
      const diffMs = end.getTime() - start.getTime();
      periodCount = Math.ceil(diffMs / (1000 * 60 * 60));
    } else if (periodType === "day") {
      const diffTime = selectedEndDate.getTime() - selectedStartDate.getTime();
      periodCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } else if (periodType === "week") {
      const diffTime = selectedEndDate.getTime() - selectedStartDate.getTime();
      periodCount = Math.ceil((diffTime / (1000 * 60 * 60 * 24) + 1) / 7);
    } else if (periodType === "month") {
      const start = new Date(selectedStartDate);
      const end = new Date(selectedEndDate);
      periodCount =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) +
        1;
    }

    const rentalPrice = basePrice * periodCount;
    
    // Добавляем стоимость курьера (150тг за километр)
    const courierPrice = deliveryMethod === "courier" && courierDistance !== null
      ? Math.ceil(courierDistance * 150)
      : 0;

    return rentalPrice + courierPrice;
  };

  const totalPrice = calculatePrice();
  const rentalPrice = basePrice * (() => {
    if (!selectedStartDate || !selectedEndDate) return 0;
    if (periodType === "hour") {
      const start = new Date(selectedStartDate);
      const end = new Date(selectedEndDate);
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);
      start.setHours(startHour, startMin, 0, 0);
      end.setHours(endHour, endMin, 0, 0);
      const diffMs = end.getTime() - start.getTime();
      return Math.ceil(diffMs / (1000 * 60 * 60));
    } else if (periodType === "day") {
      const diffTime = selectedEndDate.getTime() - selectedStartDate.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } else if (periodType === "week") {
      const diffTime = selectedEndDate.getTime() - selectedStartDate.getTime();
      return Math.ceil((diffTime / (1000 * 60 * 60 * 24) + 1) / 7);
    } else {
      const start = new Date(selectedStartDate);
      const end = new Date(selectedEndDate);
      return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    }
  })();
  const courierPrice = deliveryMethod === "courier" && courierDistance !== null
    ? Math.ceil(courierDistance * 150)
    : 0;

  const handleDateSelect = (start: Date, end: Date) => {
    setSelectedStartDate(start);
    setSelectedEndDate(end);
  };

  const handleBooking = async () => {
    if (!selectedStartDate || !selectedEndDate) {
      showToast("Выберите даты бронирования", "warning");
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      showToast("Необходима авторизация", "warning");
      return;
    }

    setIsBooking(true);
    try {
      const startDateTime = new Date(selectedStartDate);
      const endDateTime = new Date(selectedEndDate);

      if (periodType === "hour") {
        const [startHour, startMin] = startTime.split(":").map(Number);
        const [endHour, endMin] = endTime.split(":").map(Number);
        startDateTime.setHours(startHour, startMin, 0, 0);
        endDateTime.setHours(endHour, endMin, 0, 0);
      }

      const response = await fetch(`/api/ads/${adId}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          startTime: periodType === "hour" ? startDateTime.toISOString() : null,
          endTime: periodType === "hour" ? endDateTime.toISOString() : null,
          periodType,
          totalPrice,
          deliveryMethod,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || "Ошибка при создании бронирования" };
        }
        throw new Error(errorData.message || "Ошибка при создании бронирования");
      }

      const result = await response.json();

      if (result.success) {
        showToast("Бронирование успешно создано!", "success");
        setSelectedStartDate(null);
        setSelectedEndDate(null);
        setShowRouteMap(false);
        onBookingSuccess?.();
        // Перенаправляем на страницу детального бронирования
        if (result.data?.bookingId) {
          window.location.href = `/bookings/${result.data.bookingId}`;
        }
      } else {
        const errorMessage = result.message || result.errors?.map((e: { message: string }) => e.message).join(", ") || "Ошибка при создании бронирования";
        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      const errorMessage = error instanceof Error ? error.message : "Ошибка при создании бронирования";
      showToast(errorMessage, "error");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <BlurFade inView={true} delay={0.4} direction="up">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-4 sm:p-6 space-y-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-color-dark mb-2">
            {basePrice} ₸ / {periodType === "hour" ? "час" : periodType === "day" ? "день" : periodType === "week" ? "неделя" : "месяц"}
          </h3>
          <p className="text-sm text-color-medium">Выберите период аренды</p>
        </div>

        {/* Period type selector */}
        <div>
          <label className="block text-sm font-medium text-color-dark mb-2">
            Период аренды
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["hour", "day", "week", "month"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setPeriodType(type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  periodType === type
                    ? "bg-color-medium text-white"
                    : "bg-color-lightest text-color-dark hover:bg-color-light"
                }`}
              >
                {type === "hour"
                  ? "Час"
                  : type === "day"
                  ? "День"
                  : type === "week"
                  ? "Неделя"
                  : "Месяц"}
              </button>
            ))}
          </div>
        </div>

        {/* Time selector for hours */}
        {periodType === "hour" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-color-dark mb-2">
                Время начала
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-color-dark mb-2">
                Время окончания
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-color-light focus:border-color-medium focus:ring-2 focus:ring-color-medium/20 outline-none"
              />
            </div>
          </div>
        )}

        {/* Calendar */}
        <BookingCalendar
          bookings={bookings}
          onDateSelect={handleDateSelect}
          selectedStartDate={selectedStartDate}
          selectedEndDate={selectedEndDate}
        />

        {/* Delivery method selector */}
        {selectedStartDate && selectedEndDate && (
          <div>
            <label className="block text-sm font-medium text-color-dark mb-2">
              Способ получения
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  deliveryMethod === "pickup"
                    ? "bg-color-medium text-white"
                    : "bg-color-lightest text-color-dark hover:bg-color-light"
                }`}
              >
                Самовывоз
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod("courier")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  deliveryMethod === "courier"
                    ? "bg-color-medium text-white"
                    : "bg-color-lightest text-color-dark hover:bg-color-light"
                }`}
              >
                Курьер от Auen
              </button>
            </div>
          </div>
        )}

        {/* Route Map */}
        {showRouteMap && selectedStartDate && selectedEndDate && adLocation?.latitude && adLocation?.longitude && (
          <div className="border-t border-color-light pt-4">
            <RouteMapDynamic
              destination={{
                latitude: adLocation.latitude,
                longitude: adLocation.longitude,
                address: adLocation.address,
              }}
              deliveryMethod={deliveryMethod}
            />
          </div>
        )}

        {/* Price calculation */}
        {selectedStartDate && selectedEndDate && (
          <div className="border-t border-color-light pt-4 space-y-2">
            <div className="flex justify-between text-sm text-color-medium">
              <span>
                {periodType === "hour"
                  ? "Часов"
                  : periodType === "day"
                  ? "Дней"
                  : periodType === "week"
                  ? "Недель"
                  : "Месяцев"}
                :
              </span>
              <span>
                {periodType === "hour"
                  ? Math.ceil(
                      (selectedEndDate.getTime() - selectedStartDate.getTime()) /
                        (1000 * 60 * 60)
                    )
                  : periodType === "day"
                  ? Math.ceil(
                      (selectedEndDate.getTime() - selectedStartDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) + 1
                  : periodType === "week"
                  ? Math.ceil(
                      ((selectedEndDate.getTime() - selectedStartDate.getTime()) /
                        (1000 * 60 * 60 * 24) +
                        1) /
                        7
                    )
                  : Math.ceil(
                      ((selectedEndDate.getFullYear() -
                        selectedStartDate.getFullYear()) *
                        12 +
                        (selectedEndDate.getMonth() - selectedStartDate.getMonth()) +
                        1)
                    )}
              </span>
            </div>
            <div className="flex justify-between text-sm text-color-medium">
              <span>Аренда:</span>
              <span>{rentalPrice.toLocaleString()} ₸</span>
            </div>
            {deliveryMethod === "courier" && courierDistance !== null && (
              <div className="flex justify-between text-sm text-color-medium">
                <span>Доставка курьером ({courierDistance.toFixed(1)} км × 150₸):</span>
                <span>{courierPrice.toLocaleString()} ₸</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-color-dark pt-2 border-t border-color-light">
              <span>Итого:</span>
              <span>{totalPrice.toLocaleString()} ₸</span>
            </div>
          </div>
        )}

        {/* Book button */}
        <div className="space-y-2">
          {selectedStartDate && selectedEndDate && adLocation?.latitude && adLocation?.longitude && (
            <button
              type="button"
              onClick={() => setShowRouteMap(!showRouteMap)}
              className="w-full bg-color-lightest text-color-dark py-2 rounded-lg font-medium hover:bg-color-light transition-all border border-color-light flex items-center justify-center gap-2"
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
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              {showRouteMap ? "Скрыть карту" : "Показать маршрут"}
            </button>
          )}
          <button
            onClick={handleBooking}
            disabled={!selectedStartDate || !selectedEndDate || isBooking}
            className="w-full bg-color-medium text-white py-3 sm:py-4 rounded-lg font-semibold hover:bg-color-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isBooking ? "Бронируем..." : "Забронировать"}
          </button>
        </div>
      </div>
    </BlurFade>
  );
}

