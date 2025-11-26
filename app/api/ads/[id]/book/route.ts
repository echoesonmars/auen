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

    // Валидация данных
    const validationResult = createBookingSchema.safeParse({
      adId,
      renterId: userId,
      ownerId: ad.userId.toString(),
      startDate,
      endDate,
      startTime,
      endTime,
      periodType,
      totalPrice,
      status: "pending",
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Ошибка валидации",
          errors: validationResult.error.issues,
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
    const booking = await Booking.create({
      adId: new mongoose.Types.ObjectId(adId),
      renterId: new mongoose.Types.ObjectId(userId),
      ownerId: ad.userId,
      startDate: start,
      endDate: end,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      periodType,
      totalPrice,
      status: "pending",
    });

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

