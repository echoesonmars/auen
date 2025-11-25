"use client";

import { useState } from "react";
import { BlurFade } from "@/components/ui/blur-fade";
import BookingCalendar from "./BookingCalendar";
import { useToast } from "@/components/ui/toast";

interface BookingWidgetProps {
  price: string;
  adId: string;
  bookings?: Array<{
    startDate: string | Date;
    endDate: string | Date;
    status: string;
  }>;
  onBookingSuccess?: () => void;
}

export default function BookingWidget({
  price,
  adId,
  bookings = [],
  onBookingSuccess,
}: BookingWidgetProps) {
  const { showToast } = useToast();
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [periodType, setPeriodType] = useState<"hour" | "day" | "week" | "month">("day");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("18:00");
  const [isBooking, setIsBooking] = useState(false);

  // Парсим цену из строки "5000 ₸/день"
  const parsePrice = () => {
    const match = price.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const basePrice = parsePrice();

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

    return basePrice * periodCount;
  };

  const totalPrice = calculatePrice();

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
          startTime: periodType === "hour" ? startDateTime.toISOString() : undefined,
          endTime: periodType === "hour" ? endDateTime.toISOString() : undefined,
          periodType,
          totalPrice,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast("Бронирование успешно создано!", "success");
        setSelectedStartDate(null);
        setSelectedEndDate(null);
        onBookingSuccess?.();
        // Перенаправляем на страницу детального бронирования
        if (result.data?.bookingId) {
          window.location.href = `/bookings/${result.data.bookingId}`;
        }
      } else {
        showToast(result.message || "Ошибка при создании бронирования", "error");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      showToast("Ошибка при создании бронирования", "error");
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
            <div className="flex justify-between text-lg font-bold text-color-dark">
              <span>Итого:</span>
              <span>{totalPrice.toLocaleString()} ₸</span>
            </div>
          </div>
        )}

        {/* Book button */}
        <button
          onClick={handleBooking}
          disabled={!selectedStartDate || !selectedEndDate || isBooking}
          className="w-full bg-color-medium text-white py-3 sm:py-4 rounded-lg font-semibold hover:bg-color-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          {isBooking ? "Бронируем..." : "Забронировать"}
        </button>
      </div>
    </BlurFade>
  );
}

