import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Ad from "@/models/Ad";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const adId = resolvedParams.id;

    const body = await request.json();
    const { userId, startDate, endDate, startTime, endTime, periodType, totalPrice } = body;

    if (!userId || !startDate || !endDate || !periodType || !totalPrice) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходимы все поля для бронирования",
        },
        { status: 400 }
      );
    }

    // Валидация ObjectId
    if (!mongoose.Types.ObjectId.isValid(adId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Неверный формат ID",
        },
        { status: 400 }
      );
    }

    const ad = await Ad.findById(adId);
    if (!ad) {
      return NextResponse.json(
        {
          success: false,
          message: "Объявление не найдено",
        },
        { status: 404 }
      );
    }

    // Проверяем, что пользователь не бронирует свое объявление
    if (ad.userId.toString() === userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Нельзя забронировать свое объявление",
        },
        { status: 400 }
      );
    }

    // Проверяем конфликты с существующими бронированиями
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (ad.bookings && ad.bookings.length > 0) {
      const hasConflict = ad.bookings.some((booking: {
        startDate: Date;
        endDate: Date;
        status: string;
      }) => {
        if (booking.status === "cancelled") return false;
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        return (
          (start >= bookingStart && start <= bookingEnd) ||
          (end >= bookingStart && end <= bookingEnd) ||
          (start <= bookingStart && end >= bookingEnd)
        );
      });

      if (hasConflict) {
        return NextResponse.json(
          {
            success: false,
            message: "Выбранные даты уже заняты",
          },
          { status: 409 }
        );
      }
    }

    // Добавляем бронирование
    const newBooking = {
      renterId: new mongoose.Types.ObjectId(userId),
      startDate: start,
      endDate: end,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      period: periodType,
      price: totalPrice,
      status: "pending" as const,
      createdAt: new Date(),
    };

    ad.bookings = ad.bookings || [];
    ad.bookings.push(newBooking);

    const savedAd = await ad.save();
    
    // Получаем ID созданного бронирования
    const bookings = savedAd.bookings || [];
    const createdBooking = bookings.length > 0 ? bookings[bookings.length - 1] : null;

    if (!createdBooking) {
      return NextResponse.json(
        {
          success: false,
          message: "Ошибка при создании бронирования",
        },
        { status: 500 }
      );
    }

    // Используем временный ID или создаем новый
    const bookingId = (createdBooking as { _id?: { toString: () => string } })._id?.toString() || 
                      (createdBooking as { userId?: { toString: () => string } }).userId?.toString() || 
                      new mongoose.Types.ObjectId().toString();

    return NextResponse.json(
      {
        success: true,
        message: "Бронирование успешно создано",
        data: {
          bookingId,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Create booking error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Ошибка при создании бронирования",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

