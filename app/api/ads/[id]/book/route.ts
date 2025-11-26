import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Ad from "@/models/Ad";
import Booking from "@/models/Booking";
import { createBookingSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const adId = resolvedParams.id;

    const body = await request.json();
    const { userId, startDate, endDate, startTime, endTime, periodType, totalPrice, deliveryMethod } = body;

    // Логируем полученные данные для отладки
    if (process.env.NODE_ENV === "development") {
      console.log("Booking request data:", {
        adId,
        userId,
        startDate,
        endDate,
        startTime,
        endTime,
        periodType,
        totalPrice,
        deliveryMethod,
        totalPriceType: typeof totalPrice,
      });
    }

    if (!userId || !startDate || !endDate || !periodType || totalPrice === undefined || totalPrice === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Необходимы все поля для бронирования",
          details: {
            userId: !!userId,
            startDate: !!startDate,
            endDate: !!endDate,
            periodType: !!periodType,
            totalPrice: totalPrice !== undefined && totalPrice !== null,
          },
        },
        { status: 400 }
      );
    }

    // Преобразуем totalPrice в число, если это строка
    const numericTotalPrice = typeof totalPrice === "string" ? parseFloat(totalPrice) : Number(totalPrice);
    if (isNaN(numericTotalPrice) || numericTotalPrice < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Некорректная стоимость бронирования",
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

    // Валидация данных
    const validationResult = createBookingSchema.safeParse({
      adId,
      renterId: userId,
      ownerId: ad.userId.toString(),
      startDate,
      endDate,
      startTime: startTime || null,
      endTime: endTime || null,
      periodType,
      totalPrice: numericTotalPrice,
      status: "pending",
    });

    if (!validationResult.success) {
      console.error("Booking validation errors:", validationResult.error.issues);
      return NextResponse.json(
        {
          success: false,
          message: "Ошибка валидации данных",
          errors: validationResult.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // Проверяем конфликты с существующими бронированиями
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const conflictingBookings = await Booking.find({
      adId: new mongoose.Types.ObjectId(adId),
      status: { $in: ["pending", "confirmed"] },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
      ],
    });

    if (conflictingBookings.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Выбранные даты уже заняты",
        },
        { status: 409 }
      );
    }

    // Создаем бронирование в отдельной коллекции
    const bookingData: {
      adId: mongoose.Types.ObjectId;
      renterId: mongoose.Types.ObjectId;
      ownerId: mongoose.Types.ObjectId;
      startDate: Date;
      endDate: Date;
      startTime?: Date;
      endTime?: Date;
      periodType: "hour" | "day" | "week" | "month";
      totalPrice: number;
      status: "pending" | "confirmed" | "cancelled" | "completed";
      deliveryMethod: "pickup" | "courier";
    } = {
      adId: new mongoose.Types.ObjectId(adId),
      renterId: new mongoose.Types.ObjectId(userId),
      ownerId: ad.userId,
      startDate: start,
      endDate: end,
      periodType,
      totalPrice: numericTotalPrice,
      status: "pending",
      deliveryMethod: (deliveryMethod === "courier" ? "courier" : "pickup") as "pickup" | "courier",
    };

    // Добавляем время только если указан период "hour"
    if (periodType === "hour") {
      if (startTime) {
        bookingData.startTime = new Date(startTime);
      }
      if (endTime) {
        bookingData.endTime = new Date(endTime);
      }
    }

    const booking = await Booking.create(bookingData);

    return NextResponse.json(
      {
        success: true,
        message: "Бронирование успешно создано",
        data: {
          bookingId: booking._id.toString(),
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

