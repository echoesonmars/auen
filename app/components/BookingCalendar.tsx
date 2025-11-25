"use client";

import { useState } from "react";
import { BlurFade } from "@/components/ui/blur-fade";

interface BookingCalendarProps {
  bookings?: Array<{
    startDate: string | Date;
    endDate: string | Date;
    status: string;
  }>;
  onDateSelect?: (startDate: Date, endDate: Date) => void;
  selectedStartDate?: Date | null;
  selectedEndDate?: Date | null;
}

export default function BookingCalendar({
  bookings = [],
  onDateSelect,
  selectedStartDate,
  selectedEndDate,
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isDateBooked = (date: Date): boolean => {
    const dateStr = date.toISOString().split("T")[0];
    return bookings.some((booking) => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const bookingStartStr = start.toISOString().split("T")[0];
      const bookingEndStr = end.toISOString().split("T")[0];
      return (
        dateStr >= bookingStartStr &&
        dateStr <= bookingEndStr &&
        booking.status !== "cancelled"
      );
    });
  };

  const isDateSelected = (date: Date): boolean => {
    if (!selectedStartDate && !selectedEndDate) return false;
    const dateStr = date.toISOString().split("T")[0];
    if (selectedStartDate) {
      const startStr = selectedStartDate.toISOString().split("T")[0];
      if (dateStr === startStr) return true;
    }
    if (selectedEndDate) {
      const endStr = selectedEndDate.toISOString().split("T")[0];
      if (dateStr === endStr) return true;
    }
    return false;
  };

  const isDateInRange = (date: Date): boolean => {
    if (!selectedStartDate || !selectedEndDate) {
      if (selectedStartDate && hoveredDate && hoveredDate > selectedStartDate) {
        const dateStr = date.toISOString().split("T")[0];
        const startStr = selectedStartDate.toISOString().split("T")[0];
        const hoverStr = hoveredDate.toISOString().split("T")[0];
        return dateStr > startStr && dateStr < hoverStr;
      }
      return false;
    }
    const dateStr = date.toISOString().split("T")[0];
    const startStr = selectedStartDate.toISOString().split("T")[0];
    const endStr = selectedEndDate.toISOString().split("T")[0];
    return dateStr > startStr && dateStr < endStr;
  };

  const isDatePast = (date: Date): boolean => {
    return date < today;
  };

  const handleDateClick = (date: Date) => {
    if (isDatePast(date) || isDateBooked(date)) return;

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      onDateSelect?.(date, date);
    } else if (selectedStartDate && !selectedEndDate) {
      if (date < selectedStartDate) {
        onDateSelect?.(date, selectedStartDate);
      } else {
        onDateSelect?.(selectedStartDate, date);
      }
    }
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentMonth);

  const monthNames = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];

  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  return (
    <BlurFade inView={true} delay={0.2} direction="up">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-color-light p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-color-lightest transition-colors text-color-medium"
            aria-label="Предыдущий месяц"
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
          <h3 className="text-lg sm:text-xl font-bold text-color-dark">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-color-lightest transition-colors text-color-medium"
            aria-label="Следующий месяц"
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

        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-xs sm:text-sm font-semibold text-color-medium py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1 }).map(
            (_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            )
          )}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const date = new Date(year, month, day);
            const isBooked = isDateBooked(date);
            const isSelected = isDateSelected(date);
            const isInRange = isDateInRange(date);
            const isPast = isDatePast(date);

            return (
              <button
                key={day}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
                disabled={isPast || isBooked}
                className={`
                  aspect-square rounded-lg text-sm sm:text-base font-medium transition-all
                  ${
                    isPast
                      ? "text-color-light cursor-not-allowed"
                      : isBooked
                      ? "bg-red-100 text-red-600 cursor-not-allowed"
                      : isSelected
                      ? "bg-color-medium text-white"
                      : isInRange
                      ? "bg-color-medium/20 text-color-medium"
                      : "hover:bg-color-lightest text-color-dark"
                  }
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-color-lightest"></div>
            <span className="text-color-medium">Свободно</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100"></div>
            <span className="text-color-medium">Занято</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-color-medium"></div>
            <span className="text-color-medium">Выбрано</span>
          </div>
        </div>
      </div>
    </BlurFade>
  );
}

